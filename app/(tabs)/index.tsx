import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { VenueMarker } from '@/components/map/VenueMarker';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { useHeatmap } from '@/hooks/useHeatmap';
import type { Venue } from '@/types';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

const CHICAGO_CENTER: [number, number] = [-87.6594, 41.9036];

export default function MapScreen() {
  const { venues, heatPoints } = useHeatmap();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL="mapbox://styles/mapbox/dark-v11"
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          zoomLevel={10.5}
          centerCoordinate={CHICAGO_CENTER}
          animationMode="none"
        />
        <HeatmapLayer points={heatPoints} />
        {venues.map((venue) => (
          <VenueMarker key={venue.id} venue={venue} onPress={setSelectedVenue} />
        ))}
      </MapboxGL.MapView>
      {selectedVenue && <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  map: { flex: 1 },
});
