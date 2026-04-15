import { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
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
import { StadiumLayer } from '@/components/map/StadiumLayer';
import type { StadiumScreenCoord } from '@/components/map/StadiumLayer';
import { StadiumSheet } from '@/components/map/StadiumSheet';
import { allStadiumTeams } from '@/data/stadiums';
import type { StadiumTeamEntry } from '@/data/stadiums';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useHotVenuesStore } from '@/stores/hotVenuesStore';
import { useMapNavStore } from '@/stores/mapNavStore';
import { useFriendships } from '@/hooks/useFriendships';
import { useFriendsHeatmap } from '@/hooks/useFriendsHeatmap';
import { useUserStore } from '@/stores/userStore';
import type { Venue } from '@/types';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN!);

const CHICAGO_CENTER: [number, number] = [-87.6594, 41.9036];

export default function MapScreen() {
  const { venues, heatPoints, activeVenueIds } = useHeatmap();
  const { neighborhoods } = useNeighborhoods();
  const { hotVenues, fetchHotVenues } = useHotVenuesStore();
  const profile = useUserStore((s) => s.profile);
  const { friendUserIds } = useFriendships(profile?.id ?? null);
  const { heatPoints: friendsHeatPoints, activeVenueIds: friendsActiveVenueIds } = useFriendsHeatmap(friendUserIds);

  // Initial fetch + refresh every 5 minutes
  useEffect(() => {
    fetchHotVenues();
    const interval = setInterval(fetchHotVenues, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const insets = useSafeAreaInsets();

  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodMeta | null>(null);
  const [zoom, setZoom] = useState(10.5);
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [showCTA, setShowCTA] = useState(false);
  const [friendsMode, setFriendsMode] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [venueScreenCoords, setVenueScreenCoords] = useState<VenueScreenCoord[]>([]);
  const [stadiumScreenCoords, setStadiumScreenCoords] = useState<StadiumScreenCoord[]>([]);
  const [selectedStadiumEntry, setSelectedStadiumEntry] = useState<StadiumTeamEntry | null>(null);
  const [mapMoving, setMapMoving] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const cameraRef = useRef<MapboxGL.Camera>(null);
  const mapViewRef = useRef<MapboxGL.MapView>(null);
  const coordDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cross-tab venue navigation from Tonight.
  // Read Zustand state directly on focus — setPendingVenue is always called before router.navigate,
  // so the value is always set by the time the Map tab gains focus.
  useFocusEffect(
    useCallback(() => {
      const venue = useMapNavStore.getState().pendingVenue;
      if (!venue) return;
      useMapNavStore.getState().setPendingVenue(null);
      setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: [venue.coordinates.lng, venue.coordinates.lat],
          zoomLevel: 15,
          animationDuration: 600,
        });
        setTimeout(() => setSelectedVenue(venue), 620);
      }, 80);
    }, [])
  );

  function adjustZoom(delta: number) {
    const next = Math.min(20, Math.max(5, zoom + delta));
    setZoom(next);
    cameraRef.current?.setCamera({ zoomLevel: next, animationDuration: 200 });
  }

  // Compute screen coords for visible venues on every camera change.
  // Hide overlay while moving; recompute and show once camera settles.
  const handleCameraChanged = useCallback(async (e?: any) => {
    if (e?.properties?.zoom !== undefined) {
      setZoom(e.properties.zoom);
    }
    if (!mapViewRef.current || venues.length === 0) return;

    setMapMoving(true);

    if (movingTimeoutRef.current) clearTimeout(movingTimeoutRef.current);
    if (coordDebounceRef.current) clearTimeout(coordDebounceRef.current);

    movingTimeoutRef.current = setTimeout(async () => {
      try {
        const bounds = await mapViewRef.current!.getVisibleBounds();
        const [maxLng, maxLat] = bounds[0];
        const [minLng, minLat] = bounds[1];

        // Filter to visible viewport first — reduces getPointInView calls
        const visible = venues.filter(
          v => v.coordinates.lng >= minLng && v.coordinates.lng <= maxLng &&
               v.coordinates.lat >= minLat && v.coordinates.lat <= maxLat
        );

        const coordPairs = await Promise.all(
          visible.map(async v => {
            const pt = await mapViewRef.current!.getPointInView([v.coordinates.lng, v.coordinates.lat]);
            return { id: v.id, x: pt[0], y: pt[1], heatScore: v.current_heat_score, category: v.category ?? '' };
          })
        );
        setVenueScreenCoords(coordPairs);

        const stadiumEntries = allStadiumTeams();
        const stadiumCoords: StadiumScreenCoord[] = await Promise.all(
          stadiumEntries.map(async entry => {
            const base = await mapViewRef.current!.getPointInView(entry.stadiumCoords);
            return {
              stadiumId: entry.stadiumId,
              teamId: entry.team.id,
              x: base[0] + entry.team.spreadOffset.x,
              y: base[1] + entry.team.spreadOffset.y,
              entry,
            };
          })
        );
        setStadiumScreenCoords(stadiumCoords);

        setMapMoving(false);
      } catch {
        setMapMoving(false);
      }
    }, 120);
  }, [venues]);

  // Recompute when venues load
  useEffect(() => {
    if (mapLoaded && venues.length > 0) handleCameraChanged();
  }, [venues, mapLoaded]);

  // Zoom + open sheet when tapping a Live Intel venue card.
  // Wait for camera animation to finish before opening sheet for a smooth sequence.
  function handleLiveIntelVenueTap(venue: Venue) {
    cameraRef.current?.setCamera({
      centerCoordinate: [venue.coordinates.lng, venue.coordinates.lat],
      zoomLevel: 15,
      animationDuration: 600,
    });
    setTimeout(() => setSelectedVenue(venue), 620);
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
        animationDuration: 600,
      });
    }
    setTimeout(() => setSelectedNeighborhood(neighborhood), 620);
  }

  function resetMap() {
    cameraRef.current?.setCamera({
      centerCoordinate: CHICAGO_CENTER,
      zoomLevel: 10.5,
      animationDuration: 500,
    });
  }

  const neighborhoodVenues = selectedNeighborhood
    ? venues.filter(v => v.neighborhood_id === selectedNeighborhood.id)
    : [];

  const neighborhoodRank = selectedNeighborhood
    ? neighborhoods.findIndex(n => n.id === selectedNeighborhood.id) + 1
    : undefined;

  return (
    <View style={styles.container}>
      {/* Map fills entire screen */}
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
            />
            <HeatmapLayer points={friendsMode ? friendsHeatPoints : heatPoints} zoom={zoom} />
            <CTARoutesLayer visible={showCTA} />
            <CTALayer visible={showCTA} />
            <MapboxGL.UserLocation
              visible
              renderMode="custom"
              onUpdate={(loc) =>
                setUserCoords([loc.coords.longitude, loc.coords.latitude])
              }
            />
            <MapboxGL.ShapeSource
              id="user-location-source"
              shape={{
                type: 'FeatureCollection',
                features: userCoords ? [{
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: userCoords },
                  properties: {},
                }] : [],
              }}
            >
              <MapboxGL.CircleLayer
                id="user-location-halo"
                style={{ circleRadius: 14, circleColor: '#41B6E6', circleOpacity: 0.18 }}
              />
              <MapboxGL.CircleLayer
                id="user-location-dot"
                style={{ circleRadius: 7, circleColor: '#41B6E6', circleStrokeWidth: 2, circleStrokeColor: '#fff' }}
              />
            </MapboxGL.ShapeSource>
            <VenueLayer venues={venues} onPress={setSelectedVenue} />
          </>
        )}
      </MapboxGL.MapView>

      {/* Ripple overlay — all venues shown, only those with active pings pulse */}
      {!mapMoving && (
        <VenueRippleOverlay
          coords={venueScreenCoords}
          activeVenueIds={friendsMode ? friendsActiveVenueIds : activeVenueIds}
        />
      )}

      {/* Stadium team badges */}
      {!mapMoving && (
        <StadiumLayer
          coords={stadiumScreenCoords}
          onPress={setSelectedStadiumEntry}
        />
      )}

      {/* Loading overlay — shown until Mapbox finishes loading */}
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00d4ff" />
        </View>
      )}

      {/* Live Intel Panel — floats over map below safe area */}
      <View
        style={[styles.panelOverlay, { top: insets.top }]}
        onLayout={e => setPanelHeight(e.nativeEvent.layout.height)}
      >
        <LiveIntelPanel
          hotVenues={hotVenues}
          neighborhoods={neighborhoods}
          onVenueTap={handleLiveIntelVenueTap}
          onNeighborhoodTap={handleLiveIntelNeighborhoodTap}
        />
      </View>

      {/* Layer toggles — positioned below the panel */}
      <View style={[styles.layerToggles, { top: insets.top + panelHeight + 8 }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, styles.toggleBtnActive]}
          onPress={() => setFriendsMode(v => !v)}
        >
          <Text style={styles.toggleTextActive}>
            {friendsMode ? 'Friends' : 'City'}
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
        <TouchableOpacity style={styles.toggleBtn} onPress={resetMap}>
          <Text style={styles.toggleText}>Reset</Text>
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

      <StadiumSheet
        entry={selectedStadiumEntry}
        onClose={() => setSelectedStadiumEntry(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060b18',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },

  panelOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
  },

  layerToggles: {
    position: 'absolute',
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
