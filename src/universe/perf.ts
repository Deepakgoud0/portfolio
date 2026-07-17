// Phone GPUs are far weaker than desktop ones and the heavy scenes (ray-marched
// black hole, volumetric nebulae) cost per rendered pixel — so small screens get
// a lower device-pixel-ratio cap. Read once per scene mount.
export const smallScreen = () => window.innerWidth < 640;

export function sceneDpr(
  desktop: [number, number],
  mobile: [number, number],
): [number, number] {
  return smallScreen() ? mobile : desktop;
}
