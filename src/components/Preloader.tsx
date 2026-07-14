import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

// Full-screen intro: a counter races to 100, then the panel slides away.
export function Preloader({ onDone }: { onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n += Math.floor(Math.random() * 8) + 4;
      if (n >= 100) {
        n = 100;
        clearInterval(id);
        setTimeout(() => setGone(true), 350);
      }
      setCount(n);
    }, 85);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {!gone && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-end justify-between bg-bg px-6 pb-8 md:px-10 md:pb-10"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            Deepak Goud — Portfolio
          </span>
          <span className="font-display text-[22vw] font-extrabold leading-[0.8] md:text-[11rem]">
            {count}
            <span className="text-lime">.</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
