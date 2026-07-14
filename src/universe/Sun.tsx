import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { SRGBColorSpace } from "three";
import * as THREE from "three";

export const SUN_RADIUS = 3.4;

// The Sun = the light source. Emissive textured sphere (unlit, blooms) + a
// point light that lights every planet for a real day/night terminator, plus a
// soft additive corona.
export function Sun() {
  const surface = useRef<THREE.Mesh>(null!);
  const tex = useTexture("/textures/8k_sun.jpg");
  tex.colorSpace = SRGBColorSpace;

  useFrame((_, delta) => {
    surface.current.rotation.y += delta * 0.02;
  });

  return (
    <group>
      <mesh ref={surface}>
        <sphereGeometry args={[SUN_RADIUS, 64, 64]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>

      {/* corona glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[SUN_RADIUS, 32, 32]} />
        <meshBasicMaterial
          color="#ff8a2c"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* the star's light */}
      <pointLight
        position={[0, 0, 0]}
        intensity={2200}
        distance={0}
        decay={2}
        color="#fff1dd"
      />
    </group>
  );
}
