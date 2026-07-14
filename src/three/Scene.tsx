import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { SignalCore } from "./SignalCore";
import { Satellite } from "./Satellite";
import { CameraRig } from "./CameraRig";

// Ambient particle field ("data dust") slowly rotating around the core.
function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const n = 450;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 3 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#8b5cf6"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

export function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 6, 6]} intensity={90} distance={40} color="#8b5cf6" />
      <pointLight position={[-6, -4, 3]} intensity={70} distance={40} color="#c6ff3d" />
      {/* dedicated light so the satellite reads clearly */}
      <pointLight position={[4, 3, 2]} intensity={55} distance={16} color="#ffffff" />

      <SignalCore />
      <Suspense fallback={null}>
        <Satellite />
      </Suspense>
      <Dust />
      <Stars radius={50} depth={30} count={1400} factor={3} saturation={0} fade speed={0.4} />

      <CameraRig />

      <EffectComposer>
        <Bloom
          intensity={0.95}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.35}
          mipmapBlur
        />
        <Vignette offset={0.25} darkness={0.9} />
      </EffectComposer>
    </>
  );
}
