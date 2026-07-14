import { useMemo } from "react";
import { Billboard, Html } from "@react-three/drei";
import * as THREE from "three";
import { NEBULAE, buildNebulaCloud, eqToScene, type Nebula } from "./nebulae";
import { makeNebulaTexture } from "./nebulaTexture";
import { PointCloud } from "./PointCloud";
import { setNebula } from "./focusStore";

// A nebula = a volumetric cloud of glowing motes (fly-into-able) + a soft core
// glow for the diffuse haze from afar, at its real position. Click to fly there.
function NebulaCloud({ nebula, glowTex }: { nebula: Nebula; glowTex: THREE.Texture }) {
  const pos = useMemo(() => eqToScene(nebula.ra, nebula.dec, nebula.d), [nebula]);
  // denser clouds for the physically larger nebulae so they don't look sparse
  const cloud = useMemo(
    () => buildNebulaCloud(nebula, Math.round(Math.min(9000, Math.max(2600, nebula.radius * 320)))),
    [nebula],
  );

  return (
    <group position={pos}>
      {/* volumetric gas — real depth you can fly into */}
      <PointCloud
        positions={cloud.positions}
        colors={cloud.colors}
        sizes={cloud.sizes}
        k={110}
        maxSize={16}
      />
      {/* soft core glow so it still reads as a smooth cloud from a distance */}
      <Billboard>
        <mesh scale={nebula.radius * 1.5}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial
            map={glowTex}
            color={nebula.colors[0]}
            transparent
            opacity={0.32}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </Billboard>
      {/* clickable label — fly here */}
      <Html center position={[0, nebula.radius * 0.9 + 1.5, 0]}>
        <button
          onClick={() => setNebula(nebula.name)}
          className="pointer-events-auto -translate-y-1 cursor-pointer whitespace-nowrap bg-transparent font-mono text-[9px] tracking-widest text-white/65 drop-shadow-[0_0_5px_rgba(0,0,0,0.95)] transition-colors hover:text-lime"
        >
          {nebula.name}
          <span className="block text-[8px] tracking-normal text-white/35">
            {nebula.type} · fly in ▸
          </span>
        </button>
      </Html>
    </group>
  );
}

export function Nebulae() {
  const glowTex = useMemo(() => makeNebulaTexture(11), []);
  return (
    <>
      {NEBULAE.map((n) => (
        <NebulaCloud key={n.name} nebula={n} glowTex={glowTex} />
      ))}
    </>
  );
}
