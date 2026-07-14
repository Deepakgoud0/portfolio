import * as THREE from "three";

// Procedural soft "cosmic cloud" texture — a radial falloff modulated by
// domain-warped value noise, drawn once to a canvas and reused (tinted per
// nebula via the material colour). Grayscale alpha; colour comes from the mesh.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNebulaTexture(seed: number, size = 256): THREE.CanvasTexture {
  const rnd = mulberry32(seed);
  const G = 8; // noise lattice
  const grid = new Float32Array(G * G);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const lat = (x: number, y: number) => {
    x = ((x % G) + G) % G;
    y = ((y % G) + G) % G;
    return grid[y * G + x];
  };
  const sm = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number, y: number) => {
    const gx = Math.floor(x);
    const gy = Math.floor(y);
    const fx = sm(x - gx);
    const fy = sm(y - gy);
    const a = lat(gx, gy);
    const b = lat(gx + 1, gy);
    const c = lat(gx, gy + 1);
    const d = lat(gx + 1, gy + 1);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  };
  const fbm = (x: number, y: number) => {
    let s = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 5; o++) {
      s += amp * noise(x * f, y * f);
      f *= 2;
      amp *= 0.5;
    }
    return s;
  };

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x / size) * 2 - 1;
      const ny = (y / size) * 2 - 1;
      const r = Math.hypot(nx, ny);
      const falloff = Math.max(0, 1 - r);
      const soft = falloff * falloff;
      // sample in a positive, domain-warped coordinate space (wispy filaments)
      const px = (x / size) * 4 + 8;
      const py = (y / size) * 4 + 8;
      const w = fbm(px, py);
      let n = fbm(px + w * 1.6, py + w * 1.6);
      n = n * n * 1.7;
      const a = Math.min(1, Math.max(0, soft * (0.12 + 0.95 * n)));
      const idx = (y * size + x) * 4;
      img.data[idx] = 255;
      img.data[idx + 1] = 255;
      img.data[idx + 2] = 255;
      img.data[idx + 3] = a * 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
