import { Reveal } from "../components/Reveal";
import { KineticHeading } from "../components/KineticHeading";
import { skills } from "../data";

export function Skills() {
  return (
    <section id="skills" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-lime">
          02 — Stack
        </p>
      </Reveal>
      <KineticHeading
        text="The tools I reach for."
        className="text-3xl md:text-5xl"
      />

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((s, i) => (
          <Reveal key={s.group} delay={0.05 * i}>
            <div className="group h-full rounded-2xl border border-line bg-bg-soft/40 p-6 backdrop-blur-sm transition-colors hover:border-violet/60">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-violet-soft">
                {s.group}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {s.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-line px-3 py-1 text-sm text-ink transition-colors group-hover:border-lime/40"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
