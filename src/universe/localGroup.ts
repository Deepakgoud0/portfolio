// The Local Group, at real positions. Same units as the galaxy scene: 1 unit = 1 kpc.
//
// Each member is given by its galactic coordinates (l, b) and heliocentric
// distance d — the form these are actually published in. We convert to the same
// galactocentric frame the Milky Way scene uses (disc in XZ, north galactic pole
// along +Y, Sun at +X).

import { SUN_POS } from "./galaxyData";

export type GalaxyType = "spiral" | "irregular" | "dwarf";

export interface Member {
  name: string;
  l: number; // galactic longitude, degrees
  b: number; // galactic latitude, degrees
  d: number; // heliocentric distance, kpc
  diameter: number; // kpc
  type: GalaxyType;
  color: string;
  /**
   * Disc inclination in degrees, as measured from Earth: the angle between the
   * disc's normal and our line of sight. 0° is face-on, 90° edge-on. M31's 77°
   * is why it appears as a long ellipse in the sky.
   */
  inclination?: number;
  label?: boolean;
}

// Sizes here are true diameters. The scene exaggerates them uniformly for
// visibility (SIZE_EXAGGERATION) and gives the smallest dwarfs a floor so they
// don't vanish; the *positions* are never exaggerated.
export const SIZE_EXAGGERATION = 5;
const MIN_DIAMETER = 2.2; // kpc

export function sceneDiameter(m: Member): number {
  return Math.max(m.diameter, MIN_DIAMETER) * SIZE_EXAGGERATION;
}

export const MEMBERS: Member[] = [
  // the two big spirals + M33 dominate the group's mass
  { name: "Andromeda (M31)", l: 121.17, b: -21.57, d: 780, diameter: 46, type: "spiral", color: "#cfe0ff", inclination: 77, label: true },
  { name: "Triangulum (M33)", l: 133.61, b: -31.33, d: 840, diameter: 18, type: "spiral", color: "#c7d8ff", inclination: 56, label: true },

  // Milky Way satellites
  { name: "LMC", l: 280.47, b: -32.89, d: 50, diameter: 9.9, type: "irregular", color: "#dbe6ff", label: true },
  { name: "SMC", l: 302.8, b: -44.3, d: 62, diameter: 5.6, type: "irregular", color: "#d6e2ff", label: true },
  { name: "Sagittarius Dwarf", l: 5.6, b: -14.09, d: 26, diameter: 2.6, type: "dwarf", color: "#ffe2b8" },
  { name: "Ursa Minor", l: 105.0, b: 44.8, d: 76, diameter: 0.6, type: "dwarf", color: "#ffe2b8" },
  { name: "Draco", l: 86.4, b: 34.7, d: 76, diameter: 0.7, type: "dwarf", color: "#ffe2b8" },
  { name: "Sculptor", l: 287.5, b: -83.2, d: 86, diameter: 0.8, type: "dwarf", color: "#ffe2b8" },
  { name: "Sextans", l: 243.5, b: 42.3, d: 86, diameter: 0.9, type: "dwarf", color: "#ffe2b8" },
  { name: "Carina", l: 260.1, b: -22.2, d: 105, diameter: 0.5, type: "dwarf", color: "#ffe2b8" },
  { name: "Fornax", l: 237.1, b: -65.7, d: 140, diameter: 1.7, type: "dwarf", color: "#ffe2b8" },
  { name: "Leo I", l: 226.0, b: 49.1, d: 254, diameter: 1.0, type: "dwarf", color: "#ffe2b8" },

  // Andromeda's own satellites and the group's outskirts
  { name: "M32", l: 121.15, b: -21.98, d: 763, diameter: 2.0, type: "dwarf", color: "#ffe8cc" },
  { name: "M110", l: 120.72, b: -21.14, d: 820, diameter: 5.2, type: "dwarf", color: "#ffe8cc" },
  { name: "NGC 185", l: 120.79, b: -14.48, d: 620, diameter: 2.4, type: "dwarf", color: "#ffe8cc" },
  { name: "NGC 147", l: 119.82, b: -14.25, d: 680, diameter: 3.0, type: "dwarf", color: "#ffe8cc" },
  { name: "IC 10", l: 118.97, b: -3.34, d: 750, diameter: 2.0, type: "irregular", color: "#dbe6ff" },
  { name: "IC 1613", l: 129.74, b: -60.58, d: 760, diameter: 5.0, type: "irregular", color: "#dbe6ff" },
  { name: "NGC 6822", l: 25.34, b: -18.4, d: 500, diameter: 2.7, type: "irregular", color: "#dbe6ff" },
  { name: "WLM", l: 75.87, b: -73.63, d: 970, diameter: 4.0, type: "irregular", color: "#dbe6ff" },
  { name: "Phoenix Dwarf", l: 272.16, b: -68.95, d: 420, diameter: 1.0, type: "dwarf", color: "#ffe2b8" },

  // more real members — mostly faint dwarf spheroidals and dwarf irregulars, the
  // crowd that makes up the bulk of the Local Group's ~80 known galaxies
  { name: "Leo II", l: 220.17, b: 67.23, d: 233, diameter: 0.7, type: "dwarf", color: "#ffe2b8" },
  { name: "Leo A", l: 196.9, b: 52.42, d: 800, diameter: 1.2, type: "irregular", color: "#dbe6ff" },
  { name: "Canes Venatici I", l: 74.3, b: 79.82, d: 218, diameter: 0.6, type: "dwarf", color: "#ffe2b8" },
  { name: "Boötes I", l: 358.08, b: 69.62, d: 66, diameter: 0.4, type: "dwarf", color: "#ffe2b8" },
  { name: "Ursa Major I", l: 159.43, b: 54.41, d: 97, diameter: 0.4, type: "dwarf", color: "#ffe2b8" },
  { name: "Ursa Major II", l: 152.46, b: 37.44, d: 32, diameter: 0.5, type: "dwarf", color: "#ffe2b8" },
  { name: "Coma Berenices", l: 241.9, b: 83.6, d: 44, diameter: 0.2, type: "dwarf", color: "#ffe2b8" },
  { name: "Hercules Dwarf", l: 28.73, b: 36.87, d: 132, diameter: 0.6, type: "dwarf", color: "#ffe2b8" },
  { name: "Segue 1", l: 220.48, b: 50.42, d: 23, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Tucana Dwarf", l: 322.91, b: -47.37, d: 880, diameter: 0.6, type: "dwarf", color: "#ffe2b8" },
  { name: "Cetus Dwarf", l: 101.44, b: -72.9, d: 755, diameter: 0.8, type: "dwarf", color: "#ffe2b8" },
  { name: "Aquarius Dwarf", l: 34.04, b: -31.35, d: 1070, diameter: 0.8, type: "irregular", color: "#dbe6ff" },
  { name: "SagDIG", l: 21.06, b: -16.29, d: 1040, diameter: 1.5, type: "irregular", color: "#dbe6ff" },
  { name: "Pegasus DIG", l: 94.77, b: -43.55, d: 920, diameter: 1.5, type: "irregular", color: "#dbe6ff" },
  { name: "Andromeda I", l: 121.69, b: -24.85, d: 745, diameter: 0.6, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda II", l: 128.9, b: -29.18, d: 652, diameter: 0.7, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda VII", l: 109.46, b: -9.95, d: 763, diameter: 0.9, type: "dwarf", color: "#ffe8cc" },
  { name: "Antlia Dwarf", l: 263.1, b: 22.31, d: 1300, diameter: 0.9, type: "dwarf", color: "#ffe2b8" },
  { name: "LGS 3", l: 126.77, b: -40.9, d: 620, diameter: 0.5, type: "irregular", color: "#dbe6ff" },
  { name: "Leo T", l: 214.85, b: 43.66, d: 420, diameter: 0.3, type: "dwarf", color: "#ffe2b8" },

  // remaining M31 satellites — the "Andromeda N" dwarf spheroidals
  { name: "Andromeda III", l: 119.31, b: -26.25, d: 748, diameter: 0.6, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda V", l: 126.2, b: -15.1, d: 742, diameter: 0.4, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda VI", l: 106.0, b: -36.3, d: 815, diameter: 0.9, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda IX", l: 123.2, b: -19.7, d: 600, diameter: 0.4, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda X", l: 125.8, b: -18.0, d: 710, diameter: 0.3, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XI", l: 121.7, b: -29.1, d: 760, diameter: 0.2, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XII", l: 122.0, b: -28.5, d: 830, diameter: 0.2, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XIII", l: 123.0, b: -29.9, d: 760, diameter: 0.2, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XIV", l: 123.0, b: -33.2, d: 740, diameter: 0.4, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XV", l: 127.9, b: -24.5, d: 630, diameter: 0.4, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XVI", l: 124.9, b: -30.5, d: 525, diameter: 0.3, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XVIII", l: 113.9, b: -16.9, d: 1355, diameter: 0.4, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XIX", l: 115.6, b: -27.4, d: 820, diameter: 0.9, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XXI", l: 111.9, b: -19.2, d: 830, diameter: 0.5, type: "dwarf", color: "#ffe8cc" },
  { name: "Andromeda XXII", l: 132.6, b: -34.1, d: 920, diameter: 0.3, type: "dwarf", color: "#ffe8cc" },

  // Milky Way ultra-faint satellites — SDSS / DES discoveries, the faintest galaxies known
  { name: "Willman 1", l: 158.6, b: 56.8, d: 38, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Segue 2", l: 149.4, b: -38.1, d: 35, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Boötes II", l: 353.7, b: 68.9, d: 42, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Boötes III", l: 35.4, b: 75.4, d: 47, diameter: 0.2, type: "dwarf", color: "#ffe2b8" },
  { name: "Canes Venatici II", l: 113.6, b: 82.7, d: 160, diameter: 0.2, type: "dwarf", color: "#ffe2b8" },
  { name: "Leo IV", l: 265.4, b: 56.5, d: 154, diameter: 0.2, type: "dwarf", color: "#ffe2b8" },
  { name: "Leo V", l: 261.9, b: 58.5, d: 178, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Pisces II", l: 79.2, b: -47.1, d: 180, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Crater II", l: 282.9, b: 42.0, d: 117, diameter: 0.7, type: "dwarf", color: "#ffe2b8" },
  { name: "Aquarius II", l: 55.1, b: -53.0, d: 108, diameter: 0.3, type: "dwarf", color: "#ffe2b8" },
  { name: "Hydra II", l: 295.6, b: 30.5, d: 134, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Draco II", l: 98.9, b: 42.9, d: 22, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Sagittarius II", l: 18.9, b: -22.9, d: 67, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Carina II", l: 270.0, b: -17.0, d: 36, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Reticulum II", l: 266.3, b: -49.7, d: 30, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },
  { name: "Eridanus II", l: 249.8, b: -51.6, d: 380, diameter: 0.3, type: "dwarf", color: "#ffe2b8" },
  { name: "Horologium I", l: 271.4, b: -54.7, d: 79, diameter: 0.1, type: "dwarf", color: "#ffe2b8" },

  // isolated dwarfs at the group's outer edge (~1.3 Mpc, the NGC 3109 association)
  { name: "NGC 3109", l: 262.1, b: 23.1, d: 1300, diameter: 5.0, type: "irregular", color: "#dbe6ff" },
  { name: "Sextans A", l: 246.2, b: 39.9, d: 1320, diameter: 3.4, type: "irregular", color: "#dbe6ff" },
  { name: "Sextans B", l: 233.2, b: 43.8, d: 1345, diameter: 2.6, type: "irregular", color: "#dbe6ff" },
  { name: "Antlia B", l: 263.0, b: 22.5, d: 1290, diameter: 0.9, type: "irregular", color: "#dbe6ff" },
  { name: "UGC 4879", l: 164.7, b: 42.9, d: 1360, diameter: 1.0, type: "irregular", color: "#dbe6ff" },
  { name: "IC 5152", l: 343.9, b: -50.2, d: 1590, diameter: 2.5, type: "irregular", color: "#dbe6ff" },
];

const RAD = Math.PI / 180;

/**
 * Galactic (l, b, d) → the galaxy scene's frame.
 *
 * The galactic basis seen from the Sun is right-handed: X toward the centre,
 * Y toward l = 90°, Z toward the north galactic pole. In scene coordinates the
 * centre sits at the origin with the Sun at +X, so X maps to −x, Y to +z and
 * Z to +y — then we offset by the Sun's position.
 */
export function toScene(l: number, b: number, d: number): [number, number, number] {
  const cb = Math.cos(b * RAD);
  const X = d * cb * Math.cos(l * RAD);
  const Y = d * cb * Math.sin(l * RAD);
  const Z = d * Math.sin(b * RAD);
  return [SUN_POS[0] - X, SUN_POS[1] + Z, Y];
}
