# Portfolio — Jagiryala Deepak Goud

Personal portfolio site — an explorable, astronomically-grounded **universe**. Start at the solar system, dive into Earth down to real satellite imagery, or pull back through the Sun's stellar neighbourhood and out to the whole Milky Way.

**Stack:** React 19 · Vite · TypeScript · Tailwind CSS v4 · **react-three-fiber** + **drei** (3D) · **@react-three/postprocessing** (bloom) · **MapLibre GL** (satellite globe) · **Motion** (animations).

## The cosmic ladder

27 orders of magnitude do not fit in one scene graph — float32 runs out of precision long before you get from a metre to a kiloparsec. So each scale is **its own canvas with its own units**, and the handoffs are distance-triggered crossfades:

| Level | Scene | Units | Enter by | Leave by |
|---|---|---|---|---|
| 0 | Earth, satellite imagery | lat/lng | diving into Earth | zooming out past the globe |
| 1 | Solar system | 12 units = 1 AU | — | zooming past 430 units |
| 2 | Stellar neighbourhood | 1 unit = 1 parsec | — | in on Sol / out past 700 pc |
| 3 | Milky Way | 1 unit = 1 kiloparsec | — | flying to the Sol marker |

Each level's watcher is **armed/re-armed** so arriving at a boundary can't bounce you straight back across it.

## Grounded in real data

- **Planets** move on Kepler's third law (T² ∝ a³), with real axial tilts, orbit and spin decoupled and time-compressed so motion is visible in seconds rather than hours.
- **109,400 stars** are the real HYG catalogue — true 3D positions in parsecs, not a skybox. Colours are computed from each star's B–V index → blackbody temperature (Ballesteros 2012) → RGB (Tanner Helland); sizes from apparent magnitude. Packed to 16 bytes/star (1.7 MB) and drawn as GPU point sprites in one draw call.
- Named stars are **decluttered in screen space** — brightest wins a collision — so labels stay readable at every zoom. Fly to 3 pc and Rigil Kentaurus (Alpha Centauri) sits right where it should, 1.3 pc from Sol.
- **The Milky Way** is generated from measured structure, not eyeballed: R₀ = 8.178 kpc (GRAVITY 2019), disc scale length 2.6 kpc and scale height 0.3 kpc (Bland-Hawthorn & Gerhard 2016), a 3.2 kpc bar at 27° to the Sun–centre line, and four logarithmic-spiral arms at a 15° pitch (Reid et al. 2019). Seeded PRNG, so it's identical every load and never shipped as a file.

## Run locally
```bash
bun install
bun dev        # http://localhost:5174
```

## Build
```bash
bun run build  # outputs to dist/
```

## Deploy
Static Vite site — no backend, no env vars. On Vercel: **New Project → import the repo → Deploy**. It auto-detects Vite; `vercel.json` supplies SPA rewrites and immutable caching for `/assets` and the texture/nebula/star data.

### Performance notes
- **Code-split by scale.** Only the solar system is in the initial bundle (**~394 KB gzip**). Each cosmic scale, the black hole, the nebula close-up, and the Earth dive are separate chunks fetched when you actually travel there — MapLibre alone is 284 KB gzip and never loads unless you dive into Earth.
- **Assets are ~12 MB** (planet textures, the 109k-star binary, 16 Hubble images), served immutable and cached forever.
- Every scale is its own WebGL context. React **StrictMode double-mounts in dev**, so dev creates two contexts per canvas and can exhaust the browser's pool after heavy exploring — production doesn't, and a full round-trip through the ladder runs clean. If you ever debug context errors, check dev vs prod first.

## Credits & licensing
- **Nebula imagery:** the 16 images in `public/nebulae/` are real **NASA / ESA / Hubble / Spitzer** photographs, sourced via Wikimedia Commons. All are **public domain** except *Dumbbell Nebula* (**CC BY 4.0**). Each nebula is rendered as a true 3D volume built from its real structure (torus, pillars, cavity, shell, bipolar lobes) with its **colours read from its own photograph** — which is why the Helix is a teal ring with a red core and the Eagle is dust columns.
- **Star data:** `public/data/stars.bin` and `star-names.json` are derived from the [HYG Database v3](https://github.com/astronexus/HYG-Database) by David Nash, licensed **CC BY-SA**. As adapted databases, those two files carry the same share-alike licence; the source code does not.
- **Satellite imagery:** Esri World Imagery (Esri, Maxar, Earthstar Geographics), via MapLibre.
- **Planet & Milky Way textures:** [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0); Earth normal/specular maps from the three.js repository.
- **Satellite model:** "Satellite" by **Poly by Google**, licensed **CC-BY 3.0**, via [Poly Pizza](https://poly.pizza/).
