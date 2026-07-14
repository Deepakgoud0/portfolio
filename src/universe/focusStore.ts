import { useSyncExternalStore } from "react";

// Cosmic scale levels. 27 orders of magnitude can't share one scene graph, so
// each level is its own canvas with its own units, crossfaded at the handoff:
//   1 = solar system (12 units = 1 AU)
//   2 = stellar neighbourhood (1 unit = 1 parsec, real HYG stars)
//   3 = Milky Way (1 unit = 1 kiloparsec)
//   4 = Local Group (1 unit = 1 kiloparsec, real member positions)
//   5 = cosmic web (1 unit = 1 megaparsec, large-scale structure)
export interface State {
  key: string | null; // focused body
  paused: boolean; // orbits frozen while focused
  mapOpen: boolean; // Earth satellite overlay open
  level: number; // current cosmic scale level
  enterDir: "out" | "in" | null; // how we arrived at this level (for entry animation)
  flyRequest: string | null; // NAV COMPUTER asked to fly to this body (consumed in-canvas)
  blackHole: boolean; // SGR A* close-up (ray-marched) open
  nebula: string | null; // name of the nebula open for its volumetric close-up
}

let state: State = {
  key: null,
  paused: false,
  mapOpen: false,
  level: 1,
  enterDir: null,
  flyRequest: null,
  blackHole: false,
  nebula: null,
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

// Live getters for reads inside useFrame (no re-render needed).
export const focus = {
  get key() {
    return state.key;
  },
  get paused() {
    return state.paused;
  },
  get mapOpen() {
    return state.mapOpen;
  },
  get level() {
    return state.level;
  },
  get enterDir() {
    return state.enterDir;
  },
  get flyRequest() {
    return state.flyRequest;
  },
  get blackHole() {
    return state.blackHole;
  },
  get nebula() {
    return state.nebula;
  },
};

export function setFocus(key: string | null) {
  state = {
    ...state,
    key,
    paused: key !== null,
    mapOpen: key === null ? false : state.mapOpen, // reset closes the map
  };
  emit();
}

export function setMapOpen(mapOpen: boolean) {
  state = { ...state, mapOpen };
  emit();
}

// NAV COMPUTER: focus a body and ask the in-canvas controller to fly to it.
export function requestFly(key: string) {
  state = { ...state, key, paused: true, mapOpen: false, flyRequest: key };
  emit();
}

export function setBlackHole(blackHole: boolean) {
  state = { ...state, blackHole };
  emit();
}

export function setNebula(nebula: string | null) {
  state = { ...state, nebula };
  emit();
}

// Recenter to the system overview (handled in-canvas via the "__home__" sentinel).
export function requestHome() {
  state = { ...state, key: null, paused: false, mapOpen: false, flyRequest: "__home__" };
  emit();
}

export function clearFlyRequest() {
  if (state.flyRequest === null) return;
  state = { ...state, flyRequest: null };
  emit();
}

export function setLevel(level: number) {
  if (state.level === level) return;
  const enterDir: "out" | "in" = level > state.level ? "out" : "in";
  // changing scale clears any focus/overlay
  state = {
    ...state,
    level,
    enterDir,
    key: null,
    paused: false,
    mapOpen: false,
    blackHole: false,
    nebula: null,
  };
  emit();
}

// Dev-only hook so overlays can be driven from the console for testing.
if (import.meta.env.DEV) {
  (globalThis as unknown as { __uni?: unknown }).__uni = {
    setFocus,
    setMapOpen,
    setLevel,
    setBlackHole,
    setNebula,
    get state() {
      return state;
    },
  };
}

// Reactive snapshot for UI (nav prompt, map overlay, level).
export function useUniverseState(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
