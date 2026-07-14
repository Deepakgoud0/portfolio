export interface Project {
  name: string;
  blurb: string;
  stack: string[];
  live?: string;
  repo?: string;
}

export interface Body {
  key: string;
  label: string;
  texture: string;
  normal?: string;
  size: number;
  orbitRadius: number;
  orbitSpeed: number; // rad/s (derived from the real orbital period)
  spinSpeed: number; // rad/s (derived from the real rotation period; sign = spin direction)
  phase: number;
  axialTilt?: number; // radians, real
  ring?: { texture: string; inner: number; outer: number };
  earth?: boolean;
  project?: Project;
}

/* ── Accurate motion, compressed time ──────────────────────────────────────
   Orbit + rotation RATIOS are physically correct (Kepler's 3rd law: T ∝ a^1.5,
   real rotation periods), but time is sped up so it's watchable:
   Earth orbits in ~40s and rotates once per ~8s. Orbit vs spin use separate
   scales so rotation stays visible instead of blurring. Distances/sizes are
   stylized (true scale = invisible dots), but ORDER + tilts are real.        */
const EARTH_ORBIT_SECONDS = 40;
const EARTH_SPIN_SECONDS = 8;
const orbit = (periodYears: number) =>
  (2 * Math.PI) / (EARTH_ORBIT_SECONDS * periodYears);
const spin = (periodDays: number) =>
  (2 * Math.PI) / (EARTH_SPIN_SECONDS * periodDays); // negative days ⇒ retrograde
const deg = (d: number) => (d * Math.PI) / 180;

export const BODIES: Body[] = [
  {
    key: "mercury",
    label: "Mercury",
    texture: "/textures/2k_mercury.jpg",
    size: 0.5,
    orbitRadius: 8,
    orbitSpeed: orbit(0.2408), // 88 days
    spinSpeed: spin(58.646),
    phase: 0.6,
    axialTilt: deg(0.03),
  },
  {
    key: "earth",
    label: "Live Weather App",
    texture: "/textures/8k_earth_daymap.jpg",
    normal: "/textures/earth_normal.jpg",
    size: 1.0,
    orbitRadius: 12,
    orbitSpeed: orbit(1), // 1 year
    spinSpeed: spin(1), // 1 day
    phase: 4.1,
    axialTilt: deg(23.44),
    earth: true,
    project: {
      name: "Live Weather App",
      blurb:
        "Real-time weather using the OpenWeatherMap API, with async data handling and a responsive UI.",
      stack: ["JavaScript", "REST API", "Bootstrap"],
    },
  },
  {
    key: "mars",
    label: "Task Management System",
    texture: "/textures/8k_mars.jpg",
    size: 0.6,
    orbitRadius: 16,
    orbitSpeed: orbit(1.881),
    spinSpeed: spin(1.025),
    phase: 2.3,
    axialTilt: deg(25.19),
    project: {
      name: "Task Management System",
      blurb: "A full CRUD task manager built on a clean, modular JavaScript architecture.",
      stack: ["JavaScript", "HTML", "CSS"],
    },
  },
  {
    key: "jupiter",
    label: "Jupiter",
    texture: "/textures/8k_jupiter.jpg",
    size: 2.6,
    orbitRadius: 24,
    orbitSpeed: orbit(11.862),
    spinSpeed: spin(0.4135), // ~9.9 h — fastest spinner
    phase: 3.4,
    axialTilt: deg(3.13),
  },
  {
    key: "saturn",
    label: "Snip",
    texture: "/textures/8k_saturn.jpg",
    size: 2.2,
    orbitRadius: 33,
    orbitSpeed: orbit(29.457),
    spinSpeed: spin(0.444),
    phase: 0.9,
    axialTilt: deg(26.73),
    ring: { texture: "/textures/2k_saturn_ring_alpha.png", inner: 2.9, outer: 5.2 },
    project: {
      name: "Snip — URL shortener with analytics",
      blurb:
        "Redis-cached redirects, self-implemented JWT auth, and a click dashboard: clicks over time, referrers, devices, live cache-hit ratio.",
      stack: ["Bun", "Elysia", "MongoDB", "Redis", "React"],
      live: "https://snip-pj53.vercel.app",
      repo: "https://github.com/Deepakgoud0/Snip",
    },
  },
  {
    key: "neptune",
    label: "Neptune",
    texture: "/textures/2k_neptune.jpg",
    size: 1.6,
    orbitRadius: 42,
    orbitSpeed: orbit(164.79),
    spinSpeed: spin(0.6713),
    phase: 5.2,
    axialTilt: deg(28.32),
  },
];
