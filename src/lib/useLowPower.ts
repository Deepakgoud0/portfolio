import { useEffect, useState } from "react";

// True when we should skip the heavy 3D scene + custom cursor.
// Tablets (touch, ≥820px) get the universe — camera-controls handles touch
// natively. Phones (<820px) default to the classic site because the cockpit
// needs the width, but can opt in via ?universe=1 (the "Enter the 3D
// universe" button); an explicit choice also overrides reduced-motion.
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);

  useEffect(() => {
    const force = new URLSearchParams(window.location.search).get("universe");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () =>
      setLow(
        force !== null ? force === "0" : reduce.matches || window.innerWidth < 820,
      );

    update();
    reduce.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      reduce.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return low;
}
