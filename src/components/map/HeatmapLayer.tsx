import MapboxGL from '@rnmapbox/maps';
import type { HeatmapPoint } from '@/types';

interface Props {
  points: HeatmapPoint[];
}

export function HeatmapLayer({ points }: Props) {
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
          heatmapOpacity: 0.85,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
