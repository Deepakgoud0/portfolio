import { Reveal } from "../components/Reveal";
import { KineticHeading } from "../components/KineticHeading";
import { about, stats } from "../data";

export function About() {
  return (
    <section id="about" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-lime">
          01 — About
        </p>
      </Reveal>

      <KineticHeading
        text="I make data move — fast, reliable, and observable."
        className="max-w-4xl text-3xl md:text-5xl"
      />

      <Reveal delay={0.1}>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
          {about}
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={0.15 + i * 0.08}>
            <div className="rounded-2xl border border-line bg-bg-soft/40 p-6 backdrop-blur-sm">
              <div className="font-display text-4xl font-extrabold text-lime">
                {s.value}
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.15em] text-muted">
                {s.label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
