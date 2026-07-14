import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { BODIES, type Body } from "./data";
import { requestFly, requestHome, setFocus, useUniverseState } from "./focusStore";
import { telemetry } from "./cockpitBridge";

// ── Identity + comms (edit these) ─────────────────────────────────────────
const PILOT = { name: "Jagiryala Deepak Goud", role: "Full-Stack Engineer", callsign: "DG-01" };

const RESUME_URL = "/resume.pdf";

const COMMS: { label: string; href: string; handle: string }[] = [
  { label: "GitHub", href: "https://github.com/Deepakgoud0", handle: "Deepakgoud0" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/deepakgoudjagiryala0212",
    handle: "deepakgoudjagiryala0212",
  },
  { label: "Email", href: "mailto:deepakgoud1979@gmail.com", handle: "deepakgoud1979@gmail.com" },
  ...(RESUME_URL ? [{ label: "Résumé", href: RESUME_URL, handle: "PDF ↓" }] : []),
];

const DESTINATIONS = BODIES.filter((b) => b.project);

// Angular glass panel — notched top-left + bottom-right, like the real cockpit bezels.
const notch: CSSProperties = {
  clipPath:
    "polygon(0 13px, 13px 0, 100% 0, 100% calc(100% - 13px), calc(100% - 13px) 100%, 0 100%)",
};

function Panel({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{ ...notch, ...style }}
      className={`pointer-events-auto border border-white/12 bg-black/55 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/35">{children}</div>
  );
}

// Corner canopy brackets — the sense of looking through a windscreen.
function CanopyBrackets() {
  const B = "absolute h-8 w-8 border-lime/40";
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className={`${B} left-4 top-4 border-l border-t`} />
      <div className={`${B} right-4 top-4 border-r border-t`} />
      <div className={`${B} bottom-4 left-4 border-b border-l`} />
      <div className={`${B} bottom-4 right-4 border-b border-r`} />
    </div>
  );
}

// Live range/velocity, driven by rAF straight to the DOM (no React re-renders).
function Telemetry({ locationLabel }: { locationLabel: string }) {
  const rangeRef = useRef<HTMLSpanElement>(null);
  const velRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (rangeRef.current) rangeRef.current.textContent = telemetry.range.toFixed(1);
      if (velRef.current) velRef.current.textContent = telemetry.speed.toFixed(1);
      if (barRef.current) {
        const pct = Math.min(100, (telemetry.range / 480) * 100);
        barRef.current.style.width = `${pct}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="flex flex-col justify-center gap-1 px-5 py-3">
      <Label>Location</Label>
      <div className="font-mono text-sm tracking-widest text-lime">{locationLabel}</div>
      <div className="mt-1 h-px w-full bg-white/10">
        <div ref={barRef} className="h-px bg-lime/70" style={{ width: "0%" }} />
      </div>
      <div className="mt-1 flex gap-6 font-mono text-[11px] text-white/70">
        <span>
          RANGE <span ref={rangeRef} className="text-white">0.0</span>
        </span>
        <span>
          VEL <span ref={velRef} className="text-white">0.0</span>
        </span>
      </div>
    </div>
  );
}

function NavComputer({ activeKey }: { activeKey: string | null }) {
  return (
    <Panel className="w-60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <Label>Nav Computer</Label>
        <span className="font-mono text-[9px] text-lime/70">{DESTINATIONS.length} WAYPOINTS</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {DESTINATIONS.map((b) => {
          const active = activeKey === b.key;
          return (
            <button
              key={b.key}
              onClick={() => requestFly(b.key)}
              style={notch}
              className={`group flex items-center gap-2.5 px-2.5 py-2 text-left transition-colors ${
                active
                  ? "bg-lime/15 text-lime"
                  : "bg-white/[0.03] text-white/75 hover:bg-white/[0.07] hover:text-white"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-lime" : "bg-white/30 group-hover:bg-lime/60"}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[11px]">{b.project!.name}</span>
                <span className="block truncate font-mono text-[9px] uppercase tracking-widest text-white/30">
                  {b.key}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function ProjectCard({ body }: { body: Body }) {
  const p = body.project!;
  return (
    <Panel className="w-[22rem] max-w-[calc(100vw-3rem)] p-5">
      <div className="mb-1 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
        <Label>Waypoint · {body.key}</Label>
      </div>
      <h2 className="mb-2 font-mono text-lg leading-tight text-white">{p.name}</h2>
      <p className="mb-3 text-[13px] leading-relaxed text-white/70">{p.blurb}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {p.stack.map((s) => (
          <span
            key={s}
            className="border border-white/12 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-white/60"
          >
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {p.live && (
          <a
            href={p.live}
            target="_blank"
            rel="noreferrer"
            style={notch}
            className="bg-lime px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-black transition-opacity hover:opacity-85"
          >
            LIVE DEMO ↗
          </a>
        )}
        {p.repo && (
          <a
            href={p.repo}
            target="_blank"
            rel="noreferrer"
            style={notch}
            className="border border-white/20 px-3 py-1.5 font-mono text-[11px] tracking-wide text-white/80 transition-colors hover:border-lime hover:text-lime"
          >
            SOURCE ↗
          </a>
        )}
        <button
          onClick={() => setFocus(null)}
          className="ml-auto font-mono text-[10px] uppercase tracking-widest text-white/40 transition-colors hover:text-white/80"
        >
          ✕ disengage
        </button>
      </div>
    </Panel>
  );
}

export function Cockpit() {
  const { level, key, mapOpen, blackHole } = useUniverseState();
  // The cockpit is the home-base shell: shown while flying the solar system.
  if (level !== 1 || mapOpen || blackHole) return null;

  const focusedBody = key ? BODIES.find((b) => b.key === key) : undefined;
  const activeProject = focusedBody?.project ? focusedBody : undefined;

  return (
    <div className="pointer-events-none fixed inset-0 z-[200]">
      <CanopyBrackets />

      {/* top centre — flight mode tag + recenter */}
      <div className="pointer-events-none absolute left-1/2 top-5 -translate-x-1/2 text-center">
        <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/30">
          ◇ manual flight ◇
        </div>
        <div className="mt-1 font-mono text-[9px] tracking-widest text-white/20">
          drag · scroll to zoom · scroll out to travel the cosmos
        </div>
      </div>

      {/* recenter — top right */}
      <button
        onClick={requestHome}
        style={notch}
        className="pointer-events-auto absolute right-5 top-5 border border-white/15 bg-black/55 px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest text-white/70 backdrop-blur transition-colors hover:border-lime/60 hover:text-lime"
      >
        ⌂ recenter
      </button>

      {/* NAV COMPUTER — left */}
      <div className="absolute bottom-36 left-5 hidden sm:block">
        <NavComputer activeKey={key} />
      </div>

      {/* project detail — appears when a waypoint is selected */}
      {activeProject && (
        <div className="absolute bottom-36 right-5">
          <ProjectCard body={activeProject} />
        </div>
      )}

      {/* bottom dashboard */}
      <div className="absolute inset-x-3 bottom-3 flex items-stretch gap-3">
        {/* identity */}
        <Panel className="flex flex-col justify-center px-5 py-3">
          <Label>Pilot · {PILOT.callsign}</Label>
          <div className="font-display text-lg font-extrabold leading-tight text-white">
            {PILOT.name}
          </div>
          <div className="font-mono text-[11px] tracking-wide text-lime">{PILOT.role}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
              all systems nominal
            </span>
          </div>
        </Panel>

        {/* telemetry */}
        <Panel className="min-w-[15rem]">
          <Telemetry locationLabel="SOLAR SYSTEM" />
        </Panel>

        {/* comms */}
        <Panel className="ml-auto flex flex-col justify-center px-4 py-3">
          <Label>Comms</Label>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {COMMS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                style={notch}
                className="flex max-w-[10.5rem] flex-col border border-white/10 bg-white/[0.03] px-2.5 py-1.5 transition-colors hover:border-lime/60 hover:bg-white/[0.06]"
              >
                <span className="font-mono text-[11px] text-white/85">{c.label}</span>
                <span className="truncate font-mono text-[9px] text-white/35" title={c.handle}>
                  {c.handle}
                </span>
              </a>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
