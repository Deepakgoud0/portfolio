import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { setFocus, setMapOpen } from "./focusStore";

const HYDERABAD: [number, number] = [78.4867, 17.385]; // [lng, lat]

// Free "dive into Earth": a spinnable satellite globe (Esri World Imagery — no
// API key, no billing) that flies down to real satellite detail. Auto-opens
// when you fly into Earth in the solar system.
export function EarthMode() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      center: HYDERABAD,
      zoom: 3.6, // opens near-globe (matches the 3D dive), then you zoom deeper
      minZoom: 1.2,
      attributionControl: { compact: true },
      style: {
        version: 8,
        sources: {
          esri: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            maxzoom: 19,
            attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
          },
        },
        layers: [
          { id: "bg", type: "background", paint: { "background-color": "#05060a" } },
          { id: "esri", type: "raster", source: "esri" },
        ],
      },
    });

    map.addControl(new maplibregl.NavigationControl(), "bottom-right");

    map.on("load", () => {
      try {
        map.setProjection({ type: "globe" });
      } catch {
        /* older engines: stays flat, still works */
      }
      new maplibregl.Marker({ color: "#c6ff3d" })
        .setLngLat(HYDERABAD)
        .addTo(map);
    });

    // zoom out past the globe view → smoothly return to space
    map.on("zoom", () => {
      if (map.getZoom() < 2.3) setMapOpen(false);
    });

    return () => map.remove();
  }, []);

  return (
    <div className="fixed inset-0 z-[120] bg-black">
      <div ref={container} className="h-full w-full" />
      <div className="pointer-events-none absolute left-5 top-5 z-[130] rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] text-lime backdrop-blur">
        Earth · Satellite
      </div>
      <button
        onClick={() => setFocus(null)}
        className="absolute right-5 top-5 z-[130] rounded-full border border-white/25 bg-black/60 px-4 py-2 font-mono text-xs uppercase tracking-widest text-white backdrop-blur transition-colors hover:border-lime hover:text-lime"
      >
        × Back to space
      </button>
    </div>
  );
}
