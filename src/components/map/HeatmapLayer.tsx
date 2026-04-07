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
            0, 'rgba(0,0,0,0)',
            0.2, 'rgba(255,107,53,0.3)',
            0.5, 'rgba(255,107,53,0.7)',
            1, 'rgba(255,107,53,1)',
          ],
          heatmapRadius: 40,
          heatmapOpacity: 0.8,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
