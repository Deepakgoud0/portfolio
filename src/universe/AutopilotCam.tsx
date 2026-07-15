import { useFrame, useThree } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { focus } from "./focusStore";
import { autopilotBridge } from "./autopilotBridge";

// A gentle, continuous azimuth drift while the autopilot dwells on a view, so
// every stop on the tour slowly reveals itself in 3D instead of sitting flat.
// It stays quiet until the scene's entry framing has settled, and the moment the
// user takes control (focus.autopilot === false) it stops — so it can never
// fight a human at the stick.
export function AutopilotCam({
  speed = 0.09,
  gateLevel,
}: {
  speed?: number;
  // For a canvas that is always mounted (the solar system), only orbit while
  // this scale level is the one on screen.
  gateLevel?: number;
}) {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;

  useFrame((_, dt) => {
    if (!controls || !focus.autopilot) return;
    if (gateLevel !== undefined && focus.level !== gateLevel) return;
    if (performance.now() - autopilotBridge.lastStepAt < autopilotBridge.settleMs) return;
    // Clamp dt so a stutter or a tab-switch can't jerk the camera on resume.
    controls.rotate(speed * Math.min(dt, 0.05), 0, false);
  });

  return null;
}
