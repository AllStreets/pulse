import MapboxGL from '@rnmapbox/maps';
import type { Venue } from '@/types';

interface Props {
  venues: Venue[];
  onPress: (venue: Venue) => void;
}

function venueColor(v: Venue): string {
  if (v.category === 'club') return '#00E5D0';
  if (v.music_genre === 'lounge' || v.music_genre === 'ambient') return '#FF2D78';
  return '#C8A84B';
}

export function VenueLayer({ venues, onPress }: Props) {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: venues.map(v => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [v.coordinates.lng, v.coordinates.lat] },
      properties: { id: v.id, color: venueColor(v) },
    })),
  };

  function handlePress(e: any) {
    const feature = e.features?.[0];
    if (!feature) return;
    const venue = venues.find(v => v.id === feature.properties?.id);
    if (venue) onPress(venue);
  }

  return (
    <MapboxGL.ShapeSource
      id="venues-source"
      shape={geojson}
      onPress={handlePress}
      hitbox={{ width: 44, height: 44 }}
      cluster={false}
    >
      <MapboxGL.CircleLayer
        id="venues-circles"
        style={{
          circleRadius: 8,
          circleColor: ['get', 'color'],
          circleStrokeWidth: 2,
          circleStrokeColor: '#ffffff',
          circleOpacity: 0.92,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
