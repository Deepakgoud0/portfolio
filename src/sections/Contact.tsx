import { Reveal } from "../components/Reveal";
import { profile } from "../data";

export function Contact() {
  return (
    <section
      id="contact"
      className="relative mx-auto max-w-6xl px-6 py-32 md:py-44"
    >
      <Reveal>
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.25em] text-lime">
          05 — Contact
        </p>
      </Reveal>

      <Reveal delay={0.05}>
        <h2 className="max-w-4xl text-5xl md:text-8xl">
          Let's build
          <br />
          <span className="text-violet-soft">something.</span>
        </h2>
      </Reveal>

      <Reveal delay={0.1}>
        <a
          href={`mailto:${profile.email}`}
          className="mt-10 inline-block font-mono text-lg text-ink underline decoration-lime decoration-2 underline-offset-8 transition-colors hover:text-lime"
        >
          {profile.email}
        </a>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="mt-12 flex flex-wrap gap-4">
          <a
            href={profile.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-5 py-2.5 transition-colors hover:border-lime hover:text-lime"
          >
            GitHub
          </a>
          <a
            href={profile.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-5 py-2.5 transition-colors hover:border-lime hover:text-lime"
          >
            LinkedIn
          </a>
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full border border-line px-5 py-2.5 transition-colors hover:border-lime hover:text-lime"
          >
            Email
          </a>
        </div>
      </Reveal>

      <footer className="mt-28 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-8 font-mono text-xs text-muted">
        <span>© 2026 {profile.name}</span>
        <span>Built with React · Three.js · Motion</span>
      </footer>
    </section>
  );
}
