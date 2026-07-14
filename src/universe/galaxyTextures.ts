import * as THREE from "three";

// Galaxy billboards are drawn onto a canvas once and reused, tinted per member.
// At Local Group scale a galaxy is a handful of pixels, so a sprite is both
// cheaper and more honest than a point cloud we couldn't resolve anyway.

function canvas(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

function finish(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

let spiral: THREE.Texture | null = null;
let blob: THREE.Texture | null = null;

/** Face-on spiral: bright core, two logarithmic arms, fading disc. */
export function spiralTexture(): THREE.Texture {
  if (spiral) return spiral;
  const S = 512;
  const c = canvas(S);
  const g = c.getContext("2d")!;
  const cx = S / 2;

  // faint disc
  const disc = g.createRadialGradient(cx, cx, 0, cx, cx, cx);
  disc.addColorStop(0, "rgba(255,248,232,0.55)");
  disc.addColorStop(0.35, "rgba(190,205,255,0.18)");
  disc.addColorStop(1, "rgba(120,150,255,0)");
  g.fillStyle = disc;
  g.fillRect(0, 0, S, S);

  // arms — scattered points along two logarithmic spirals
  const B = Math.tan((17 * Math.PI) / 180);
  let seed = 7;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let arm = 0; arm < 2; arm++) {
    for (let i = 0; i < 2600; i++) {
      const r = 0.1 + rand() * 0.86;
      const th = Math.log(r / 0.08) / B + arm * Math.PI + (rand() - 0.5) * 0.5;
      const rr = r * cx * 0.94;
      const x = cx + rr * Math.cos(th);
      const y = cx + rr * Math.sin(th);
      const a = 0.5 * (1 - r);
      g.fillStyle =
        rand() < 0.05 ? `rgba(255,150,175,${a})` : `rgba(215,230,255,${a})`;
      g.fillRect(x, y, 1.6, 1.6);
    }
  }

  // core
  const core = g.createRadialGradient(cx, cx, 0, cx, cx, cx * 0.2);
  core.addColorStop(0, "rgba(255,244,214,1)");
  core.addColorStop(0.5, "rgba(255,222,160,0.7)");
  core.addColorStop(1, "rgba(255,200,120,0)");
  g.fillStyle = core;
  g.fillRect(0, 0, S, S);

  spiral = finish(c);
  return spiral;
}

/** Soft blob for irregulars and dwarf spheroidals. */
export function blobTexture(): THREE.Texture {
  if (blob) return blob;
  const S = 128;
  const c = canvas(S);
  const g = c.getContext("2d")!;
  const cx = S / 2;
  const grad = g.createRadialGradient(cx, cx, 0, cx, cx, cx);
  grad.addColorStop(0, "rgba(255,255,255,0.8)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.34)");
  grad.addColorStop(0.55, "rgba(255,255,255,0.09)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  blob = finish(c);
  return blob;
}
