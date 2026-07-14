import { motion } from "motion/react";
import { Reveal } from "../components/Reveal";
import { KineticHeading } from "../components/KineticHeading";
import { projects, type Project } from "../data";

export function Projects() {
  const featured = projects.find((p) => p.featured);
  const others = projects.filter((p) => !p.featured);

  return (
    <section id="work" className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <Reveal>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-lime">
          03 — Selected work
        </p>
      </Reveal>
      <KineticHeading text="Things I've built." className="text-3xl md:text-5xl" />

      {featured && (
        <Reveal delay={0.1} className="mt-14">
          <FeaturedCard project={featured} />
        </Reveal>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {others.map((p, i) => (
          <Reveal key={p.name} delay={0.1 + i * 0.08}>
            <SmallCard project={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ project }: { project: Project }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-3xl border border-line bg-bg-soft/50 p-8 backdrop-blur-sm md:p-12"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl transition-opacity group-hover:opacity-60"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 70%)" }}
      />

      <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-lime px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-bg">
              {project.tag}
            </span>
            <span className="font-mono text-xs text-muted">{project.year}</span>
          </div>

          <h3 className="mt-6 font-display text-4xl font-extrabold md:text-6xl">
            {project.name}
          </h3>
          <p className="mt-5 text-lg leading-relaxed text-muted">{project.blurb}</p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {project.stack.map((t) => (
              <li
                key={t}
                className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink"
              >
                {t}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-4">
            {project.live && (
              <a
                href={project.live}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-lime px-5 py-2.5 font-medium text-bg transition-transform hover:-translate-y-0.5"
              >
                Live demo <span aria-hidden>↗</span>
              </a>
            )}
            {project.repo && (
              <a
                href={project.repo}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-2.5 font-medium transition-colors hover:border-violet hover:text-violet-soft"
              >
                Source <span aria-hidden>↗</span>
              </a>
            )}
          </div>
        </div>

        {project.preview && (
          <div className="hidden lg:block">
            <img
              src={project.preview}
              alt={`${project.name} preview`}
              loading="lazy"
              className="w-full rotate-2 rounded-xl border border-line opacity-80 shadow-2xl shadow-black/50 transition-all duration-500 ease-out group-hover:-translate-y-1 group-hover:rotate-0 group-hover:opacity-100"
            />
          </div>
        )}
      </div>
    </motion.article>
  );
}

function SmallCard({ project }: { project: Project }) {
  const body = (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex h-full flex-col rounded-3xl border border-line bg-bg-soft/40 p-8 backdrop-blur-sm transition-colors hover:border-violet/60"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl font-extrabold">{project.name}</h3>
        <span className="font-mono text-xs text-muted">{project.year}</span>
      </div>
      <p className="mt-4 flex-1 text-muted">{project.blurb}</p>
      <ul className="mt-5 flex flex-wrap gap-2">
        {project.stack.map((t) => (
          <li
            key={t}
            className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted"
          >
            {t}
          </li>
        ))}
      </ul>
    </motion.article>
  );

  return project.repo ? (
    <a href={project.repo} target="_blank" rel="noreferrer" className="block h-full">
      {body}
    </a>
  ) : (
    body
  );
}
