import { Canvas } from "@react-three/fiber";
import { Scene } from "./Scene";

// Fixed cinematic 3D backdrop behind the whole page.
export function SceneBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <Scene />
      </Canvas>
      {/* readability veil so content stays legible over the scene */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg/85 via-bg/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/30 via-transparent to-bg/70" />
    </div>
  );
}

// Static fallback for reduced-motion / touch / small screens.
export function StaticBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-bg">
      <div className="absolute inset-0 dot-grid opacity-60" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 35%, rgba(139,92,246,0.22), transparent 70%), radial-gradient(45% 40% at 85% 20%, rgba(198,255,61,0.12), transparent 70%)",
        }}
      />
    </div>
  );
}
