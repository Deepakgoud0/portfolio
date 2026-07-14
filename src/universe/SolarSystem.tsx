import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BODIES } from "./data";
import { Planet } from "./Planet";
import { Earth } from "./Earth";
import { focus } from "./focusStore";

function OrbitRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 160]} />
      <meshBasicMaterial
        color="#4a4a72"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export function SolarSystem() {
  const groups = useRef<Record<string, THREE.Group>>({});

  useFrame((_, delta) => {
    if (focus.paused) return; // freeze orbits while inspecting a planet
    for (const b of BODIES) {
      const g = groups.current[b.key];
      if (g) g.rotation.y += delta * b.orbitSpeed;
    }
  });

  return (
    <>
      {BODIES.map((b) => (
        <OrbitRing key={`ring-${b.key}`} radius={b.orbitRadius} />
      ))}
      {BODIES.map((b) => (
        <group
          key={b.key}
          ref={(el) => {
            if (el) groups.current[b.key] = el;
          }}
          rotation={[0, b.phase, 0]}
        >
          <group position={[b.orbitRadius, 0, 0]}>
            {b.earth ? <Earth body={b} /> : <Planet body={b} />}
          </group>
        </group>
      ))}
    </>
  );
}
