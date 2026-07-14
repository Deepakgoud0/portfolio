import { useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Html } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { PointCloud } from "./PointCloud";
import { ANCHORS, buildCosmicWeb, N_TOTAL, R_MAX } from "./cosmicWeb";
import { focus, setLevel } from "./focusStore";
import { EntryTransition } from "./useEntryTransition";
import { CanvasCleanup } from "./CanvasCleanup";

// Fly back within this of the origin (Mpc) and the Local Group takes over.
// Its ~1 Mpc span is a speck here, so anywhere near home hands off.
const RETURN_DIST = 6;

function Web() {
  const web = useMemo(() => buildCosmicWeb(), []);

  // faint filament lines under the galaxy points, so the web reads even where
  // the point density thins out
  const lineGeom = useMemo(() => {
    const pts: number[] = [];
    for (const [i, j] of web.edges) {
      pts.push(...web.nodes[i], ...web.nodes[j]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [web]);

  return (
    <>
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial
          color="#3a4a7a"
          transparent
          opacity={0.28}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
      <PointCloud positions={web.positions} colors={web.colors} sizes={web.sizes} k={55} maxSize={7} />
    </>
  );
}

// The Milky Way / Local Group, one warm dot at the origin — "you are here".
function Home() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial color="#c6ff3d" toneMapped={false} />
      </mesh>
      <Html center>
        <div className="pointer-events-none -translate-y-5 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-lime">
          LOCAL GROUP
          <span className="block tracking-normal text-white/55">you are here</span>
        </div>
      </Html>
    </>
  );
}

function AnchorMarks() {
  return (
    <>
      {ANCHORS.map((a) => {
        const L = Math.hypot(...a.dir) || 1;
        const p: [number, number, number] = [
          (a.dir[0] / L) * a.dist,
          (a.dir[1] / L) * a.dist,
          (a.dir[2] / L) * a.dist,
        ];
        return (
          <group key={a.name} position={p}>
            <mesh>
              <sphereGeometry args={[1.6, 12, 12]} />
              <meshBasicMaterial color="#ffe9c8" toneMapped={false} />
            </mesh>
            <Html center>
              <div className="pointer-events-none -translate-y-4 whitespace-nowrap rounded bg-black/50 px-1.5 py-0.5 text-center font-mono text-[10px] tracking-wide text-white/90">
                {a.name}
                <span className="block text-[9px] tracking-normal text-white/45">{a.dist} Mpc</span>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}

function ReturnWatcher() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!controls) return;
    controls.dollySpeed = 0.5;
    controls.dollyToCursor = true; // zoom toward whatever cluster you point at
    controls.truckSpeed = 2.5; // right-drag pans across the web
    if (!import.meta.env.DEV) return;
    const g = globalThis as unknown as { __cwControls?: unknown };
    g.__cwControls = controls;
    return () => {
      g.__cwControls = undefined;
    };
  }, [controls]);
  useFrame(() => {
    if (focus.level !== 5) return;
    if (camera.position.length() < RETURN_DIST) setLevel(4);
  });
  return null;
}

export function CosmicWebScene() {
  return (
    <div className="fixed inset-0 z-[116] bg-black">
      <Canvas
        camera={{ position: [230, 170, 420], fov: 55, near: 0.5, far: 8000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 1.5]}
      >
        <Web />
        <Home />
        <AnchorMarks />
        <CameraControls makeDefault minDistance={4} maxDistance={1400} smoothTime={0.5} />
        <EntryTransition
          restEye={[230, 170, 420]}
          restTarget={[0, 0, 0]}
          outAnchor={[0, 0, 0]}
          outStartDist={25}
        />
        <ReturnWatcher />
        <EffectComposer>
          <Bloom intensity={0.6} luminanceThreshold={0.3} mipmapBlur radius={0.7} />
        </EffectComposer>
        <CanvasCleanup />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 max-w-md rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-lime backdrop-blur">
        The cosmic web · large-scale structure
        <span className="block text-white/55">
          {(N_TOTAL / 1000) | 0}k galaxies · filaments &amp; voids · 1 unit = 1 megaparsec
        </span>
        <span className="block text-white/40">
          span ≈ {2 * R_MAX} Mpc ≈ 2 billion light-years · real superclusters anchored at
          real distances; the web itself matches survey statistics
        </span>
      </div>

      <button
        onClick={() => setLevel(4)}
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        ↩ Back to the Local Group
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 max-w-lg font-mono text-[11px] leading-relaxed text-white/45">
        left-drag — rotate · right-drag — move · scroll — zoom to cursor
        <span className="block text-white/30">
          this is the top of the ladder — beyond the filaments lies the cosmic horizon,
          the edge of what light has had time to reach us. we cannot see past it.
        </span>
      </div>
    </div>
  );
}
