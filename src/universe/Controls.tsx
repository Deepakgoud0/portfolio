import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import type CameraControlsImpl from "camera-controls";

// Smooth camera: left-drag orbit · right-drag move (truck/pan) · scroll zoom
// toward the cursor · click a body to fly to it.
export const Controls = forwardRef<CameraControlsImpl>((_, ref) => {
  const local = useRef<CameraControlsImpl>(null);
  useImperativeHandle(ref, () => local.current as CameraControlsImpl, []);

  useEffect(() => {
    const c = local.current;
    if (!c) return;
    c.dollyToCursor = true; // scroll zooms toward whatever you point at
    c.dollySpeed = 0.7;
    c.truckSpeed = 2.5; // right-drag pan speed
    c.minDistance = 1.3; // allow zooming close to a planet (Earth dive threshold)
    c.maxDistance = 480;
    if (import.meta.env.DEV) {
      (globalThis as unknown as { __solarControls?: unknown }).__solarControls = c;
    }
  }, []);

  return <CameraControls ref={local} makeDefault smoothTime={0.45} />;
});
Controls.displayName = "Controls";
