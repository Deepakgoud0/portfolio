import { useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { BackSide, SRGBColorSpace } from "three";
import * as THREE from "three";
import type CameraControlsImpl from "camera-controls";
import { setFocus } from "./focusStore";

// The 4K Milky Way as an *infinite* sky: the sphere is pinned to the camera's
// position each frame, so moving/zooming never parallaxes it — only rotating
// the view pans across the galaxy. Double-clicking empty space resets.
export function Backdrop() {
  const mesh = useRef<THREE.Mesh>(null!);
  const tex = useTexture("/textures/8k_stars_milky_way.jpg");
  tex.colorSpace = SRGBColorSpace;
  const controls = useThree((s) => s.controls) as CameraControlsImpl | null;

  useFrame((state) => {
    mesh.current.position.copy(state.camera.position);
  });

  return (
    <mesh
      ref={mesh}
      onDoubleClick={() => {
        setFocus(null);
        controls?.setLookAt(6, 42, 96, 0, 0, 0, true);
      }}
    >
      <sphereGeometry args={[900, 64, 64]} />
      <meshBasicMaterial map={tex} side={BackSide} toneMapped={false} />
    </mesh>
  );
}
