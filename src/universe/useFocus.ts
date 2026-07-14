import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type CameraControlsImpl from "camera-controls";
import { setFocus } from "./focusStore";

// Click a body to fly the camera to it (and freeze orbits so it stays steady).
// For Earth, keep zooming in past a threshold to dive into satellite mode
// (handled by EarthDiveWatcher) — clicking just brings you close.
export function useFocus(key: string) {
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setFocus(key);
    controls?.fitToSphere(e.object, true);
  };
  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };
  const onPointerOut = () => {
    document.body.style.cursor = "auto";
  };

  return { onClick, onPointerOver, onPointerOut };
}
