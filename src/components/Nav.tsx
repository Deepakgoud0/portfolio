import { profile } from "../data";

const links = [
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
  { label: "Contact", href: "#contact" },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a
          href="#top"
          className="font-display text-lg font-extrabold tracking-tight"
        >
          {profile.shortName.split(" ")[0]}
          <span className="text-lime">.</span>
        </a>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <a
          href={profile.github}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-line px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink transition-colors hover:border-lime hover:text-lime"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
