// Normalized page scroll progress in [0, 1]. Shared by the 3D scene so the
// core + camera stay in sync with the DOM scroll.
export function scrollProgress(): number {
  const max = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  return Math.min(1, Math.max(0, window.scrollY / max));
}
