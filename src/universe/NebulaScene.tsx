import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { NEBULAE, SHAPE_ID, nebulaImage, type Nebula } from "./nebulae";
import { focus, setNebula, useUniverseState } from "./focusStore";
import { AutopilotCam } from "./AutopilotCam";
import { CanvasCleanup } from "./CanvasCleanup";

// ── True 3D nebula ──────────────────────────────────────────────────────────
// A photograph holds no information about a nebula from any other angle, so we
// don't project one. Instead we build the nebula's REAL 3D structure — the shape
// astronomers actually know it has (a torus for the Helix, dust pillars for the
// Eagle, an expanding shell for the Crab, a blown cavity for Orion) — as a
// volumetric density field, and take the COLOURS from its own Hubble image by
// reading the image's radial colour profile. The result is genuine gas: orbit it
// from any angle, fly inside it, near clouds occlude far ones.

const vert = /* glsl */ `
  varying vec2 vUv;
  void main(){ vUv = position.xy*0.5+0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform mat4 uCamToWorld;
  uniform mat4 uProjInv;
  uniform sampler2D uRamp;   // real colours, sampled from the nebula's Hubble image
  uniform sampler2D uBg;     // star background
  uniform float uShape;
  uniform float uGain;

  float hash(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){
    vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  const mat3 M=mat3(0.0,0.8,0.6, -0.8,0.36,-0.48, -0.6,-0.48,0.64);
  float fbm(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*noise(p); p=M*p*2.02; a*=0.5; } return s; }
  float fbm3(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<3;i++){ s+=a*noise(p); p=M*p*2.02; a*=0.5; } return s; }

  vec3 bg(vec3 d){
    float u=atan(d.z,d.x)/6.2831853+0.5, v=asin(clamp(d.y,-1.0,1.0))/3.14159265+0.5;
    vec3 c=texture2D(uBg, vec2(u,v)).rgb; return c*c*1.1;
  }

  // ── the real structures (pure shape masks; turbulence is applied after) ────
  float shapeMask(vec3 p){
    float r = length(p);
    float ang = atan(p.z, p.x);

    if(uShape < 0.5){
      // CAVITY — hot young stars have blown a hollow in a molecular cloud
      float wall = smoothstep(1.22, 0.40, r) * smoothstep(0.12, 0.50, r);
      float core = smoothstep(0.38, 0.0, r) * 0.5;         // ionised glow inside
      return wall + core;
    } else if(uShape < 1.5){
      // TORUS — a ring of gas thrown off by a dying star (Helix, Ring)
      vec2 q = vec2(length(p.xz) - 0.66, p.y*1.35);
      float tor = smoothstep(0.27, 0.03, length(q));
      // radial "cometary knots" streaming inward — the Helix's signature spokes
      float spokes = 0.55 + 0.55*sin(ang*44.0 + fbm3(p*2.4)*7.0);
      tor *= 0.55 + 0.65*spokes;
      float inner = smoothstep(0.42, 0.0, r) * 0.45;       // central star's cavity
      return tor + inner;
    } else if(uShape < 2.5){
      // BIPOLAR — twin lobes vented from a waist (Dumbbell, Cat's Eye)
      vec3 a = vec3(p.x, abs(p.y), p.z);
      float lobe = smoothstep(0.58, 0.04, length((a - vec3(0.0,0.50,0.0))*vec3(1.0,0.70,1.0)));
      float waist = smoothstep(0.28, 0.0, length(p.xz)) * smoothstep(0.40, 0.0, abs(p.y));
      return lobe + 0.7*waist;
    } else if(uShape < 3.5){
      // PILLARS — dense dust columns being eroded by stellar wind (Eagle, Carina)
      float cols = fbm3(vec3(p.xz*2.2, 5.0));
      float pil = smoothstep(0.44, 0.70, cols) * smoothstep(1.0, -0.6, p.y);
      float amb = smoothstep(1.28, 0.10, r) * 0.30;        // glowing gas around them
      return pil*1.5 + amb;
    } else if(uShape < 4.5){
      // REMNANT — an expanding filamentary shell from a supernova (Crab, Veil)
      float sh = exp(-pow((r-0.80)/0.19, 2.0));
      float fil = smoothstep(0.38, 0.88, fbm(p*4.2));      // shredded filaments
      return sh * (0.25 + 1.5*fil);
    }
    // DIFFUSE — dust reflecting nearby starlight (Pleiades)
    return smoothstep(1.12, 0.02, r);
  }

  float density(vec3 p, out float shade){
    float m = shapeMask(p);
    if(m <= 0.002){ shade = 0.0; return 0.0; }
    // two scales of turbulence: billowing clouds + fine wisps, with contrast so
    // the gas carves into filaments and voids instead of a smooth blob
    float coarse = fbm(p*2.4 + vec3(0.0, uTime*0.03, 0.0));
    float fine   = fbm(p*7.0 + 4.0);
    float turb   = coarse*0.8 + fine*0.5;
    turb = turb*turb*2.0;
    shade = turb;
    return smoothstep(0.06, 0.62, m * turb);
  }

  void main(){
    vec2 ndc=vUv*2.0-1.0;
    vec4 vp=uProjInv*vec4(ndc,-1.0,1.0); vp/=vp.w;
    vec3 rd=normalize((uCamToWorld*vec4(vp.xyz,0.0)).xyz);
    vec3 ro=uCamPos;

    const float BR = 1.45;
    float b=dot(ro,rd), cc=dot(ro,ro)-BR*BR, disc=b*b-cc;
    vec3 col=vec3(0.0); float transmit=1.0;
    if(disc>0.0){
      float t0=max(-b-sqrt(disc),0.0), t1=-b+sqrt(disc);
      float dt=(t1-t0)/72.0;
      float t=t0 + dt*hash(vec3(gl_FragCoord.xy, uTime));   // jitter → no banding
      for(int i=0;i<72;i++){
        if(transmit<0.02) break;
        vec3 p = ro + rd*t;
        float shade;
        float dens = density(p, shade);
        if(dens > 0.003){
          // real colours: read the nebula's own Hubble image radially
          float rr = clamp(length(p)/1.25, 0.0, 1.0);
          vec3 c = texture2D(uRamp, vec2(rr, 0.5)).rgb;
          c *= 0.65 + 0.85*shade;                   // brighter in the dense filaments
          float e = dens * dt * 13.0;
          col += transmit * c * e * uGain;
          transmit *= exp(-e * 1.25);               // near gas shadows far gas
        }
        t += dt;
      }
    }
    col += transmit * bg(rd) * 0.9;
    col = 1.0 - exp(-col*1.5);
    col = pow(col, vec3(0.9));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Read the nebula's real Hubble image into a radial colour ramp (centre → rim). */
function buildRamp(img: HTMLImageElement, bins = 64): THREE.DataTexture {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, S, S);
  const px = ctx.getImageData(0, 0, S, S).data;

  const sum = new Float64Array(bins * 3);
  const cnt = new Float64Array(bins);
  const half = S / 2;
  // Skip the outer frame: several NASA press images carry captions, borders and
  // inset panels, and that white text would otherwise bleach the gas colour.
  const lo = Math.floor(S * 0.08);
  const hi = Math.ceil(S * 0.92);
  for (let y = lo; y < hi; y++) {
    for (let x = lo; x < hi; x++) {
      const dx = (x - half) / half;
      const dy = (y - half) / half;
      const r = Math.min(1, Math.hypot(dx, dy));
      const b = Math.min(bins - 1, Math.floor(r * bins));
      const i = (y * S + x) * 4;
      const R = px[i];
      const G = px[i + 1];
      const B = px[i + 2];
      const mx = Math.max(R, G, B);
      const mn = Math.min(R, G, B);
      // Weight by SATURATION × brightness: coloured gas dominates, while white
      // stars, captions and black sky contribute almost nothing.
      const sat = mx > 8 ? (mx - mn) / mx : 0;
      const w = (mx / 255) * (0.15 + sat) + 0.01;
      sum[b * 3] += R * w;
      sum[b * 3 + 1] += G * w;
      sum[b * 3 + 2] += B * w;
      cnt[b] += w;
    }
  }
  const data = new Uint8Array(bins * 4);
  for (let b = 0; b < bins; b++) {
    const c = cnt[b] || 1;
    // lift saturation/brightness a touch so the gas reads as emissive
    data[b * 4] = Math.min(255, (sum[b * 3] / c) * 1.35);
    data[b * 4 + 1] = Math.min(255, (sum[b * 3 + 1] / c) * 1.35);
    data[b * 4 + 2] = Math.min(255, (sum[b * 3 + 2] / c) * 1.35);
    data[b * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, bins, 1, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function ScreenTri({ material }: { material: THREE.ShaderMaterial }) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3),
    );
    return g;
  }, []);
  return <mesh geometry={geom} material={material} frustumCulled={false} renderOrder={-10} />;
}

const EXIT_DIST = 5.6;

function Volume({ nebula }: { nebula: Nebula }) {
  const [img, sky] = useTexture([nebulaImage(nebula), "/textures/8k_stars_milky_way.jpg"]);
  sky.wrapS = THREE.RepeatWrapping;
  sky.colorSpace = THREE.SRGBColorSpace;

  const [ramp, setRamp] = useState<THREE.DataTexture | null>(null);
  useEffect(() => {
    const el = img.image as HTMLImageElement | undefined;
    if (el?.width) setRamp(buildRamp(el));
  }, [img]);

  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const armed = useRef(false);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTime: { value: 0 },
          uCamPos: { value: new THREE.Vector3() },
          uCamToWorld: { value: new THREE.Matrix4() },
          uProjInv: { value: new THREE.Matrix4() },
          uRamp: { value: ramp },
          uBg: { value: sky },
          uShape: { value: SHAPE_ID[nebula.shape] },
          uGain: { value: 1.5 },
        },
      }),
    [sky, ramp, nebula.shape],
  );

  useFrame((_, dt) => {
    camera.updateMatrixWorld();
    const u = material.uniforms;
    u.uTime.value += dt;
    u.uCamPos.value.copy(camera.position);
    u.uCamToWorld.value.copy(camera.matrixWorld);
    u.uProjInv.value.copy(camera.projectionMatrixInverse);
    if (!controls) return;
    if (focus.autopilot) return; // the tour opens and closes the nebula itself
    const d = controls.distance;
    if (d < EXIT_DIST - 0.8) armed.current = true;
    // only ever close ourselves — the store may already hold a different nebula
    if (armed.current && d > EXIT_DIST && focus.nebula === nebula.name) setNebula(null);
  });

  if (!ramp) return null;
  return <ScreenTri material={material} />;
}

export function NebulaScene() {
  const { nebula: name } = useUniverseState();
  const nebula = useMemo(() => NEBULAE.find((n) => n.name === name), [name]);
  if (!nebula) return null;
  const ly = Math.round(nebula.d * 3.2616);

  return (
    <div className="fixed inset-0 z-[119] bg-black">
      <Canvas
        camera={{ position: [0, 0.5, 2.9], fov: 55, near: 0.01, far: 100 }}
        gl={{ antialias: false }}
        dpr={[0.7, 1.1]}
      >
        <Volume nebula={nebula} />
        {/* real 3D gas — orbit it from any angle, fly right inside it */}
        <CameraControls makeDefault minDistance={0.08} maxDistance={5.8} smoothTime={0.6} />
        <AutopilotCam speed={0.05} />
        <CanvasCleanup />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 max-w-sm rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-lime backdrop-blur">
        {nebula.name}
        <span className="block capitalize text-white/55">
          {nebula.type} nebula · {nebula.shape} · {ly.toLocaleString()} light-years
        </span>
        <span className="block text-white/40">
          true 3D gas · colours read from its Hubble image
        </span>
      </div>

      <button
        onClick={() => setNebula(null)}
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        ↩ Back to the stars
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 font-mono text-[11px] leading-relaxed text-white/45">
        drag — orbit any angle · scroll — fly inside the gas
        <span className="block text-white/25">colour source: NASA / ESA / Hubble</span>
      </div>
    </div>
  );
}
