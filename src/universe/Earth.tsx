import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SRGBColorSpace } from "three";
import type { Body } from "./data";
import { useFocus } from "./useFocus";
import { bodyMeshes } from "./cockpitBridge";

// Multi-layer realistic Earth: lit surface (day + relief) · additive night
// city-lights (glow on the dark side) · rotating clouds · atmosphere halo.
export function Earth({ body }: { body: Body }) {
  const surface = useRef<THREE.Group>(null!);
  const clouds = useRef<THREE.Mesh>(null!);
  const focus = useFocus(body.key);

  const [day, night, cloud, normal] = useTexture([
    "/textures/8k_earth_daymap.jpg",
    "/textures/8k_earth_nightmap.jpg",
    "/textures/8k_earth_clouds.jpg",
    "/textures/earth_normal.jpg",
  ]);
  day.colorSpace = SRGBColorSpace;
  night.colorSpace = SRGBColorSpace;

  useFrame((_, delta) => {
    surface.current.rotation.y += delta * body.spinSpeed;
    clouds.current.rotation.y += delta * (body.spinSpeed * 1.25);
  });

  const r = body.size;

  return (
    <group rotation={[0, 0, body.axialTilt ?? 0.41]}>
      <group ref={surface}>
        {/* lit surface */}
        <mesh
          {...focus}
          ref={(el) => {
            if (el) bodyMeshes[body.key] = el;
          }}
        >
          <sphereGeometry args={[r, 64, 64]} />
          <meshStandardMaterial map={day} normalMap={normal} metalness={0} roughness={0.9} />
        </mesh>
        {/* night city lights (additive: glows on the dark side) */}
        <mesh scale={1.001}>
          <sphereGeometry args={[r, 64, 64]} />
          <meshBasicMaterial
            map={night}
            blending={THREE.AdditiveBlending}
            transparent
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* clouds */}
      <mesh ref={clouds} scale={1.02}>
        <sphereGeometry args={[r, 64, 64]} />
        <meshStandardMaterial
          alphaMap={cloud}
          transparent
          opacity={0.9}
          depthWrite={false}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* atmosphere halo */}
      <mesh scale={1.08}>
        <sphereGeometry args={[r, 48, 48]} />
        <meshBasicMaterial
          color="#5aa0ff"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
