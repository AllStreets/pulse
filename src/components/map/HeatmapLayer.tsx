import { useEffect, useRef, useState } from 'react';
import MapboxGL from '@rnmapbox/maps';
import type { HeatmapPoint } from '@/types';

interface Props {
  points: HeatmapPoint[];
}

const DURATION_MS = 2500;

export function HeatmapLayer({ points }: Props) {
  const [opacity, setOpacity] = useState(0.85);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current) % (DURATION_MS * 2);
      // t goes 0→1→0 over one full cycle
      const t = elapsed < DURATION_MS ? elapsed / DURATION_MS : 1 - (elapsed - DURATION_MS) / DURATION_MS;
      // ease-in-out cubic
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      setOpacity(0.5 + eased * 0.45); // 0.5 → 0.95
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { weight: p.weight },
    })),
  };

  return (
    <MapboxGL.ShapeSource id="heatmap-source" shape={geojson}>
      <MapboxGL.HeatmapLayer
        id="heatmap-layer"
        sourceID="heatmap-source"
        style={{
          heatmapWeight: ['get', 'weight'],
          heatmapIntensity: 1.5,
          heatmapColor: [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.1, 'rgba(255,235,0,0.4)',
            0.3, 'rgba(255,165,0,0.6)',
            0.6, 'rgba(255,80,0,0.8)',
            0.8, 'rgba(220,20,20,0.9)',
            1,   'rgba(180,0,0,1)',
          ],
          heatmapRadius: [
            'interpolate', ['linear'], ['zoom'],
            9, 30,
            13, 60,
          ],
          heatmapOpacity: opacity,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
