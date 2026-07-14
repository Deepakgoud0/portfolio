import { useEffect, useState } from "react";
import { PointCloud } from "./PointCloud";

interface StarData {
  pos: Float32Array; // parsecs, equatorial cartesian (Sol at origin)
  col: Uint8Array; // real colours: B–V → blackbody temperature → RGB
  size: Float32Array; // derived from apparent magnitude
}

// 109,400 real stars from the HYG catalogue (Hipparcos + Yale + Gliese), packed
// to 16 bytes each. Positions are their true 3D positions, not a skybox.
export function StarField() {
  const [data, setData] = useState<StarData | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/stars.bin")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (cancelled) return;
        const count = new DataView(buf).getUint32(4, true); // after the 'HYG1' magic
        const pos = new Float32Array(buf, 8, count * 3);
        const col = new Uint8Array(buf, 8 + count * 12, count * 3);
        const magByte = new Uint8Array(buf, 8 + count * 12 + count * 3, count);

        const size = new Float32Array(count);
        for (let i = 0; i < count; i++) {
          const mag = (magByte[i] / 255) * 16 - 2; // reconstruct apparent magnitude
          // brightness ∝ 10^(-0.4 m), so radius ∝ 10^(-0.2 m)
          size[i] = Math.min(9, Math.max(0.35, 3 * Math.pow(10, -0.2 * mag)));
        }
        setData({ pos, col, size });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return null;
  return <PointCloud positions={data.pos} colors={data.col} sizes={data.size} />;
}
