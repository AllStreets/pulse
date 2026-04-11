import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { Toast } from '@/components/ui/Toast';
import { useTonightFeed } from '@/hooks/useTonightFeed';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';
import { useSportsTonight } from '@/hooks/useSportsTonight';
import { useEventsTonight } from '@/hooks/useEventsTonight';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useHeatmap } from '@/hooks/useHeatmap';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { NeighborhoodSheet } from '@/components/map/NeighborhoodSheet';
import { FirstCallSheet } from '@/components/tonight/FirstCallSheet';
import { GameBanner } from '@/components/tonight/GameBanner';
import { SceneSection } from '@/components/tonight/SceneSection';
import { EventsList } from '@/components/tonight/EventsList';
import { notifyIfCallsPoppingOff } from '@/hooks/useNotifications';
import { GuestBanner } from '@/components/ui/GuestBanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Venue } from '@/types';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

const HEAT_COLORS = ['#FFD700', '#FFA500', '#FF6B00', '#FF2200', '#CC0000'];

function heatColor(rank: number, total: number): string {
  const idx = Math.min(HEAT_COLORS.length - 1, Math.floor((rank / total) * HEAT_COLORS.length));
  return HEAT_COLORS[idx];
}

function outcomeIcon(outcome: string): { name: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string } {
  switch (outcome) {
    case 'correct':   return { name: 'checkmark-circle', color: '#4CAF50', label: 'Correct' };
    case 'incorrect': return { name: 'close-circle', color: '#f44336', label: 'Missed' };
    case 'voided':    return { name: 'remove-circle-outline', color: '#555', label: 'Voided' };
    default:          return { name: 'time-outline', color: '#888', label: 'Pending' };
  }
}

function VenueCardSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={[skeletonStyles.card, { opacity: 1 - i * 0.2 }]}
        >
          <SkeletonBox width={38} height={38} borderRadius={10} />
          <View style={skeletonStyles.lines}>
            <SkeletonBox height={16} width="60%" borderRadius={6} />
            <SkeletonBox height={12} width="40%" borderRadius={6} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={64} height={34} borderRadius={10} />
        </Animated.View>
      ))}
    </>
  );
}

const skeletonStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d1628',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  lines: { flex: 1, gap: 6 },
});

export default function TonightScreen() {
  const profile = useUserStore((s) => s.profile);
  const { hotVenues, myPredictions, loading, refresh } = useTonightFeed(profile?.id ?? null);
  const { callsRemaining, hasCalledTarget, makeCall, canCall } = usePredictions(profile?.id ?? null);
  const { games } = useSportsTonight();
  const { events } = useEventsTonight();
  const { neighborhoods } = useNeighborhoods();
  const { venues } = useHeatmap();
  const browseMode = useUserStore((s) => s.browseMode);
  const router = useRouter();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodMeta | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [showFirstCallSheet, setShowFirstCallSheet] = useState(false);
  const scrollRef = useRef<ScrollViewType>(null);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedNeighborhood(null);
        setSelectedVenue(null);
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      };
    }, [])
  );

  useEffect(() => {
    if (loading || !profile?.id || hotVenues.length === 0 || myPredictions.length === 0) return;
    const pendingPreds = myPredictions.filter(p => p.outcome === 'pending');
    if (!pendingPreds.length) return;
    const venueList = hotVenues.map(h => ({
      id: h.venue.id,
      name: h.venue.name,
      current_heat_score: h.venue.current_heat_score,
    }));
    notifyIfCallsPoppingOff(profile.id, pendingPreds, venueList);
  }, [loading, profile?.id]);

  const neighborhoodVenues = selectedNeighborhood
    ? venues.filter(v => v.neighborhood_id === selectedNeighborhood.id)
    : [];

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
    setToastKey(k => k + 1);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  async function handleCall(venue: Venue) {
    if (browseMode) {
      Alert.alert('Sign up to call venues', 'Create a free account to make calls and track your predictions.', [
        { text: 'Sign Up', onPress: () => router.replace('/(auth)/login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    const seen = await AsyncStorage.getItem('first_call_seen');
    if (!seen) {
      setShowFirstCallSheet(true);
      await AsyncStorage.setItem('first_call_seen', 'true');
      return;
    }
    await makeCall('venue', venue.id, venue.current_heat_score);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const liveGames = games.filter(g => g.status === 'in');

  return (
    <View style={styles.root}>
      <GuestBanner />
      <Toast key={toastKey} message="Updated" visible={toastVisible} />
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[styles.content, browseMode && { paddingTop: 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#666" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.cityRow}>
              <Text style={styles.city}>Chicago</Text>
              {liveGames.length > 0 && (
                <View style={styles.liveGamePill}>
                  <Ionicons name="radio-button-on" size={10} color="#4CAF50" />
                  <Text style={styles.liveGameText}>{liveGames.map(g => g.chicagoTeam).join(', ')} live</Text>
                </View>
              )}
            </View>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
          <View style={styles.callsPill}>
            <Text style={styles.callsNumber}>{callsRemaining}</Text>
            <Text style={styles.callsLabel}>calls left</Text>
          </View>
        </View>

        {/* Game banner */}
        <GameBanner games={games} />

        {/* Hot Right Now */}
        <View style={styles.sectionHeader}>
          <Ionicons name="flame" size={18} color="#FF6B00" />
          <Text style={styles.sectionTitle}>Hot Right Now</Text>
        </View>

        {/* Hot neighborhoods strip — shown when venues are quiet but neighborhoods have activity */}
        {!loading && hotVenues.length === 0 && neighborhoods.some(n => n.is_hot) && (
          <SceneSection neighborhoods={neighborhoods} onPress={setSelectedNeighborhood} hotOnly />
        )}

        {loading ? (
          <VenueCardSkeleton />
        ) : hotVenues.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="moon-outline" size={32} color="#333" />
            <Text style={styles.emptyTitle}>Quiet out there</Text>
            <Text style={styles.emptyBody}>No signals yet tonight. Check back after 9PM or pull to refresh.</Text>
          </View>
        ) : (
          hotVenues.map((item) => {
            const called = hasCalledTarget(item.venue.id);
            const color = item.neighborhoodColor;
            return (
              <TouchableOpacity
                key={item.venue.id}
                style={[styles.venueCard, { borderLeftColor: color }]}
                onPress={() => setSelectedVenue(item.venue)}
                activeOpacity={0.75}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.rankBadge, { backgroundColor: color + '22', borderColor: color + '80' }]}>
                    <Text style={[styles.rankText, { color }]}>#{item.rank}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.venueName}>{item.venue.name}</Text>
                    <View style={styles.hoodRow}>
                      <View style={[styles.hoodDot, { backgroundColor: color }]} />
                      <Text style={[styles.hoodLabel, { color }]}>{item.neighborhoodName}</Text>
                      {item.venue.category ? <Text style={styles.hoodSep}>·</Text> : null}
                      {item.venue.category ? <Text style={styles.venueMeta}>{item.venue.category}{item.venue.music_genre ? ` · ${item.venue.music_genre}` : ''}</Text> : null}
                    </View>
                    <View style={styles.pingRow}>
                      <Ionicons name="radio-button-on" size={10} color={color} />
                      <Text style={[styles.pingCount, { color }]}>{item.pingCount} live signal{item.pingCount !== 1 ? 's' : ''}</Text>
                      {item.velocity === 'rising' && <Ionicons name="trending-up" size={11} color="#4CAF50" />}
                      {item.callerCount > 0 && (
                        <>
                          <Text style={styles.pingDot}>·</Text>
                          <Text style={styles.callerCountText}>{item.callerCount} caller{item.callerCount !== 1 ? 's' : ''} tonight</Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  {called ? (
                    <View style={styles.calledBadge}>
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                      <Text style={styles.calledText}>Called</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.callBtn, !canCall && styles.callBtnDisabled]}
                      onPress={() => handleCall(item.venue)}
                      disabled={!canCall}
                    >
                      <Text style={styles.callBtnText}>{canCall ? 'Call It' : '—'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Scenes Tonight */}
        <View style={{ marginTop: 32 }}>
          <SceneSection neighborhoods={neighborhoods} onPress={setSelectedNeighborhood} />
        </View>

        {/* Events Tonight */}
        <View style={{ marginTop: 16 }}>
          <EventsList events={events} />
        </View>

        {/* Your Calls Tonight */}
        {myPredictions.length > 0 && (
          <>
            <View style={[styles.sectionHeader, { marginTop: 32 }]}>
              <Ionicons name="radio-button-on" size={18} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Your Calls Tonight</Text>
            </View>
            {myPredictions.map((p) => {
              const { name, color, label } = outcomeIcon(p.outcome);
              return (
                <View key={p.id} style={styles.predictionRow}>
                  <View style={styles.predInfo}>
                    <Text style={styles.predVenue}>{p.venueName}</Text>
                    {p.points_awarded != null && p.points_awarded > 0 && (
                      <Text style={styles.predPoints}>+{p.points_awarded} pts</Text>
                    )}
                  </View>
                  <View style={styles.predOutcomeRow}>
                    <Ionicons name={name} size={15} color={color} />
                    <Text style={[styles.predOutcome, { color }]}>{label}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />

      <NeighborhoodSheet
        neighborhood={selectedNeighborhood}
        venues={neighborhoodVenues}
        onClose={() => setSelectedNeighborhood(null)}
      />

      <FirstCallSheet
        visible={showFirstCallSheet}
        onDismiss={() => setShowFirstCallSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060b18' },
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  city: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  liveGamePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' },
  liveGameText: { color: '#10b981', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  time: { color: '#4a5568', fontSize: 14, marginTop: 2 },

  callsPill: { backgroundColor: '#0d1628', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e3a5f' },
  callsNumber: { color: '#00d4ff', fontSize: 22, fontWeight: '900' },
  callsLabel: { color: '#4a5568', fontSize: 10, marginTop: 1, letterSpacing: 0.5 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: '#e2e8f0', fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { color: '#4a5568', fontSize: 16, fontWeight: '700' },
  emptyBody: { color: '#2d3748', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },

  venueCard: {
    backgroundColor: '#0d1628', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#1e3a5f',
    borderLeftWidth: 3,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rankBadge: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 3 },
  venueName: { color: '#e2e8f0', fontSize: 16, fontWeight: '700' },
  venueMeta: { color: '#4a5568', fontSize: 12 },
  hoodRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  hoodDot: { width: 5, height: 5, borderRadius: 3 },
  hoodLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  hoodSep: { color: '#2d3748', fontSize: 11 },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  pingCount: { fontSize: 12, fontWeight: '600' },
  pingDot: { color: '#2d3748', fontSize: 12 },
  callerCountText: { color: '#4a5568', fontSize: 12 },

  cardRight: { marginLeft: 12 },
  callBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  callBtnDisabled: { backgroundColor: '#0d1628', borderWidth: 1, borderColor: '#1e3a5f' },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  calledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 },
  calledText: { color: '#10b981', fontWeight: '700', fontSize: 13 },

  predictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#0d1628' },
  predInfo: { flex: 1 },
  predVenue: { color: '#e2e8f0', fontSize: 15, fontWeight: '600' },
  predPoints: { color: '#10b981', fontSize: 12, marginTop: 2 },
  predOutcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  predOutcome: { fontSize: 13, fontWeight: '600' },
});
