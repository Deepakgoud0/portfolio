import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

// Inertia-based smooth scrolling (the "buttery" agency-site feel).
export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 }}
    >
      {children}
    </ReactLenis>
  );
}
