import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, CameraControls, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { PointCloud } from "./PointCloud";
import { buildArmNebulae, buildGalaxy, N_TOTAL, R_SUN, SUN_POS } from "./galaxyData";
import { makeNebulaTexture } from "./nebulaTexture";
import { focus, setBlackHole, setLevel, useUniverseState } from "./focusStore";
import { EntryTransition } from "./useEntryTransition";
import { AutopilotCam } from "./AutopilotCam";
import { CanvasCleanup } from "./CanvasCleanup";

// Fly within this of the Sun (kpc) and we drop back to the stellar neighbourhood,
// whose 700 pc bubble is comfortably inside it.
const RETURN_DIST = 0.9;

// Pull back past this and the Local Group takes over. Well outside the 15.5 kpc
// stellar disc, so the galaxy reads as a whole object before we hand off.
const LEAVE_DIST = 290;

function Galaxy() {
  const g = useMemo(() => buildGalaxy(), []);
  return (
    <PointCloud positions={g.positions} colors={g.colors} sizes={g.sizes} k={30} maxSize={9} />
  );
}

// Pink star-forming clouds tracing the spiral arms — makes the disk read as a
// real photographed galaxy rather than bare points.
function ArmNebulae() {
  const tex = useMemo(() => makeNebulaTexture(41), []);
  const nebs = useMemo(() => buildArmNebulae(60), []);
  return (
    <>
      {nebs.map((n, i) => (
        <Billboard key={i} position={n.pos}>
          <mesh scale={n.size}>
            <planeGeometry args={[2, 2]} />
            <meshBasicMaterial
              map={tex}
              color={n.warm ? "#ff4d80" : "#6f9bff"}
              transparent
              opacity={0.26}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>
        </Billboard>
      ))}
    </>
  );
}

// Markers hold a constant on-screen size — at 1 unit = 1 kpc, a real star is ~10^-9 units.
function Marker({
  position,
  color,
  label,
  sub,
  onClick,
  cta,
}: {
  position: [number, number, number];
  color: string;
  label: string;
  sub?: string;
  onClick?: () => void;
  cta?: string;
}) {
  const g = useRef<THREE.Group>(null!);
  const p = useRef(new THREE.Vector3(...position)).current;
  useFrame((s) => {
    g.current.scale.setScalar(Math.max(0.004, s.camera.position.distanceTo(p) * 0.006));
  });
  return (
    <group position={position}>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
      <Html center>
        <div
          onClick={onClick}
          className={`-translate-y-7 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 text-center font-mono text-[10px] leading-tight tracking-widest text-white ${
            onClick ? "pointer-events-auto cursor-pointer hover:text-lime" : "pointer-events-none"
          }`}
        >
          {label}
          {sub && <span className="block tracking-normal text-white/60">{sub}</span>}
          {cta && <span className="block tracking-normal text-lime/90">{cta}</span>}
        </div>
      </Html>
    </group>
  );
}

function ReturnWatcher() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const sun = useRef(new THREE.Vector3(...SUN_POS)).current;

  useEffect(() => {
    if (!controls) return;
    controls.dollySpeed = 0.5; // kiloparsec scale: keep the galaxy explorable
    controls.dollyToCursor = true; // zoom toward whatever you point at
    controls.truckSpeed = 2.5; // right-drag pans across the disc
    if (!import.meta.env.DEV) return;
    const g = globalThis as unknown as { __galaxyControls?: unknown };
    g.__galaxyControls = controls;
    return () => {
      g.__galaxyControls = undefined;
    };
  }, [controls]);

  useFrame(() => {
    if (focus.level !== 3 || focus.autopilot) return;
    if (camera.position.distanceTo(sun) < RETURN_DIST) setLevel(2);
    else if (camera.position.length() > LEAVE_DIST) setLevel(4); // distance to galactic centre (origin)
  });
  return null;
}

export function GalaxyScene() {
  // The black-hole overlay covers this scene fully — stop rendering it underneath.
  const { blackHole } = useUniverseState();
  return (
    <div className="fixed inset-0 z-[112] bg-black">
      <Canvas
        camera={{ position: [0, 19, 33], fov: 50, near: 0.05, far: 4000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 1.5]}
        frameloop={blackHole ? "never" : "always"}
      >
        <Galaxy />
        <ArmNebulae />
        <Marker position={SUN_POS} color="#c6ff3d" label="SOL" sub="you are here" />
        <Marker
          position={[0, 0, 0]}
          color="#ffd9a0"
          label="SGR A*"
          sub="4.3M M☉"
          cta="▸ enter the black hole"
          onClick={() => setBlackHole(true)}
        />
        <CameraControls makeDefault minDistance={0.3} maxDistance={340} smoothTime={0.5} />
        <EntryTransition
          restEye={[0, 19, 33]}
          restTarget={[0, 0, 0]}
          outAnchor={[SUN_POS[0], SUN_POS[1], SUN_POS[2]]}
          outStartDist={5}
        />
        <ReturnWatcher />
        <AutopilotCam speed={0.06} />
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.42} mipmapBlur radius={0.7} />
        </EffectComposer>
        <CanvasCleanup />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-lime backdrop-blur">
        Milky Way · barred spiral
        <span className="block text-white/55">
          {N_TOTAL.toLocaleString()} points · 1 unit = 1 kiloparsec
        </span>
        <span className="block text-white/40">
          Sun orbits {R_SUN} kpc out, between the Sagittarius and Perseus arms
        </span>
      </div>

      <button
        onClick={() => setLevel(2)}
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        ↩ Back to Sol
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 font-mono text-[11px] leading-relaxed text-white/45">
        left-drag — rotate · right-drag — move · scroll — zoom to cursor
        <span className="block text-white/30">
          fly to the Sol marker for its stars · zoom out for the Local Group
        </span>
      </div>
    </div>
  );
}
