import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Html, useTexture } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { BackSide, SRGBColorSpace } from "three";
import type CameraControlsImpl from "camera-controls";
import { StarField } from "./StarField";
import { Nebulae } from "./NebulaField";
import { focus, setLevel, useUniverseState } from "./focusStore";
import { EntryTransition } from "./useEntryTransition";
import { AutopilotCam } from "./AutopilotCam";
import { CanvasCleanup } from "./CanvasCleanup";
import { sceneDpr } from "./perf";

// Closer to Sol than this and we drop back into the solar system. Kept well
// inside the nearest star (Rigil Kentaurus, 1.3 pc) so you can fly among the
// neighbours before the handoff takes over.
const RETURN_DIST = 0.8;

// Pull out past this and the galaxy takes over. Extended so the whole nebula
// set — out to Carina at ~2.3 kpc — is reachable before the handoff.
const LEAVE_DIST = 2600;
const LABEL_MAG = 1.2; // only label stars brighter than this (18 of them)

interface NamedStar {
  n: string;
  x: number;
  y: number;
  z: number;
  m: number;
}

// Milky Way sky, pinned to the camera and drawn first so it never occludes stars.
function Sky() {
  const mesh = useRef<THREE.Mesh>(null!);
  const tex = useTexture("/textures/8k_stars_milky_way.jpg");
  tex.colorSpace = SRGBColorSpace;
  useFrame((s) => mesh.current.position.copy(s.camera.position));
  return (
    <mesh ref={mesh} renderOrder={-1}>
      <sphereGeometry args={[4000, 64, 64]} />
      <meshBasicMaterial map={tex} side={BackSide} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

// Our Sun, marked at the origin. At 1 unit = 1 parsec the real Sun is ~5e-9 units
// across, so this is a marker: scaled with camera distance to hold a constant
// on-screen size instead of ballooning into a disc as you approach.
function Sol() {
  const g = useRef<THREE.Group>(null!);
  useFrame((s) => {
    const d = s.camera.position.length(); // Sol sits at the origin
    g.current.scale.setScalar(Math.max(0.01, d * 0.012));
  });
  return (
    <>
      <group ref={g}>
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#fff3d0" toneMapped={false} />
        </mesh>
      </group>
      <Html center position={[0, 0, 0]}>
        <div className="pointer-events-none -translate-y-5 whitespace-nowrap font-mono text-[10px] tracking-widest text-lime drop-shadow-[0_0_5px_rgba(0,0,0,0.95)]">
          SOL
        </div>
      </Html>
    </>
  );
}

// Named stars, decluttered in screen space: labels are placed brightest-first and
// a label is dropped if it would land within MIN_GAP px of one already placed
// (the nearest bright stars all sit within a few parsecs of Sol, so from far out
// they'd otherwise pile into an unreadable blob).
const MIN_GAP = 62;

function Labels() {
  const [stars, setStars] = useState<NamedStar[]>([]);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useRef(new THREE.Vector3()).current;

  useEffect(() => {
    let cancelled = false;
    fetch("/data/star-names.json")
      .then((r) => r.json())
      .then((all: NamedStar[]) => {
        if (cancelled) return;
        setStars(all.filter((s) => s.m < LABEL_MAG).sort((a, b) => a.m - b.m));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useFrame(() => {
    // Sol's own label owns its screen position first.
    v.set(0, 0, 0).project(camera);
    const placed = [
      { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height },
    ];

    for (let i = 0; i < stars.length; i++) {
      const el = refs.current[i];
      if (!el) continue;
      const s = stars[i];
      v.set(s.x, s.y, s.z).project(camera);

      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      let show = v.z < 1 && Math.abs(v.x) < 1 && Math.abs(v.y) < 1;
      if (show) {
        for (const p of placed) {
          if (Math.hypot(p.x - x, p.y - y) < MIN_GAP) {
            show = false;
            break;
          }
        }
      }
      if (show) placed.push({ x, y });
      el.style.opacity = show ? "1" : "0";
    }
  });

  return (
    <>
      {stars.map((s, i) => (
        <Html key={s.n} center position={[s.x, s.y, s.z]}>
          <div
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="pointer-events-none -translate-y-3 whitespace-nowrap font-mono text-[10px] text-white/75 opacity-0 drop-shadow-[0_0_5px_rgba(0,0,0,0.95)] transition-opacity duration-300"
          >
            {s.n}
          </div>
        </Html>
      ))}
    </>
  );
}

function ReturnWatcher() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!controls) return;
    controls.dollySpeed = 0.62; // parsec scale — brisk enough to reach the far nebulae
    controls.dollyToCursor = true; // zoom toward whatever star you point at
    controls.truckSpeed = 2.5; // right-drag pans across the field
    if (!import.meta.env.DEV) return;
    const g = globalThis as unknown as { __starControls?: unknown };
    g.__starControls = controls;
    return () => {
      g.__starControls = undefined;
    };
  }, [controls]);

  useFrame(() => {
    if (focus.level !== 2 || focus.autopilot) return;
    // Distance to Sol (origin) — robust to panning, unlike controls.distance.
    const d = camera.position.length();
    if (d < RETURN_DIST) setLevel(1);
    else if (d > LEAVE_DIST) setLevel(3);
  });
  return null;
}

export function StarScene() {
  // Pause while a nebula close-up covers the field (it fully occludes).
  const { nebula } = useUniverseState();
  return (
    <div className="fixed inset-0 z-[110] bg-black">
      <Canvas
        camera={{ position: [0, 22, 85], near: 0.05, far: 9000, fov: 55 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={sceneDpr([1, 1.5], [1, 1.2])}
        frameloop={nebula ? "never" : "always"}
      >
        <Suspense fallback={null}>
          <Sky />
          <StarField />
          <Nebulae />
          <Sol />
          <Labels />
        </Suspense>
        <CameraControls makeDefault minDistance={0.25} maxDistance={2900} smoothTime={0.5} />
        <EntryTransition
          restEye={[0, 22, 85]}
          restTarget={[0, 0, 0]}
          outAnchor={[0, 0, 0]}
          outStartDist={6}
        />
        <ReturnWatcher />
        <AutopilotCam speed={0.07} />
        <EffectComposer>
          <Bloom intensity={0.7} luminanceThreshold={0.25} mipmapBlur radius={0.6} />
        </EffectComposer>
        <CanvasCleanup />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100vw-11rem)] rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-lime backdrop-blur">
        Stellar neighbourhood
        <span className="block text-white/55">
          109,400 real stars · HYG catalogue · 1 unit = 1 parsec
        </span>
      </div>

      <button
        onClick={() => setLevel(1)}
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        ↩ Back to Sol
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 hidden font-mono text-[11px] leading-relaxed text-white/45 sm:block">
        left-drag — rotate · right-drag — move · scroll — zoom to cursor
        <span className="block text-white/30">
          zoom in on Sol for its solar system · zoom out for the galaxy
        </span>
      </div>
    </div>
  );
}
