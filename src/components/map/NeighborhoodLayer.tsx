import MapboxGL from '@rnmapbox/maps';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

interface Props {
  neighborhoods: NeighborhoodMeta[];
  visible: boolean;
  onPress?: (neighborhood: NeighborhoodMeta) => void;
}

export function NeighborhoodLayer({ neighborhoods, visible, onPress }: Props) {
  if (!visible) return null;

  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: neighborhoods
      .filter(n => n.boundary != null)
      .map(n => ({
        type: 'Feature',
        geometry: n.boundary!,
        properties: {
          id: n.id,
          name: n.name,
          color: n.map_color,
          ping_count: n.ping_count,
        },
      })),
  };

  function handlePress(e: any) {
    const feature = e.features?.[0];
    if (!feature || !onPress) return;
    const hood = neighborhoods.find(n => n.id === feature.properties?.id);
    if (hood) onPress(hood);
  }

  return (
    <MapboxGL.ShapeSource
      id="neighborhoods-source"
      shape={geojson}
      onPress={onPress ? handlePress : undefined}
    >
      <MapboxGL.FillLayer
        id="neighborhoods-fill"
        style={{
          fillColor: ['get', 'color'],
          fillOpacity: 0.18,
        }}
      />
      <MapboxGL.LineLayer
        id="neighborhoods-outline"
        style={{
          lineColor: ['get', 'color'],
          lineWidth: 1.5,
          lineOpacity: 0.7,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
