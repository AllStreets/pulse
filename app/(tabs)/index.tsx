import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { VenueLayer } from '@/components/map/VenueLayer';
import { NeighborhoodLayer } from '@/components/map/NeighborhoodLayer';
import { CTALayer } from '@/components/map/CTALayer';
import { CTARoutesLayer } from '@/components/map/CTARoutesLayer';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { NeighborhoodSheet } from '@/components/map/NeighborhoodSheet';
import { LiveIntelPanel } from '@/components/map/LiveIntelPanel';
import { VenueRippleOverlay } from '@/components/map/VenueRippleOverlay';
import type { VenueScreenCoord } from '@/components/map/VenueRippleOverlay';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import type { Venue } from '@/types';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

const CHICAGO_CENTER: [number, number] = [-87.6594, 41.9036];

export default function MapScreen() {
  const { venues, heatPoints } = useHeatmap();
  const { neighborhoods } = useNeighborhoods();
  const insets = useSafeAreaInsets();

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodMeta | null>(null);
  const [zoom, setZoom] = useState(10.5);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showCTA, setShowCTA] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [venueScreenCoords, setVenueScreenCoords] = useState<VenueScreenCoord[]>([]);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapViewRef = useRef<MapboxGL.MapView>(null);
  const coordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function adjustZoom(delta: number) {
    const next = Math.min(20, Math.max(5, zoom + delta));
    setZoom(next);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 200 });
  }

  // Compute screen coords for visible venues on every camera change
  const handleCameraChanged = useCallback(async () => {
    if (!mapViewRef.current || venues.length === 0) return;
    if (coordDebounceRef.current) clearTimeout(coordDebounceRef.current);
    coordDebounceRef.current = setTimeout(async () => {
      try {
        const bounds = await mapViewRef.current!.getVisibleBounds();
        // bounds = [[maxLng, maxLat], [minLng, minLat]]
        const [maxLng, maxLat] = bounds[0];
        const [minLng, minLat] = bounds[1];

        const visible = venues.filter(
          v => v.coordinates.lng >= minLng && v.coordinates.lng <= maxLng &&
               v.coordinates.lat >= minLat && v.coordinates.lat <= maxLat
        );

        const coordPairs = await Promise.all(
          visible.map(async v => {
            const pt = await mapViewRef.current!.getPointInView([v.coordinates.lng, v.coordinates.lat]);
            return { id: v.id, x: pt[0], y: pt[1], heatScore: v.current_heat_score };
          })
        );
        setVenueScreenCoords(coordPairs);
      } catch {
        // Map not ready or unmounted — ignore
      }
    }, 150);
  }, [venues]);

  // Recompute when venues load
  useEffect(() => {
    if (mapLoaded && venues.length > 0) handleCameraChanged();
  }, [venues, mapLoaded]);

  // Zoom + open sheet when tapping a Live Intel venue card
  function handleLiveIntelVenueTap(venue: Venue) {
    cameraRef.current?.setCamera({
      centerCoordinate: [venue.coordinates.lng, venue.coordinates.lat],
      zoomLevel: 15,
      animationDuration: 400,
    });
    setSelectedVenue(venue);
  }

  // Zoom + open sheet when tapping a Live Intel neighborhood card
  function handleLiveIntelNeighborhoodTap(neighborhood: NeighborhoodMeta) {
    if (neighborhood.boundary) {
      const coords = neighborhood.boundary.coordinates[0];
      const lng = coords.reduce((s: number, c: number[]) => s + c[0], 0) / coords.length;
      const lat = coords.reduce((s: number, c: number[]) => s + c[1], 0) / coords.length;
      cameraRef.current?.setCamera({
        centerCoordinate: [lng, lat],
        zoomLevel: 13,
        animationDuration: 400,
      });
    }
    setSelectedNeighborhood(neighborhood);
  }

  const neighborhoodVenues = selectedNeighborhood
    ? venues.filter(v => v.neighborhood_id === selectedNeighborhood.id)
    : [];

  const neighborhoodRank = selectedNeighborhood
    ? neighborhoods.findIndex(n => n.id === selectedNeighborhood.id) + 1
    : undefined;

  return (
    <View style={styles.container}>
      {/* Live Intel Panel — above map, below safe area */}
      <View style={{ paddingTop: insets.top }}>
        <LiveIntelPanel
          venues={venues}
          neighborhoods={neighborhoods}
          onVenueTap={handleLiveIntelVenueTap}
          onNeighborhoodTap={handleLiveIntelNeighborhoodTap}
        />
      </View>

      {/* Map fills remaining space */}
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          ref={mapViewRef}
          style={StyleSheet.absoluteFillObject}
          styleURL="mapbox://styles/mapbox/dark-v11"
          zoomEnabled
          scrollEnabled
          pitchEnabled
          rotateEnabled
          compassEnabled={false}
          scaleBarEnabled={false}
          onDidFinishLoadingMap={() => setMapLoaded(true)}
          onCameraChanged={handleCameraChanged}
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
                onPress={setSelectedNeighborhood}
              />
              <HeatmapLayer points={heatPoints} />
              <CTARoutesLayer visible={showCTA} />
              <CTALayer visible={showCTA} />
              <VenueLayer venues={venues} onPress={setSelectedVenue} />
            </>
          )}
        </MapboxGL.MapView>

        {/* Ripple overlay — absolute over map */}
        <VenueRippleOverlay coords={venueScreenCoords} />

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
      </View>

      <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />

      <NeighborhoodSheet
        neighborhood={selectedNeighborhood}
        venues={neighborhoodVenues}
        onClose={() => setSelectedNeighborhood(null)}
        onVenueTap={(v) => {
          setSelectedNeighborhood(null);
          setTimeout(() => setSelectedVenue(v), 300);
        }}
        neighborhoodRank={neighborhoodRank || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  mapContainer: { flex: 1 },

  layerToggles: {
    position: 'absolute',
    top: 12,
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
