import { motion } from "motion/react";
import { profile } from "../data";
import { Magnetic } from "../components/Magnetic";

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-center px-6"
    >
      <div className="mx-auto w-full max-w-6xl">
        <motion.p
          custom={0}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-lime"
        >
          {profile.role} · {profile.location}
        </motion.p>

        <motion.h1
          custom={1}
          variants={rise}
          initial="hidden"
          animate="show"
          className="text-[13.5vw] leading-[0.9] md:text-[8.5rem] md:leading-[0.86]"
          style={{ textShadow: "0 4px 60px rgba(11,11,18,0.7)" }}
        >
          Deepak
          <br />
          <span className="text-violet-soft">Goud</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mt-8 max-w-xl text-lg text-muted md:text-xl"
        >
          {profile.tagline}
        </motion.p>

        <motion.div
          custom={3}
          variants={rise}
          initial="hidden"
          animate="show"
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Magnetic>
            <a
              href="#work"
              className="inline-block rounded-full bg-lime px-6 py-3 font-medium text-bg"
            >
              View work
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href="#contact"
              className="inline-block rounded-full border border-line px-6 py-3 font-medium text-ink transition-colors hover:border-violet hover:text-violet-soft"
            >
              Get in touch
            </a>
          </Magnetic>
          <Magnetic>
            {/* opt into the full 3D experience on devices that default to this site */}
            <a
              href="?universe=1"
              className="inline-block rounded-full border border-lime/40 px-6 py-3 font-mono text-sm text-lime transition-colors hover:bg-lime/10"
            >
              ◆ Enter the 3D universe
            </a>
          </Magnetic>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted"
      >
        scroll ↓
      </motion.div>
    </section>
  );
}
