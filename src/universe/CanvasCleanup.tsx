import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Hand the WebGL context back when a scene unmounts.
 *
 * Every cosmic scale is its own <Canvas>, i.e. its own WebGL context. Browsers
 * cap these (~16) and are slow to reclaim them, so travelling the ladder a few
 * times exhausts the pool: the browser kills the oldest contexts and those
 * scenes render as a blank white canvas. Releasing explicitly keeps the pool
 * healthy however far you roam.
 *
 * Deferred to a macrotask so react-three-fiber finishes its own teardown first —
 * tearing the context down underneath it makes its dispose throw.
 * (Also: this is only safe because we don't use StrictMode; see main.tsx.)
 */
export function CanvasCleanup() {
  const gl = useThree((s) => s.gl);
  useEffect(
    () => () => {
      setTimeout(() => {
        try {
          gl.forceContextLoss();
          gl.dispose();
        } catch {
          /* already released */
        }
      }, 0);
    },
    [gl],
  );
  return null;
}
