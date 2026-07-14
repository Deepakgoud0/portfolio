import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

// Cinematic grade: bloom only on the brightest things (sun, city lights, rim).
export function PostFX() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.25}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.75}
      />
      <Vignette offset={0.3} darkness={0.75} />
    </EffectComposer>
  );
}
