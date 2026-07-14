import { createRoot } from "react-dom/client";
import { App } from "./App";
import "lenis/dist/lenis.css";
import "./index.css";

// NOTE: deliberately no <StrictMode>.
// StrictMode double-mounts every component in development. Each cosmic scale is
// its own <Canvas>, i.e. its own WebGL context, so double-mounting burns two
// contexts per scene and quickly exhausts the browser's pool (~16) — the older
// contexts are then killed and those scenes render as a blank white canvas.
// It also fires effect cleanups immediately after mount, which makes releasing a
// context on unmount unsafe. Production never double-mounts, so this only ever
// bit us in dev — but it made dev useless for the very scenes we needed to test.
createRoot(document.getElementById("root")!).render(<App />);
