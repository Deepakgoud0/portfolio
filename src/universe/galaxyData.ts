// Procedural Milky Way, built from measured structural parameters.
// Scene units: 1 unit = 1 kiloparsec. Galactic plane is XZ, Y is height.
//
// Sources for the numbers below:
//   R0 (Sun→centre) = 8.178 kpc      GRAVITY Collaboration 2019
//   disc scale length h_R ≈ 2.6 kpc  Bland-Hawthorn & Gerhard 2016
//   thin-disc scale height ≈ 0.3 kpc  ditto
//   bar half-length ≈ 3.2 kpc, ~27° to the Sun–centre line   ditto
//   spiral pitch angle ≈ 13–16°, four major arms             Reid et al. 2019
//   stellar disc truncates ≈ 15–16 kpc
//
// Seeded so the galaxy — and the Sun's place in it — is identical every load,
// which also means we never ship it as a file.

export const R_SUN = 8.178; // kpc
export const SUN_POS: [number, number, number] = [R_SUN, 0.02, 0];

const H_R = 2.6; // disc scale length, kpc
const H_Z = 0.3; // thin-disc scale height, kpc
const R_MAX = 15.5; // stellar disc truncation, kpc
const BAR_HALF = 3.2; // kpc
const BAR_ANGLE = (27 * Math.PI) / 180;
const ARMS = 4;
const PITCH = (15 * Math.PI) / 180;
const B = Math.tan(PITCH); // logarithmic spiral: r = a·e^(bθ)
const A = 1.5; // kpc, inner radius of the spiral

const N_ARM = 150_000;
const N_DISC = 45_000;
const N_BULGE = 45_000;
const N_HALO = 6_000;
export const N_TOTAL = N_ARM + N_DISC + N_BULGE + N_HALO;

// deterministic PRNG (mulberry32)
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Galaxy {
  positions: Float32Array;
  colors: Uint8Array;
  sizes: Float32Array;
}

export interface ArmNebula {
  pos: [number, number, number];
  size: number; // kpc
  warm: boolean; // pink emission vs blue reflection
}

// Star-forming clouds strung along the spiral arms — the pink glow real spiral
// galaxies show where new stars light up the gas. Seeded, so it's stable.
export function buildArmNebulae(count = 60): ArmNebula[] {
  const rand = rng(90210);
  const out: ArmNebula[] = [];
  for (let i = 0; i < count; i++) {
    const r = BAR_HALF + rand() * (R_MAX - BAR_HALF);
    const arm = i % ARMS;
    const theta = Math.log(r / A) / B + (arm * 2 * Math.PI) / ARMS + (rand() - 0.5) * 0.45;
    const jitter = (rand() - 0.5) * 1.4;
    const rr = r + jitter;
    out.push({
      pos: [rr * Math.cos(theta), (rand() - 0.5) * 0.35, rr * Math.sin(theta)],
      size: 0.5 + rand() * 1.6,
      warm: rand() < 0.82,
    });
  }
  return out;
}

export function buildGalaxy(): Galaxy {
  const rand = rng(20260710);
  const gauss = () => {
    // Box–Muller
    const u = 1 - rand();
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  // exponential disc: r = -h·ln(1-u), rejected above the truncation radius
  const expR = (h: number, min: number, max: number) => {
    for (let i = 0; i < 24; i++) {
      const r = -h * Math.log(1 - rand());
      if (r >= min && r <= max) return r;
    }
    return min + rand() * (max - min);
  };

  const positions = new Float32Array(N_TOTAL * 3);
  const colors = new Uint8Array(N_TOTAL * 3);
  const sizes = new Float32Array(N_TOTAL);
  let i = 0;

  const put = (
    x: number,
    y: number,
    z: number,
    r: number,
    g: number,
    b: number,
    s: number,
  ) => {
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    sizes[i] = s;
    i++;
  };

  // --- spiral arms: young, hot, blue-white stars + pink HII knots ---
  for (let n = 0; n < N_ARM; n++) {
    const r = expR(H_R * 1.35, BAR_HALF, R_MAX);
    const arm = n % ARMS;
    // arms widen with radius, as observed
    const spread = 0.13 + 0.06 * (r / R_MAX);
    const theta =
      Math.log(r / A) / B + (arm * 2 * Math.PI) / ARMS + gauss() * spread;

    const jitter = gauss() * 0.22;
    const rr = r + jitter;
    const x = rr * Math.cos(theta);
    const z = rr * Math.sin(theta);
    const y = gauss() * H_Z * 0.55;

    if (rand() < 0.035) {
      // HII region: star-forming, pink-red, brighter
      put(x, y, z, 255, 128, 156, 2.1 + rand() * 1.5);
    } else {
      // young OB stars — the arms are blue because that's where stars form
      const t = rand();
      put(x, y, z, 150 + t * 70, 180 + t * 55, 255, 0.85 + rand() * 0.7);
    }
  }

  // --- smooth inter-arm disc: older, warmer, dimmer, so the arms read ---
  for (let n = 0; n < N_DISC; n++) {
    const r = expR(H_R, 0.4, R_MAX);
    const theta = rand() * 2 * Math.PI;
    const y = gauss() * H_Z;
    const t = rand();
    put(
      r * Math.cos(theta),
      y,
      r * Math.sin(theta),
      210,
      182 - t * 25,
      146 - t * 40,
      0.5 + rand() * 0.4,
    );
  }

  // --- boxy/peanut bar + bulge: old population, yellow-orange ---
  for (let n = 0; n < N_BULGE; n++) {
    let x: number, y: number, z: number;
    if (n % 3 === 0) {
      // spheroidal bulge
      const s = Math.abs(gauss()) * 0.7;
      const th = rand() * 2 * Math.PI;
      const ph = Math.acos(2 * rand() - 1);
      x = s * Math.sin(ph) * Math.cos(th);
      z = s * Math.sin(ph) * Math.sin(th);
      y = s * Math.cos(ph) * 0.65;
    } else {
      // Bar, sampled in its own frame then rotated into the disc. Density along a
      // real bar is near-flat rather than gaussian, so sample x uniformly and let
      // the cross-section taper toward the ends.
      const u = rand() * 2 - 1;
      const bx = u * BAR_HALF;
      const taper = 1 - 0.72 * Math.abs(u);
      const by = gauss() * 0.46 * taper;
      x = bx * Math.cos(BAR_ANGLE) - by * Math.sin(BAR_ANGLE);
      z = bx * Math.sin(BAR_ANGLE) + by * Math.cos(BAR_ANGLE);
      y = gauss() * 0.26 * taper;
    }
    const t = rand();
    put(x, y, z, 255, 214 - t * 40, 140 - t * 55, 0.6 + rand() * 0.5);
  }

  // --- sparse stellar halo / globular-cluster region ---
  for (let n = 0; n < N_HALO; n++) {
    const s = 4 + Math.abs(gauss()) * 9;
    const th = rand() * 2 * Math.PI;
    const ph = Math.acos(2 * rand() - 1);
    put(
      s * Math.sin(ph) * Math.cos(th),
      s * Math.cos(ph),
      s * Math.sin(ph) * Math.sin(th),
      220,
      226,
      255,
      0.5 + rand() * 0.3,
    );
  }

  return { positions, colors, sizes };
}
