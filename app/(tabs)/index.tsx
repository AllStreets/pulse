import { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { VenueLayer } from '@/components/map/VenueLayer';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { useHeatmap } from '@/hooks/useHeatmap';
import type { Venue } from '@/types';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

const CHICAGO_CENTER: [number, number] = [-87.6594, 41.9036];

export default function MapScreen() {
  const { venues, heatPoints } = useHeatmap();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [zoom, setZoom] = useState(10.5);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  function adjustZoom(delta: number) {
    const next = Math.min(20, Math.max(5, zoom + delta));
    setZoom(next);
    // setCamera with only zoomLevel — no centerCoordinate — so the map
    // zooms around wherever the user is currently looking
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 200 });
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL="mapbox://styles/mapbox/dark-v11"
        zoomEnabled
        scrollEnabled
        pitchEnabled
        rotateEnabled
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{ zoomLevel: 10.5, centerCoordinate: CHICAGO_CENTER }}
        />
        <HeatmapLayer points={heatPoints} />
        <VenueLayer venues={venues} onPress={setSelectedVenue} />
      </MapboxGL.MapView>
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(1)}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(-1)}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>
      {selectedVenue && <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  zoomControls: {
    position: 'absolute',
    right: 9,
    bottom: 58,
    gap: 4,
  },
  zoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(20,20,20,0.85)',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: { color: '#fff', fontSize: 18, fontWeight: '300', lineHeight: 22 },
});
