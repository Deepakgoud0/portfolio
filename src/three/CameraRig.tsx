import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollProgress } from "../lib/scroll";

// Cinematic camera: orbits + dollies around the core as you scroll, with a
// subtle pointer parallax. Always looks at the core.
export function CameraRig() {
  useFrame((state) => {
    const p = scrollProgress();
    const cam = state.camera;

    const angle = p * Math.PI * 1.6;
    const radius = 7.2 + p * 2.5;
    const targetX = Math.sin(angle) * radius + state.pointer.x * 0.7;
    const targetZ = Math.cos(angle) * radius;
    const targetY = 0.4 + state.pointer.y * 0.4 + p * 1.8;

    cam.position.x = THREE.MathUtils.lerp(cam.position.x, targetX, 0.045);
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, targetY, 0.045);
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, targetZ, 0.045);
    cam.lookAt(0, 0, 0);
  });

  return null;
}
