import { SmoothScroll } from "./components/SmoothScroll";
import { StaticBackground } from "./three/SceneBackground";
import { Nav } from "./components/Nav";
import { Hero } from "./sections/Hero";
import { About } from "./sections/About";
import { Skills } from "./sections/Skills";
import { Projects } from "./sections/Projects";
import { Experience } from "./sections/Experience";
import { Contact } from "./sections/Contact";

// Lightweight fallback for reduced-motion / touch / small screens: the classic
// scroll site with a static backdrop (no heavy 3D / WebGL universe).
export function ClassicSite() {
  return (
    <SmoothScroll>
      <StaticBackground />
      <Nav />
      <main className="relative">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
