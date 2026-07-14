import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { setBlackHole } from "./focusStore";
import { CanvasCleanup } from "./CanvasCleanup";

// ── Sagittarius A* — a ray-marched Schwarzschild black hole ─────────────────
// Each pixel fires a photon that we integrate through curved spacetime:
//   d²x/dλ² = -1.5 · h² · x / r⁵   (null geodesic, Schwarzschild, geometric units)
// Rays that cross the equatorial plane sample the accretion disk (temperature
// gradient + Doppler beaming + turbulence); rays that escape sample the lensed
// Milky Way behind; rays that fall inside the horizon go black. The photon ring
// and the "Interstellar" disk-wrap emerge for free from the bent light paths.

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform vec3 uCamPos;
  uniform mat4 uCamToWorld;
  uniform mat4 uProjInv;
  uniform sampler2D uBg;

  const float RS = 1.0;          // Schwarzschild radius
  const float DISK_IN = 2.2;     // inner edge (~ISCO)
  const float DISK_OUT = 11.0;   // outer edge
  const float R_ESC = 55.0;      // escape radius
  const float ROT_SPEED = 3.6;   // disk spin (cinematic; a real SMBH barely moves)
  const float FLOW_SPEED = 0.6;  // turbulent inflow rate
  const int STEPS = 280;

  float hash(vec3 p){ p = fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
  float noise(vec3 x){
    vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),
                   mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
                   mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=0.5;} return s; }

  vec3 bg(vec3 dir){
    float u = atan(dir.z, dir.x)/6.2831853 + 0.5;
    float v = asin(clamp(dir.y,-1.0,1.0))/3.14159265 + 0.5;
    vec3 c = texture2D(uBg, vec2(u, v)).rgb;
    return c*c*1.3;
  }

  // Blackbody-ish ramp: outer = deep orange, inner = white-hot / blue.
  vec3 diskColor(float t){
    vec3 cool = vec3(1.0, 0.30, 0.06);
    vec3 mid  = vec3(1.0, 0.72, 0.34);
    vec3 hot  = vec3(0.85, 0.95, 1.25);
    vec3 c = mix(cool, mid, smoothstep(0.0, 0.5, t));
    return mix(c, hot, smoothstep(0.5, 1.0, t));
  }

  void main(){
    vec2 ndc = vUv*2.0 - 1.0;
    vec4 view = uProjInv * vec4(ndc, -1.0, 1.0); view /= view.w;
    vec3 dir = normalize((uCamToWorld * vec4(view.xyz, 0.0)).xyz);
    vec3 pos = uCamPos;

    float h2 = dot(cross(pos, dir), cross(pos, dir));

    vec3 color = vec3(0.0);
    float transmit = 1.0;
    bool captured = false;
    float prevY = pos.y;

    for(int i=0;i<STEPS;i++){
      float r2 = dot(pos, pos);
      float r = sqrt(r2);
      float dt = clamp(r*0.12, 0.06, 1.4);

      vec3 accel = -1.5 * h2 * pos / (r2*r2*r);   // -1.5 h² x / r⁵
      vec3 npos = pos + dir*dt + 0.5*accel*dt*dt;
      vec3 ndir = normalize(dir + accel*dt);

      if(dot(npos,npos) < RS*RS){ captured = true; break; }

      // accretion-disk crossing (equatorial plane y=0)
      if(prevY * npos.y < 0.0){
        float f = prevY/(prevY - npos.y);
        vec3 hit = mix(pos, npos, f);
        float rr = length(hit.xz);
        if(rr > DISK_IN && rr < DISK_OUT){
          float t = clamp((DISK_OUT-rr)/(DISK_OUT-DISK_IN), 0.0, 1.0);
          float ang = atan(hit.z, hit.x);

          // Keplerian differential rotation — inner gas laps the outer gas.
          float orbit = ang + uTime * ROT_SPEED / pow(rr, 1.5);
          // Continuous polar domain (cos/sin removes the atan seam) with a LOW radial
          // frequency + domain warping — this is what makes the gas read as smooth
          // wispy turbulence instead of concentric tree-rings.
          vec2 dp = vec2(cos(orbit), sin(orbit)) * (1.4 + rr*0.30);
          float warp = fbm(vec3(dp*0.8, uTime*FLOW_SPEED*0.06));
          float turb = fbm(vec3(dp*0.8 + warp*1.7, rr*0.06 + uTime*FLOW_SPEED*0.09));
          turb = turb*turb*1.7;                            // sharpen the filaments for clarity

          // soft edges: fade in at the ISCO, taper out at the rim (no hard rings)
          float dens = smoothstep(DISK_IN, DISK_IN+0.9, rr)
                     * smoothstep(DISK_OUT, DISK_OUT-3.2, rr)
                     * (0.22 + 0.95*turb);

          // relativistic Doppler beaming: the disk orbits at a fair fraction of c,
          // so the side sweeping toward the camera is far brighter and blue-shifted.
          vec3 vdir = normalize(vec3(-hit.z, 0.0, hit.x));
          float beta = min(0.62/sqrt(rr), 0.9);
          float approach = dot(vdir, -ndir);              // >0 = coming toward us
          float dop = 1.0/max(1.0 - beta*approach, 0.05);
          float beam = pow(dop, 3.2);
          vec3 dc = diskColor(t) * (0.6 + 0.75*turb);
          dc.r *= 1.0 - 0.28*approach;                    // blue-/red-shift tint
          dc.b *= 1.0 + 0.40*approach;
          color += transmit * dc * beam * dens * 1.3;
          transmit *= clamp(1.0 - dens*0.8, 0.0, 1.0);
        }
      }

      prevY = npos.y;
      pos = npos; dir = ndir;
      if(dot(pos,pos) > R_ESC*R_ESC) break;
    }

    if(!captured) color += transmit * bg(dir);

    // thin bright photon ring accent from grazing rays already handled by wrap;
    // filmic-ish tonemap
    color = 1.0 - exp(-color*1.25);
    color = pow(color, vec3(0.95));
    gl_FragColor = vec4(color, 1.0);
  }
`;

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

const EXIT_DIST = 42;

function BlackHole() {
  const bg = useTexture("/textures/8k_stars_milky_way.jpg");
  bg.wrapS = THREE.RepeatWrapping;
  bg.colorSpace = THREE.SRGBColorSpace;

  const { size } = useThree();
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
          uResolution: { value: new THREE.Vector2(1, 1) },
          uTime: { value: 0 },
          uCamPos: { value: new THREE.Vector3() },
          uCamToWorld: { value: new THREE.Matrix4() },
          uProjInv: { value: new THREE.Matrix4() },
          uBg: { value: bg },
        },
      }),
    [bg],
  );

  useFrame((_, dt) => {
    camera.updateMatrixWorld();
    const u = material.uniforms;
    u.uTime.value += dt;
    u.uResolution.value.set(size.width, size.height);
    u.uCamPos.value.copy(camera.position);
    u.uCamToWorld.value.copy(camera.matrixWorld);
    u.uProjInv.value.copy(camera.projectionMatrixInverse);

    // Exit by zooming out — but only after the camera has settled inside the
    // scene at least once, so the mount frame can't bounce us straight out.
    if (!controls) return;
    const d = controls.distance;
    if (import.meta.env.DEV) {
      (globalThis as unknown as { __bhControls?: unknown }).__bhControls = controls;
    }
    if (d < EXIT_DIST - 5) armed.current = true;
    if (armed.current && d > EXIT_DIST) setBlackHole(false);
  });

  return <ScreenTri material={material} />;
}

export function BlackHoleScene() {
  return (
    <div className="fixed inset-0 z-[118] bg-black">
      <Canvas
        camera={{ position: [0, 3.2, 15], fov: 55, near: 0.01, far: 2000 }}
        gl={{ antialias: false }}
        dpr={[1, 1.6]}
      >
        <BlackHole />
        <CameraControls makeDefault minDistance={4.5} maxDistance={44} smoothTime={0.5} />
        <CanvasCleanup />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 max-w-sm rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-lime backdrop-blur">
        Sagittarius A* · supermassive black hole
        <span className="block text-white/55">
          4.3 million M☉ · the gravitational anchor of the Milky Way
        </span>
        <span className="block text-white/40">
          light bent by real Schwarzschild geodesics · accretion disk with Doppler
          beaming &amp; the photon ring
        </span>
      </div>

      <button
        onClick={() => setBlackHole(false)}
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        ↩ Back to the galaxy
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 font-mono text-[11px] leading-relaxed text-white/45">
        drag — orbit · scroll — zoom
        <span className="block text-white/30">
          the bright side is matter racing toward you at near light-speed
        </span>
      </div>
    </div>
  );
}
