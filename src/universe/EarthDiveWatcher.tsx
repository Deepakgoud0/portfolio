import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { focus, setMapOpen } from "./focusStore";

// Drives the smooth space↔satellite transition:
//  • focused on Earth + zoomed in past OPEN_DIST  → open satellite (crossfade)
//  • satellite closed (zoomed out)                → ease camera back to frame Earth
//  • focus cleared                                → ease to the system overview
const OPEN_DIST = 1.9; // camera→Earth distance that triggers the dive
const REARM_DIST = 3.6; // resting distance after closing; also the re-arm gate

export function EarthDiveWatcher() {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;
  const armed = useRef(true);
  const prevMap = useRef(false);
  const prevKey = useRef<string | null>(null);

  useFrame(() => {
    if (!controls) return;
    const mapOpen = focus.mapOpen;

    // focus cleared → glide to the overview
    if (prevKey.current !== null && focus.key === null) {
      controls.setLookAt(6, 42, 96, 0, 0, 0, true);
    }
    prevKey.current = focus.key;

    // satellite just closed → pull the camera back out to frame Earth from space
    if (prevMap.current && !mapOpen && focus.key === "earth") {
      controls.dollyTo(REARM_DIST, true);
      armed.current = false;
    }
    prevMap.current = mapOpen;

    if (focus.key !== "earth") {
      armed.current = true;
      return;
    }
    if (mapOpen) return;

    const d = controls.distance;
    if (d > REARM_DIST + 0.6) armed.current = true; // must back off before re-triggering
    if (armed.current && d < OPEN_DIST) {
      setMapOpen(true);
      armed.current = false;
    }
  });

  return null;
}
