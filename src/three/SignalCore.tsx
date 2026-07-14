import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";
import { scrollProgress } from "../lib/scroll";

// The centerpiece: a morphing, glowing core (violet→lime as you scroll) wrapped
// in a slowly counter-rotating wireframe shell.
export function SignalCore() {
  const inner = useRef<THREE.Mesh>(null!);
  const shell = useRef<THREE.Mesh>(null!);

  const violet = useMemo(() => new THREE.Color("#8b5cf6"), []);
  const lime = useMemo(() => new THREE.Color("#c6ff3d"), []);
  const emViolet = useMemo(() => new THREE.Color("#6d28d9"), []);
  const emLime = useMemo(() => new THREE.Color("#5c7a1e"), []);

  useFrame((_, delta) => {
    const p = scrollProgress();
    const mat = inner.current.material as THREE.MeshStandardMaterial;
    mat.color.lerpColors(violet, lime, p);
    mat.emissive.lerpColors(emViolet, emLime, p);

    shell.current.rotation.y += delta * 0.15;
    shell.current.rotation.x -= delta * 0.05;
    inner.current.rotation.y -= delta * 0.08;
  });

  return (
    <Float speed={1.3} rotationIntensity={0.5} floatIntensity={0.9}>
      <mesh ref={inner}>
        <icosahedronGeometry args={[1.25, 16]} />
        <MeshDistortMaterial
          color="#8b5cf6"
          emissive="#6d28d9"
          emissiveIntensity={0.7}
          roughness={0.12}
          metalness={0.55}
          distort={0.38}
          speed={1.6}
        />
      </mesh>

      <mesh ref={shell} scale={1.7}>
        <icosahedronGeometry args={[1.25, 1]} />
        <meshBasicMaterial color="#c6ff3d" wireframe transparent opacity={0.16} />
      </mesh>
    </Float>
  );
}
