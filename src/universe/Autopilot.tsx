import { useEffect, useState, type CSSProperties } from "react";
import {
  focus,
  requestFly,
  requestHome,
  setAutopilot,
  setBlackHole,
  setLevel,
  setNebula,
  useUniverseState,
} from "./focusStore";
import { autopilotBridge } from "./autopilotBridge";

// ── The grand tour ─────────────────────────────────────────────────────────
// Each step just presses the same buttons a visitor would — change scale, fly
// to a planet, open the black hole, dive into a nebula — so the existing entry
// transitions and crossfades do the "travelling" for free. `level` records
// where the step lives so an engage mid-flight can resume near the current view.
interface TourStep {
  id: string;
  level: number;
  caption: string;
  sub: string;
  dwell: number; // ms to linger before advancing
  perform: () => void;
}

const TOUR: TourStep[] = [
  {
    id: "home",
    level: 1,
    caption: "Home system",
    sub: "the solar neighbourhood",
    dwell: 6500,
    perform: () => {
      setLevel(1);
      requestHome();
    },
  },
  {
    id: "saturn",
    level: 1,
    caption: "Snip",
    sub: "flagship project · orbiting Saturn",
    dwell: 9000,
    perform: () => requestFly("saturn"),
  },
  {
    id: "stars",
    level: 2,
    caption: "Stellar neighbourhood",
    sub: "109,400 real stars · 1 unit = 1 parsec",
    dwell: 7500,
    perform: () => setLevel(2),
  },
  {
    id: "orion",
    level: 2,
    caption: "Orion Nebula",
    sub: "flying inside real 3D gas",
    dwell: 9000,
    perform: () => setNebula("Orion Nebula"),
  },
  {
    id: "galaxy",
    level: 3,
    caption: "The Milky Way",
    sub: "a barred spiral, seen from outside",
    dwell: 7500,
    perform: () => setLevel(3),
  },
  {
    id: "blackhole",
    level: 3,
    caption: "Sagittarius A*",
    sub: "the black hole at the galactic core",
    dwell: 12000,
    perform: () => setBlackHole(true),
  },
  {
    id: "localgroup",
    level: 4,
    caption: "The Local Group",
    sub: "~80 galaxies falling together",
    dwell: 7500,
    perform: () => setLevel(4),
  },
  {
    id: "cosmicweb",
    level: 5,
    caption: "The cosmic web",
    sub: "filaments & voids · ~2 billion light-years across",
    dwell: 8500,
    perform: () => setLevel(5),
  },
];

const IDLE_MS = 22000; // no input for this long → offer to fly the tour

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

// Where to begin when the tour engages: resume at the step matching the current
// scale, unless an overlay is open (then start clean from home).
function pickStart(): number {
  if (focus.blackHole || focus.nebula || focus.mapOpen) return 0;
  const i = TOUR.findIndex((s) => s.level === focus.level);
  return i >= 0 ? i : 0;
}

interface StepView {
  caption: string;
  sub: string;
  dwell: number;
  seq: number;
}

const notch: CSSProperties = {
  clipPath:
    "polygon(0 13px, 13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%)",
};

export function Autopilot() {
  const { autopilot, level } = useUniverseState();
  const [step, setStep] = useState<StepView | null>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);

  // Keep the reduced-motion preference live.
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(m.matches);
    m.addEventListener?.("change", on);
    return () => m.removeEventListener?.("change", on);
  }, []);

  // Any real input hands control back to the human instantly; a stretch of idle
  // re-offers the tour. One handler drives both the disengage and the idle timer.
  useEffect(() => {
    let idle: number;
    const arm = () => {
      clearTimeout(idle);
      if (!reduced) idle = window.setTimeout(() => setAutopilot(true), IDLE_MS);
    };
    const onInput = () => {
      if (focus.autopilot) setAutopilot(false);
      arm();
    };
    window.addEventListener("pointerdown", onInput);
    window.addEventListener("wheel", onInput, { passive: true });
    window.addEventListener("keydown", onInput);
    window.addEventListener("touchstart", onInput, { passive: true });
    arm();
    return () => {
      clearTimeout(idle);
      window.removeEventListener("pointerdown", onInput);
      window.removeEventListener("wheel", onInput);
      window.removeEventListener("keydown", onInput);
      window.removeEventListener("touchstart", onInput);
    };
  }, [reduced]);

  // The timeline. Advances by chaining timeouts (not one interval), so each
  // dwell is honoured exactly and cleanup is a single clearTimeout.
  useEffect(() => {
    if (!autopilot) {
      setStep(null);
      return;
    }
    let timer: number;
    let idx = pickStart();
    let seq = 0;
    const run = () => {
      const s = TOUR[idx];
      autopilotBridge.lastStepAt = performance.now();
      s.perform();
      setStep({ caption: s.caption, sub: s.sub, dwell: s.dwell, seq: seq++ });
      timer = window.setTimeout(() => {
        idx = (idx + 1) % TOUR.length;
        run();
      }, s.dwell);
    };
    run();
    return () => clearTimeout(timer);
  }, [autopilot]);

  // Sit above the solar dashboard at level 1; drop to the corner elsewhere.
  const posClass = level === 1 ? "bottom-[7.5rem]" : "bottom-8";

  return (
    <div
      className={`pointer-events-none fixed left-1/2 z-[210] -translate-x-1/2 ${posClass}`}
    >
      {autopilot && step ? (
        <div
          style={notch}
          className="pointer-events-auto flex items-center gap-4 border border-lime/30 bg-black/70 px-4 py-2.5 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime" />
          </span>

          <div className="min-w-[13rem]">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/40">
              Autopilot · move to take control
            </div>
            <div className="font-mono text-sm leading-tight text-lime">{step.caption}</div>
            <div className="font-mono text-[10px] leading-tight text-white/50">{step.sub}</div>
            <div className="mt-1.5 h-px w-full bg-white/10">
              <div
                key={step.seq}
                className="h-px bg-lime/70"
                style={{ animation: `ap-progress ${step.dwell}ms linear forwards` }}
              />
            </div>
          </div>

          <button
            onClick={() => setAutopilot(false)}
            aria-label="Stop the tour"
            className="ml-1 font-mono text-[10px] uppercase tracking-widest text-white/50 transition-colors hover:text-lime"
          >
            ⏹ stop
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAutopilot(true)}
          style={notch}
          className="pointer-events-auto border border-white/15 bg-black/60 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/70 backdrop-blur-md transition-colors hover:border-lime/60 hover:text-lime"
        >
          ⏵ Auto-tour the universe
        </button>
      )}
    </div>
  );
}
