import MapboxGL from '@rnmapbox/maps';
import type { Venue } from '@/types';

interface Props {
  venues: Venue[];
  onPress: (venue: Venue) => void;
}

function venueColor(v: Venue): string {
  const c = (v.category ?? '').toLowerCase();
  if (c.includes('nightclub') || c.includes('club')) return '#9333ea';
  if (c.includes('cocktail')) return '#f59e0b';
  if (c.includes('dive')) return '#ef4444';
  if (c.includes('rooftop')) return '#14b8a6';
  if (c.includes('lgbtq') || c.includes('gay')) return '#ec4899';
  if (c.includes('craft beer') || c.includes('brewery')) return '#22c55e';
  if (c.includes('sports') || c.includes('bar & grill') || c.includes('bar and grill')) return '#f97316';
  if (c.includes('lounge')) return '#8b5cf6';
  return '#3b82f6';
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
