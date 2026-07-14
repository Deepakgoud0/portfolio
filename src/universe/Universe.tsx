import { Suspense, lazy, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { Backdrop } from "./Backdrop";
import { Sun } from "./Sun";
import { SolarSystem } from "./SolarSystem";
import { Controls } from "./Controls";
import { PostFX } from "./PostFX";
import { AnimatePresence, motion } from "motion/react";
import { focus, setLevel, useUniverseState } from "./focusStore";
import { EarthDiveWatcher } from "./EarthDiveWatcher";
import { Cockpit } from "./Cockpit";
import { bodyMeshes, telemetry } from "./cockpitBridge";
import { clearFlyRequest } from "./focusStore";

// Each scale/dive is its own chunk, fetched only when you actually travel there.
// The solar system is what loads up front; MapLibre (the Earth dive) and the star
// catalogue never touch the initial bundle.
const StarScene = lazy(() => import("./StarScene").then((m) => ({ default: m.StarScene })));
const GalaxyScene = lazy(() => import("./GalaxyScene").then((m) => ({ default: m.GalaxyScene })));
const LocalGroupScene = lazy(() =>
  import("./LocalGroupScene").then((m) => ({ default: m.LocalGroupScene })),
);
const CosmicWebScene = lazy(() =>
  import("./CosmicWebScene").then((m) => ({ default: m.CosmicWebScene })),
);
const BlackHoleScene = lazy(() =>
  import("./BlackHoleScene").then((m) => ({ default: m.BlackHoleScene })),
);
const NebulaScene = lazy(() => import("./NebulaScene").then((m) => ({ default: m.NebulaScene })));
const EarthMode = lazy(() => import("./EarthMode").then((m) => ({ default: m.EarthMode })));

const LEAVE_DIST = 430; // pull back past this and the whole system becomes one star

function FrameOnMount({
  controls,
}: {
  controls: React.RefObject<CameraControlsImpl | null>;
}) {
  useEffect(() => {
    const id = setTimeout(() => {
      controls.current?.setLookAt(6, 42, 96, 0, 0, 0, false);
    }, 60);
    return () => clearTimeout(id);
  }, [controls]);
  return null;
}

// Consumes NAV COMPUTER fly requests from the DOM cockpit: frame a planet, or
// "__home__" to recenter on the system overview.
function FlyController() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  useFrame(() => {
    if (!controls) return;
    const req = focus.flyRequest;
    if (!req) return;
    if (req === "__home__") {
      controls.setLookAt(6, 42, 96, 0, 0, 0, true);
      clearFlyRequest();
    } else if (bodyMeshes[req]) {
      controls.fitToSphere(bodyMeshes[req], true);
      clearFlyRequest();
    }
  });
  return null;
}

// Writes live camera telemetry the DOM cockpit reads via rAF (no React churn).
function TelemetryProbe() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const prev = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    if (controls) telemetry.range = controls.distance;
    telemetry.speed = camera.position.distanceTo(prev.current) / Math.max(dt, 1e-4);
    prev.current.copy(camera.position);
  });
  return null;
}

// Zooming out far enough hands off to the stellar-neighbourhood scene.
// Disarmed while away, and only re-armed once the camera has flown back in —
// otherwise arriving at max distance would bounce straight back out.
function LevelWatcher() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const camera = useThree((s) => s.camera);
  const armed = useRef(true);

  useFrame(() => {
    if (!controls) return;
    if (focus.level !== 1) {
      armed.current = false;
      return;
    }
    if (focus.key) return;

    // Distance from the Sun (origin) — robust to panning, unlike controls.distance.
    const d = camera.position.length();
    if (!armed.current) {
      if (d < LEAVE_DIST - 80) armed.current = true;
      return;
    }
    if (d > LEAVE_DIST) setLevel(2);
  });
  return null;
}

export function Universe() {
  const controls = useRef<CameraControlsImpl>(null);
  const { mapOpen, level, blackHole, nebula } = useUniverseState();
  const prevLevel = useRef(level);

  // Coming back down from the stars: reframe the system overview.
  useEffect(() => {
    if (prevLevel.current === 2 && level === 1) {
      controls.current?.setLookAt(6, 42, 96, 0, 0, 0, true);
    }
    prevLevel.current = level;
  }, [level]);

  return (
    <div className="fixed inset-0 bg-black">
      <Canvas
        camera={{ position: [6, 42, 96], fov: 50, near: 0.1, far: 2000 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 2]}
        frameloop={level === 1 && !mapOpen ? "always" : "demand"}
      >
        <Suspense fallback={null}>
          <Backdrop />
          <Sun />
          <SolarSystem />
        </Suspense>
        <Controls ref={controls} />
        <EarthDiveWatcher />
        <LevelWatcher />
        <FlyController />
        <TelemetryProbe />
        <FrameOnMount controls={controls} />
        <PostFX />
      </Canvas>

      {/* home-base cockpit shell (self-gates to level 1) */}
      <Cockpit />


      {/* cosmic ladder — each rung crossfades in as you pull far enough out */}
      <AnimatePresence>
        {level === 2 && (
          <motion.div
            key="stars"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          >
            <Suspense fallback={null}>
              <StarScene />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {level === 3 && (
          <motion.div
            key="galaxy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          >
            <Suspense fallback={null}>
              <GalaxyScene />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {level === 4 && (
          <motion.div
            key="localgroup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
          >
            <Suspense fallback={null}>
              <LocalGroupScene />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {level === 5 && (
          <motion.div
            key="cosmicweb"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          >
            <Suspense fallback={null}>
              <CosmicWebScene />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* volumetric nebula close-up — dive in from a "fly in" label */}
      <AnimatePresence>
        {nebula && (
          <motion.div
            key="nebula"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Suspense fallback={null}>
              <NebulaScene />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sagittarius A* — ray-marched black hole at the galactic core */}
      <AnimatePresence>
        {blackHole && (
          <motion.div
            key="blackhole"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          >
            <Suspense fallback={null}>
              <BlackHoleScene />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* satellite Earth mode — crossfades in when you dive past the threshold */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            key="earthmode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Suspense fallback={null}>
              <EarthMode />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
