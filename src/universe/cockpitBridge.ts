import type { Object3D } from "three";

// Bridges the DOM cockpit HUD (outside the Canvas) with the 3D scene inside it.
// Planets register their mesh here so the NAV COMPUTER can fly to them, and an
// in-canvas probe writes live telemetry the HUD reads via rAF (no React churn).

export const bodyMeshes: Record<string, Object3D> = {};

export const telemetry = {
  range: 0, // camera → target distance (scene units)
  speed: 0, // camera units / second
};
