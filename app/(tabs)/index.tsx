import { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { VenueLayer } from '@/components/map/VenueLayer';
import { NeighborhoodLayer } from '@/components/map/NeighborhoodLayer';
import { CTALayer } from '@/components/map/CTALayer';
import { CTARoutesLayer } from '@/components/map/CTARoutesLayer';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import type { Venue } from '@/types';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

const CHICAGO_CENTER: [number, number] = [-87.6594, 41.9036];

export default function MapScreen() {
  const { venues, heatPoints } = useHeatmap();
  const { neighborhoods } = useNeighborhoods();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [zoom, setZoom] = useState(10.5);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showCTA, setShowCTA] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  function adjustZoom(delta: number) {
    const next = Math.min(20, Math.max(5, zoom + delta));
    setZoom(next);
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
        onDidFinishLoadingMap={() => setMapLoaded(true)}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          defaultSettings={{ zoomLevel: 10.5, centerCoordinate: CHICAGO_CENTER }}
        />
        {mapLoaded && (
          <>
            <NeighborhoodLayer
              neighborhoods={neighborhoods}
              visible={showNeighborhoods}
            />
            <HeatmapLayer points={heatPoints} />
            <CTARoutesLayer visible={showCTA} />
            <CTALayer visible={showCTA} />
            <VenueLayer venues={venues} onPress={setSelectedVenue} />
          </>
        )}
      </MapboxGL.MapView>

      {/* Layer toggles */}
      <View style={styles.layerToggles}>
        <TouchableOpacity
          style={[styles.toggleBtn, showNeighborhoods && styles.toggleBtnActive]}
          onPress={() => setShowNeighborhoods(v => !v)}
        >
          <Text style={[styles.toggleText, showNeighborhoods && styles.toggleTextActive]}>
            Scenes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, showCTA && styles.toggleBtnActive]}
          onPress={() => setShowCTA(v => !v)}
        >
          <Text style={[styles.toggleText, showCTA && styles.toggleTextActive]}>
            CTA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Zoom controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(1)}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={() => adjustZoom(-1)}>
          <Text style={styles.zoomText}>-</Text>
        </TouchableOpacity>
      </View>

      <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },

  layerToggles: {
    position: 'absolute',
    top: 56,
    right: 12,
    gap: 6,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(14,14,14,0.88)',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderColor: '#3B82F6',
  },
  toggleText: { color: '#888', fontSize: 12, fontWeight: '600' },
  toggleTextActive: { color: '#3B82F6' },

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
