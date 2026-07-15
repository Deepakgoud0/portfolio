import { useEffect, type CSSProperties, type ReactNode } from "react";
import { motion } from "motion/react";
import { about, experience, skills, stats } from "../data";

// The pilot's dossier, docked as a cockpit console: About + work history + the
// stack, in the same lime/mono language as the rest of the HUD. Content is read
// straight from src/data.ts — the same source the mobile site renders — so it
// never drifts out of sync.

const notch: CSSProperties = {
  clipPath:
    "polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)",
};

function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="font-mono text-[10px] text-lime/70">{n}</span>
      <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/45">
        {children}
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

export function ShipsLog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="pointer-events-auto fixed inset-0 z-[220] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm sm:p-8"
    >
      <motion.div
        initial={{ y: 18, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 10, scale: 0.99 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={notch}
        className="relative flex max-h-[86vh] w-full max-w-2xl flex-col border border-white/12 bg-black/80 shadow-2xl backdrop-blur-xl"
      >
        {/* header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/40">
              Ship's Log
            </div>
            <div className="font-display text-xl font-extrabold leading-tight text-white">
              Pilot dossier · DG-01
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close ship's log"
            className="font-mono text-[11px] uppercase tracking-widest text-white/45 transition-colors hover:text-lime"
          >
            ✕ close
          </button>
        </div>

        {/* scrolling body */}
        <div className="space-y-9 overflow-y-auto px-6 py-6">
          {/* 01 — DOSSIER */}
          <section>
            <SectionLabel n="01">Dossier</SectionLabel>
            <p className="text-[13.5px] leading-relaxed text-white/75">{about}</p>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={notch}
                  className="border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="font-display text-2xl font-extrabold leading-none text-lime">
                    {s.value}
                  </div>
                  <div className="mt-1.5 font-mono text-[9.5px] uppercase leading-tight tracking-wider text-white/45">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 02 — SERVICE RECORD */}
          <section>
            <SectionLabel n="02">Service Record</SectionLabel>
            {experience.map((e) => (
              <div key={e.company}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-mono text-sm text-white">{e.company}</h3>
                  <span className="font-mono text-[10px] tracking-wide text-lime/80">{e.period}</span>
                </div>
                <div className="mb-3 font-mono text-[11px] text-white/50">
                  {e.role} · {e.location}
                </div>
                <ul className="space-y-1.5">
                  {e.points.map((p, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-[12.5px] leading-relaxed text-white/70"
                    >
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-lime/60" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          {/* 03 — SYSTEMS */}
          <section>
            <SectionLabel n="03">Systems</SectionLabel>
            <div className="space-y-2.5">
              {skills.map((g) => (
                <div key={g.group} className="flex flex-col gap-1.5 sm:flex-row sm:gap-3">
                  <div className="shrink-0 pt-1 font-mono text-[10px] uppercase tracking-widest text-white/40 sm:w-32">
                    {g.group}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((it) => (
                      <span
                        key={it}
                        className="border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10.5px] text-white/65"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
