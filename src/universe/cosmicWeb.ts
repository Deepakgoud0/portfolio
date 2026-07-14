// The cosmic web — the largest structure there is. Galaxies aren't scattered
// randomly; gravity has pulled them into a foam of filaments and sheets around
// near-empty voids ~100-200 Mpc across. This is the honest top of the ladder:
// past the Local Group there is no bigger *bound* object, only this texture,
// and past the observable-universe horizon we simply cannot see.
//
// Scene units: 1 unit = 1 megaparsec (Mpc). The Milky Way sits at the origin.
// The structure is generated to match what galaxy surveys (SDSS, 2dF) show —
// dense nodes, connecting filaments, empty voids — with a handful of REAL
// superclusters anchored at their real distances as labelled markers.

export interface Anchor {
  name: string;
  dist: number; // Mpc from us
  dir: [number, number, number]; // approximate direction (unit-ish), for placement only
}

// Real structures around us, at real distances. Directions are approximate — the
// point is the scale, and that we are not at the centre of anything.
export const ANCHORS: Anchor[] = [
  { name: "Virgo Cluster", dist: 16.5, dir: [0.3, 0.9, 0.3] },
  { name: "Fornax Cluster", dist: 19, dir: [-0.2, -0.9, 0.3] },
  { name: "Great Attractor", dist: 65, dir: [-0.6, -0.3, -0.75] },
  { name: "Perseus-Pisces", dist: 70, dir: [0.8, -0.2, 0.55] },
  { name: "Coma Cluster", dist: 99, dir: [0.1, 0.98, -0.1] },
  { name: "Hercules S.C.", dist: 160, dir: [0.5, 0.6, 0.6] },
  { name: "Shapley S.C.", dist: 200, dir: [-0.75, -0.2, -0.63] },
];

export const R_MAX = 320; // Mpc — extent of the generated web (well inside the horizon)

export interface Web {
  positions: Float32Array;
  colors: Uint8Array;
  sizes: Float32Array;
  nodes: [number, number, number][]; // cluster centres, for filament lines
  edges: [number, number][]; // node index pairs joined by a filament
}

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N_NODES = 70;
const MIN_SPACING = 42; // Mpc — sets the void scale
const N_CLUSTER = 90_000; // galaxies bound in cluster nodes
const N_FILAMENT = 130_000; // galaxies strung along filaments
const N_FIELD = 20_000; // sparse field galaxies (mostly in the voids' skins)
export const N_TOTAL = N_CLUSTER + N_FILAMENT + N_FIELD;

export function buildCosmicWeb(): Web {
  const rand = rng(31415926);
  const gauss = () => {
    const u = 1 - rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  // --- 1. cluster nodes: Poisson-disc-ish, so voids emerge naturally ---
  const nodes: [number, number, number][] = [];
  // anchor the real superclusters first
  for (const a of ANCHORS) {
    const L = Math.hypot(...a.dir) || 1;
    nodes.push([
      (a.dir[0] / L) * a.dist,
      (a.dir[1] / L) * a.dist,
      (a.dir[2] / L) * a.dist,
    ]);
  }
  let guard = 0;
  while (nodes.length < N_NODES && guard++ < 20000) {
    const r = R_MAX * Math.cbrt(rand());
    const th = rand() * 2 * Math.PI;
    const ph = Math.acos(2 * rand() - 1);
    const p: [number, number, number] = [
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th),
      r * Math.cos(ph),
    ];
    if (nodes.every((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > MIN_SPACING))
      nodes.push(p);
  }

  // --- 2. filaments: join each node to its 3 nearest, deduped ---
  const edges: [number, number][] = [];
  const seen = new Set<string>();
  for (let i = 0; i < nodes.length; i++) {
    const near = nodes
      .map((q, j) => ({ j, d: Math.hypot(nodes[i][0] - q[0], nodes[i][1] - q[1], nodes[i][2] - q[2]) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
    for (const { j, d } of near) {
      if (d > MIN_SPACING * 2.6) continue; // don't bridge across a whole void
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([i, j]);
    }
  }

  const positions = new Float32Array(N_TOTAL * 3);
  const colors = new Uint8Array(N_TOTAL * 3);
  const sizes = new Float32Array(N_TOTAL);
  let k = 0;
  const put = (x: number, y: number, z: number, r: number, g: number, b: number, s: number) => {
    positions[k * 3] = x;
    positions[k * 3 + 1] = y;
    positions[k * 3 + 2] = z;
    colors[k * 3] = r;
    colors[k * 3 + 1] = g;
    colors[k * 3 + 2] = b;
    sizes[k] = s;
    k++;
  };

  // --- 3a. cluster galaxies: dense gaussian halos, redder (old ellipticals) ---
  for (let n = 0; n < N_CLUSTER; n++) {
    const node = nodes[(rand() * nodes.length) | 0];
    const spread = 5 + rand() * 7;
    const t = rand();
    put(
      node[0] + gauss() * spread,
      node[1] + gauss() * spread,
      node[2] + gauss() * spread,
      255,
      210 - t * 45,
      150 - t * 60,
      0.7 + rand() * 0.8,
    );
  }

  // --- 3b. filament galaxies: along edges, tapering perpendicular scatter ---
  for (let n = 0; n < N_FILAMENT; n++) {
    const e = edges[(rand() * edges.length) | 0];
    if (!e) break;
    const a = nodes[e[0]];
    const b = nodes[e[1]];
    const u = rand();
    // thicker near the nodes, thinnest at mid-filament
    const thick = 2.2 + 6 * Math.abs(u - 0.5);
    const t = rand();
    put(
      a[0] + (b[0] - a[0]) * u + gauss() * thick,
      a[1] + (b[1] - a[1]) * u + gauss() * thick,
      a[2] + (b[2] - a[2]) * u + gauss() * thick,
      190 + t * 45,
      205 + t * 40,
      255,
      0.5 + rand() * 0.6,
    );
  }

  // --- 3c. field galaxies: sparse, filling the voids' skins faintly ---
  for (let n = 0; n < N_FIELD; n++) {
    const r = R_MAX * Math.cbrt(rand());
    const th = rand() * 2 * Math.PI;
    const ph = Math.acos(2 * rand() - 1);
    put(
      r * Math.sin(ph) * Math.cos(th),
      r * Math.sin(ph) * Math.sin(th),
      r * Math.cos(ph),
      170,
      185,
      220,
      0.4 + rand() * 0.3,
    );
  }

  return { positions, colors, sizes, nodes, edges };
}
