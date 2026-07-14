import { useMemo } from "react";
import * as THREE from "three";

interface Props {
  positions: Float32Array; // xyz triples, scene units
  colors: Uint8Array; // rgb triples, 0-255
  sizes: Float32Array; // per-point base size
  /** perspective constant: on-screen px ≈ size * k / distance */
  k?: number;
  /** px clamp so a point you fly up to doesn't fill the screen */
  maxSize?: number;
}

// Shared GPU point-sprite renderer for the star and galaxy scales.
// One draw call, additive, soft round sprites — the only way ~10^5 points
// stay cheap enough to sit next to a full 3D scene.
export function PointCloud({ positions, colors, sizes, k = 260, maxSize = 26 }: Props) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(colors, 3, true));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    return g;
  }, [positions, colors, sizes]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uK: { value: k }, uMax: { value: maxSize } },
        vertexShader: /* glsl */ `
          attribute vec3 aColor;
          attribute float aSize;
          uniform float uK;
          uniform float uMax;
          varying vec3 vColor;
          void main() {
            vColor = aColor;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = clamp(aSize * (uK / max(-mv.z, 0.001)), 1.0, uMax);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d));
          }`,
      }),
    [k, maxSize],
  );

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
