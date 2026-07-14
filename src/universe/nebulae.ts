// Real nebulae, placed at their true positions. Coordinates are the published
// equatorial (RA/Dec) + distance, converted to the SAME equatorial-cartesian
// frame (parsecs, Sol at origin) the HYG star catalogue uses — so a nebula sits
// exactly where it does in our sky, among the right stars.
//
// Distances are the commonly-cited values (Gaia-era where available); a few of
// the small planetaries/remnants are floored in render size so they stay visible.

export type NebulaType = "emission" | "reflection" | "planetary" | "remnant";

/**
 * The nebula's real 3D structure — this is what actually distinguishes them, and
 * it's the thing a photograph cannot tell you. Astronomers do know these shapes:
 *  cavity   — a hollow blown into a molecular cloud by hot young stars (Orion, Lagoon)
 *  torus    — a ring/donut of gas ejected by a dying star (Helix, Ring)
 *  bipolar  — twin lobes vented from a waist (Dumbbell, Cat's Eye)
 *  pillars  — dense dust columns eroded by stellar wind (Eagle, Carina)
 *  remnant  — an expanding filamentary shell from a supernova (Crab, Veil)
 *  diffuse  — dust reflecting nearby starlight (Pleiades)
 */
export type NebulaShape = "cavity" | "torus" | "bipolar" | "pillars" | "remnant" | "diffuse";

export const SHAPE_ID: Record<NebulaShape, number> = {
  cavity: 0,
  torus: 1,
  bipolar: 2,
  pillars: 3,
  remnant: 4,
  diffuse: 5,
};

export interface Nebula {
  name: string;
  type: NebulaType;
  shape: NebulaShape;
  ra: number; // degrees
  dec: number; // degrees
  d: number; // parsecs
  radius: number; // render radius, parsecs
  colors: [string, string]; // additive tint (core, wisps)
  label?: boolean;
}

// H-alpha red/magenta for star-forming gas; teal-green for planetary shells;
// blue for reflection dust; red+cyan filaments for supernova remnants.
const EMISSION: [string, string] = ["#ff3d6e", "#ff9a5a"];
const REFLECT: [string, string] = ["#6f9bff", "#9fc0ff"];
const PLANETARY: [string, string] = ["#33e0c0", "#79ffe6"];
const REMNANT: [string, string] = ["#ff6a5a", "#57d8ff"];

export const NEBULAE: Nebula[] = [
  // nearby, reachable landmarks in the stellar neighbourhood
  { name: "Orion Nebula", type: "emission", shape: "cavity", ra: 83.82, dec: -5.39, d: 412, radius: 8, colors: EMISSION, label: true },
  { name: "Pleiades", type: "reflection", shape: "diffuse", ra: 56.75, dec: 24.12, d: 136, radius: 5, colors: REFLECT, label: true },
  { name: "California Nebula", type: "emission", shape: "cavity", ra: 60.7, dec: 36.6, d: 300, radius: 12, colors: EMISSION, label: true },
  { name: "Helix Nebula", type: "planetary", shape: "torus", ra: 337.41, dec: -20.84, d: 200, radius: 3.5, colors: PLANETARY, label: true },
  { name: "Dumbbell Nebula", type: "planetary", shape: "bipolar", ra: 299.9, dec: 22.72, d: 380, radius: 3, colors: PLANETARY },
  { name: "Ring Nebula", type: "planetary", shape: "torus", ra: 283.4, dec: 33.03, d: 700, radius: 3, colors: PLANETARY, label: true },
  { name: "Veil Nebula", type: "remnant", shape: "remnant", ra: 311.6, dec: 30.7, d: 735, radius: 16, colors: REMNANT, label: true },
  { name: "North America", type: "emission", shape: "cavity", ra: 314.7, dec: 44.3, d: 800, radius: 14, colors: EMISSION },
  { name: "Cat's Eye Nebula", type: "planetary", shape: "bipolar", ra: 269.6, dec: 66.6, d: 1000, radius: 3, colors: PLANETARY },

  // the famous distant giants — visible as coloured glows toward the arms
  { name: "Lagoon Nebula", type: "emission", shape: "cavity", ra: 270.9, dec: -24.38, d: 1250, radius: 17, colors: EMISSION, label: true },
  { name: "Trifid Nebula", type: "emission", shape: "cavity", ra: 270.6, dec: -23.03, d: 1200, radius: 10, colors: EMISSION },
  { name: "Eagle Nebula", type: "emission", shape: "pillars", ra: 274.7, dec: -13.8, d: 1740, radius: 12, colors: EMISSION, label: true },
  { name: "Omega Nebula", type: "emission", shape: "cavity", ra: 275.2, dec: -16.17, d: 1700, radius: 9, colors: EMISSION },
  { name: "Rosette Nebula", type: "emission", shape: "cavity", ra: 97.9, dec: 4.95, d: 1600, radius: 22, colors: EMISSION },
  { name: "Crab Nebula", type: "remnant", shape: "remnant", ra: 83.63, dec: 22.01, d: 2000, radius: 6, colors: REMNANT, label: true },
  { name: "Carina Nebula", type: "emission", shape: "pillars", ra: 161.3, dec: -59.87, d: 2300, radius: 45, colors: EMISSION, label: true },
];

/** Real NASA/ESA image for this nebula (public domain unless noted in the README). */
export function nebulaImage(n: Nebula): string {
  const slug = n.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `/nebulae/${slug}.jpg`;
}

const RAD = Math.PI / 180;

/** Equatorial (RA/Dec/distance) → equatorial-cartesian parsecs (matches stars.bin). */
export function eqToScene(ra: number, dec: number, d: number): [number, number, number] {
  const cd = Math.cos(dec * RAD);
  return [d * cd * Math.cos(ra * RAD), d * cd * Math.sin(ra * RAD), d * Math.sin(dec * RAD)];
}

// ── Volumetric cloud: thousands of glowing motes distributed in 3D by noise, so
//    a nebula has real depth and structure you can fly into (not a flat sprite). ──

function seeded(s: number) {
  let a = s >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
// cheap 3D value noise for clumping the gas into filaments
function h3(x: number, y: number, z: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => h3(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
    lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v),
    w,
  );
}
function fbm3(x: number, y: number, z: number) {
  let s = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 4; o++) {
    s += amp * vnoise(x * f, y * f, z * f);
    f *= 2;
    amp *= 0.5;
  }
  return s;
}

export interface NebulaCloud {
  positions: Float32Array; // local (centre at origin), parsecs
  colors: Uint8Array;
  sizes: Float32Array;
}

export function buildNebulaCloud(nebula: Nebula, count = 3600): NebulaCloud {
  let seed = 0;
  for (let i = 0; i < nebula.name.length; i++) seed = (seed * 31 + nebula.name.charCodeAt(i)) | 0;
  const rnd = seeded(seed);
  const R = nebula.radius;
  const [r0, g0, b0] = hexRgb(nebula.colors[0]);
  const [r1, g1, b1] = hexRgb(nebula.colors[1]);
  const ns = 1.4 / Math.max(R, 1); // noise scale relative to size

  const pos: number[] = [];
  const col: number[] = [];
  const siz: number[] = [];
  let guard = 0;
  while (pos.length < count * 3 && guard < count * 6) {
    guard++;
    // random direction (slightly flattened in y so it isn't a perfect ball)
    const u = rnd() * 2 - 1;
    const th = rnd() * 2 * Math.PI;
    const s = Math.sqrt(1 - u * u);
    const rr = R * Math.pow(rnd(), 0.55); // centre-concentrated
    const px = s * Math.cos(th) * rr;
    const py = u * rr * 0.75;
    const pz = s * Math.sin(th) * rr;
    // clump into filaments via 3D noise; reject the voids
    const dens = fbm3(px * ns + seed, py * ns, pz * ns);
    if (rnd() > 0.2 + dens * 1.0) continue;

    pos.push(px, py, pz);
    const t = rnd() * 0.6 + dens * 0.4;
    const bright = 0.5 + 0.7 * (1 - rr / R) + dens * 0.4;
    const cl = (a: number, b: number) => Math.min(255, (a * (1 - t) + b * t) * bright);
    col.push(cl(r0, r1), cl(g0, g1), cl(b0, b1));
    siz.push(0.5 + rnd() * 1.3);
  }
  return {
    positions: new Float32Array(pos),
    colors: new Uint8Array(col),
    sizes: new Float32Array(siz),
  };
}
