import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, CameraControls, Html, Line } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { MEMBERS, SIZE_EXAGGERATION, sceneDiameter, toScene, type Member } from "./localGroup";
import { SUN_POS } from "./galaxyData";
import { spiralTexture, blobTexture } from "./galaxyTextures";
import { focus, setLevel } from "./focusStore";
import { EntryTransition } from "./useEntryTransition";
import { AutopilotCam } from "./AutopilotCam";
import { CanvasCleanup } from "./CanvasCleanup";
import { sceneDpr } from "./perf";

// Fly back within this of the Milky Way (kpc) and the galaxy scene takes over.
// Comfortably outside the 15.5 kpc stellar disc and its satellites' orbits.
const RETURN_DIST = 45;

// Pull out past this and the cosmic web takes over. Measured from the group's
// centre (below), not the Milky Way — the scene is framed on the MW–Andromeda
// axis, so the camera orbits that midpoint, and only distance-from-centre grows
// monotonically as you zoom out. (Distance-from-MW plateaus below any usable
// threshold because of the framing offset.)
const LEAVE_DIST = 2300;

// Midpoint of the Milky Way–Andromeda axis ≈ the Local Group's barycentre.
const GROUP_CENTER = new THREE.Vector3(...toScene(121.17, -21.57, 780)).multiplyScalar(0.5);

// Resting frame: looking at the barycentre from off the MW–Andromeda axis.
const REST_TARGET: [number, number, number] = [GROUP_CENTER.x, GROUP_CENTER.y, GROUP_CENTER.z];
const REST_EYE_V = GROUP_CENTER.clone().add(new THREE.Vector3(0.3, 0.82, -0.49).multiplyScalar(1150));
const REST_EYE: [number, number, number] = [REST_EYE_V.x, REST_EYE_V.y, REST_EYE_V.z];

function useGalaxyMaterial(map: THREE.Texture, color: string, opacity = 1) {
  return useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map,
        color,
        opacity,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [map, color, opacity],
  );
}

/**
 * Inclination is measured from Earth — the angle between the disc's normal and
 * our line of sight — so we build the normal from that line rather than from a
 * fixed axis. The remaining freedom (roll about the line of sight) is the
 * position angle, which we leave arbitrary.
 */
function discQuaternion(pos: THREE.Vector3, inclinationDeg: number) {
  const los = pos.clone().sub(new THREE.Vector3(...SUN_POS)).normalize();
  let ref = new THREE.Vector3(0, 1, 0);
  if (Math.abs(los.dot(ref)) > 0.99) ref = new THREE.Vector3(1, 0, 0);
  const perp = new THREE.Vector3().crossVectors(los, ref).normalize();

  const i = (inclinationDeg * Math.PI) / 180;
  const normal = los
    .clone()
    .multiplyScalar(Math.cos(i))
    .addScaledVector(perp, Math.sin(i))
    .normalize();

  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
}

function Spiral({ m }: { m: Member }) {
  const disc = useGalaxyMaterial(spiralTexture(), m.color);
  // A real spiral's bulge is spheroidal, not flat — so it stays visible even when
  // the disc is seen edge-on, as Andromeda's 77° inclination nearly is.
  const bulge = useGalaxyMaterial(blobTexture(), "#ffe9c8", 0.9);
  const size = sceneDiameter(m);
  const pos = useMemo(() => new THREE.Vector3(...toScene(m.l, m.b, m.d)), [m]);
  const quat = useMemo(() => discQuaternion(pos, m.inclination ?? 0), [pos, m.inclination]);
  return (
    <group position={pos}>
      <mesh quaternion={quat} material={disc}>
        <planeGeometry args={[size, size]} />
      </mesh>
      <Billboard>
        <mesh material={bulge}>
          <planeGeometry args={[size * 0.3, size * 0.3]} />
        </mesh>
      </Billboard>
    </group>
  );
}

function Blob({ m }: { m: Member }) {
  const material = useGalaxyMaterial(blobTexture(), m.color, m.type === "dwarf" ? 0.6 : 0.95);
  const size = sceneDiameter(m);
  return (
    <Billboard position={toScene(m.l, m.b, m.d)}>
      <mesh material={material}>
        <planeGeometry args={[size, size]} />
      </mesh>
    </Billboard>
  );
}

/** The Milky Way, seen from outside: its disc lies in the scene's XZ plane by definition. */
function MilkyWay() {
  const material = useGalaxyMaterial(spiralTexture(), "#dfe8ff");
  const size = 31 * SIZE_EXAGGERATION; // ~31 kpc stellar disc
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={material}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
}

function Label({ position, text }: { position: [number, number, number]; text: string }) {
  return (
    <Html center position={position}>
      <div className="pointer-events-none -translate-y-8 whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-white">
        {text}
      </div>
    </Html>
  );
}

function ReturnWatcher() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (!controls) return;
    controls.dollySpeed = 0.5;
    controls.dollyToCursor = true; // zoom toward whatever galaxy you point at
    controls.truckSpeed = 2.5; // right-drag pans across the group
    if (!import.meta.env.DEV) return;
    const g = globalThis as unknown as { __lgControls?: unknown };
    g.__lgControls = controls;
    return () => {
      g.__lgControls = undefined;
    };
  }, [controls]);

  useFrame(() => {
    if (focus.level !== 4 || focus.autopilot) return;
    if (camera.position.length() < RETURN_DIST) setLevel(3); // near the Milky Way (home)
    else if (camera.position.distanceTo(GROUP_CENTER) > LEAVE_DIST) setLevel(5);
  });
  return null;
}

/** The one relationship that defines this scale: the two big spirals, falling together. */
function AndromedaAxis({ m31 }: { m31: Member }) {
  const end = toScene(m31.l, m31.b, m31.d);
  const mid: [number, number, number] = [end[0] / 2, end[1] / 2, end[2] / 2];
  return (
    <>
      <Line
        points={[[0, 0, 0], end]}
        color="#c6ff3d"
        lineWidth={1}
        dashed
        dashSize={22}
        gapSize={16}
        transparent
        opacity={0.35}
      />
      <Html center position={mid}>
        <div className="pointer-events-none whitespace-nowrap rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] text-lime/90">
          {m31.d} kpc · closing at 110 km/s
        </div>
      </Html>
    </>
  );
}

export function LocalGroupScene() {
  const spirals = MEMBERS.filter((m) => m.type === "spiral");
  const blobs = MEMBERS.filter((m) => m.type !== "spiral");
  const labelled = MEMBERS.filter((m) => m.label);
  const m31 = useRef(MEMBERS.find((m) => m.name.startsWith("Andromeda"))!).current;

  return (
    <div className="fixed inset-0 z-[114] bg-black">
      <Canvas
        camera={{ position: [200, 620, -900], fov: 50, near: 1, far: 20000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={sceneDpr([1, 1.5], [1, 1.2])}
      >
        <MilkyWay />
        {spirals.map((m) => (
          <Spiral key={m.name} m={m} />
        ))}
        {blobs.map((m) => (
          <Blob key={m.name} m={m} />
        ))}
        <AndromedaAxis m31={m31} />
        <Label position={[0, 0, 0]} text="MILKY WAY" />
        {labelled.map((m) => (
          <Label key={m.name} position={toScene(m.l, m.b, m.d)} text={m.name.toUpperCase()} />
        ))}

        <CameraControls makeDefault minDistance={20} maxDistance={2700} smoothTime={0.5} />
        <EntryTransition
          restEye={REST_EYE}
          restTarget={REST_TARGET}
          outAnchor={[0, 0, 0]}
          outStartDist={130}
        />
        <ReturnWatcher />
        <AutopilotCam speed={0.06} />
        <EffectComposer>
          <Bloom intensity={0.5} luminanceThreshold={0.3} mipmapBlur radius={0.6} />
        </EffectComposer>
        <CanvasCleanup />
      </Canvas>

      <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100vw-11rem)] rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-lime backdrop-blur">
        The Local Group · {MEMBERS.length + 1} of ~80 members
        <span className="block text-white/55">
          two big spirals and a crowd of dwarfs, across ~3 megaparsecs of mostly nothing
        </span>
        <span className="block text-white/40">
          positions are real; galaxy sizes exaggerated ×{SIZE_EXAGGERATION} to be visible
        </span>
      </div>

      <button
        onClick={() => setLevel(3)}
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white/80 backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        ↩ Back to the Milky Way
      </button>

      <div className="pointer-events-none absolute bottom-5 left-5 hidden font-mono text-[11px] leading-relaxed text-white/45 sm:block">
        left-drag — rotate · right-drag — move · scroll — zoom to cursor
        <span className="block text-white/30">
          fly home for the Milky Way · zoom out for the cosmic web
        </span>
      </div>
    </div>
  );
}
