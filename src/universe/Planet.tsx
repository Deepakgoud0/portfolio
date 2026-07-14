import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { SRGBColorSpace } from "three";
import type { Body } from "./data";
import { useFocus } from "./useFocus";
import { bodyMeshes } from "./cockpitBridge";

// A textured planet lit by the Sun (real day/night terminator), with an
// optional properly-UV'd ring (Saturn).
export function Planet({ body }: { body: Body }) {
  const spin = useRef<THREE.Group>(null!);
  const focus = useFocus(body.key);

  const urls = useMemo(() => {
    const u = [body.texture];
    if (body.normal) u.push(body.normal);
    if (body.ring) u.push(body.ring.texture);
    return u;
  }, [body]);

  const tex = useTexture(urls);
  let i = 0;
  const map = tex[i++];
  map.colorSpace = SRGBColorSpace;
  const normalMap = body.normal ? tex[i++] : undefined;
  const ringMap = body.ring ? tex[i++] : undefined;

  // Ring geometry with radial UVs so the strip texture maps across the radius.
  const ringGeo = useMemo(() => {
    if (!body.ring) return null;
    const { inner, outer } = body.ring;
    const geo = new THREE.RingGeometry(inner, outer, 96);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k);
      geo.attributes.uv.setXY(k, (v.length() - inner) / (outer - inner), 0.5);
    }
    return geo;
  }, [body.ring]);

  useFrame((_, delta) => {
    spin.current.rotation.y += delta * body.spinSpeed;
  });

  return (
    <group rotation={[0, 0, body.axialTilt ?? 0]}>
      <group ref={spin}>
        <mesh
          {...focus}
          ref={(el) => {
            if (el) bodyMeshes[body.key] = el;
          }}
        >
          <sphereGeometry args={[body.size, 48, 48]} />
          <meshStandardMaterial map={map} normalMap={normalMap} metalness={0} roughness={0.92} />
        </mesh>
      </group>

      {ringGeo && ringMap && (
        <mesh geometry={ringGeo} rotation={[-Math.PI / 2, 0, 0]}>
          <meshBasicMaterial
            map={ringMap}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}
    </group>
  );
}
