import MapboxGL from '@rnmapbox/maps';
import type { Venue } from '@/types';

interface Props {
  venues: Venue[];
  onPress: (venue: Venue) => void;
}

export function VenueLayer({ venues, onPress }: Props) {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: venues.map((v) => ({
      type: 'Feature',
      id: v.id,
      geometry: { type: 'Point', coordinates: [v.coordinates.lng, v.coordinates.lat] },
      properties: { id: v.id },
    })),
  };

  function handlePress(e: any) {
    const feature = e?.features?.[0];
    if (!feature) return;
    const venueId = feature.properties?.id;
    const venue = venues.find((v) => v.id === venueId);
    if (venue) onPress(venue);
  }

  return (
    <MapboxGL.ShapeSource
      id="venues-source"
      shape={geojson}
      onPress={handlePress}
    >
      <MapboxGL.CircleLayer
        id="venues-layer"
        style={{
          circleRadius: 6,
          circleColor: '#3B82F6',
          circleStrokeWidth: 1.5,
          circleStrokeColor: '#ffffff',
          circleOpacity: 0.9,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
