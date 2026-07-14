import { useEffect, useState } from "react";

// True when we should skip the heavy 3D scene + custom cursor:
// reduced-motion preference, coarse (touch) pointers, or small screens.
export function useLowPower(): boolean {
  const [low, setLow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const update = () =>
      setLow(reduce.matches || coarse.matches || window.innerWidth < 820);

    update();
    reduce.addEventListener("change", update);
    coarse.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      reduce.removeEventListener("change", update);
      coarse.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return low;
}
