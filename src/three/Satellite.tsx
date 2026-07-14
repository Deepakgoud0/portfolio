import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Realistic satellite model (CC-BY, "Poly by Google" via Poly Pizza — see README
// credits). Auto-centered + size-normalized, then floats + spins upper-right.
useGLTF.preload("/models/satellite.glb");

const TARGET_SIZE = 3.8; // world units for the model's largest dimension

export function Satellite() {
  const spin = useRef<THREE.Group>(null!);
  const { scene } = useGLTF("/models/satellite.glb");

  const { scale, offset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    // subtle self-glow so it reads against the dark sky (and catches bloom)
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && "emissive" in mat) {
          mat.emissive = new THREE.Color("#9d7bff");
          mat.emissiveIntensity = 0.3;
        }
      }
    });

    return { scale: TARGET_SIZE / maxDim, offset: center };
  }, [scene]);

  useFrame((_, delta) => {
    spin.current.rotation.y += delta * 0.35;
  });

  return (
    <group position={[3.6, 1.9, -1]} rotation={[0.3, 0.5, 0.1]}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.8}>
        <group ref={spin} scale={scale}>
          <primitive
            object={scene}
            position={[-offset.x, -offset.y, -offset.z]}
          />
        </group>
      </Float>
    </group>
  );
}
