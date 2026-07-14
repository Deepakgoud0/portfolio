import { Reveal } from "../components/Reveal";
import { KineticHeading } from "../components/KineticHeading";
import { experience } from "../data";

export function Experience() {
  return (
    <section
      id="experience"
      className="relative mx-auto max-w-6xl px-6 py-28 md:py-36"
    >
      <Reveal>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-lime">
          04 — Experience
        </p>
      </Reveal>
      <KineticHeading text="Where I've worked." className="text-3xl md:text-5xl" />

      <div className="mt-14 space-y-8">
        {experience.map((job) => (
          <Reveal key={job.company}>
            <article className="rounded-3xl border border-line bg-bg-soft/40 p-8 backdrop-blur-sm md:p-10">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display text-2xl font-extrabold">
                  {job.company}
                </h3>
                <span className="font-mono text-xs text-muted">{job.period}</span>
              </div>
              <p className="mt-1 text-violet-soft">
                {job.role} · {job.location}
              </p>
              <ul className="mt-6 space-y-3">
                {job.points.map((p) => (
                  <li key={p} className="flex gap-3 text-muted">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime" />
                    <span className="leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
