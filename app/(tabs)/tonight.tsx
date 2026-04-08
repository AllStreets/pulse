import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { useTonightFeed } from '@/hooks/useTonightFeed';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';
import { useSportsTonight } from '@/hooks/useSportsTonight';
import { useEventsTonight } from '@/hooks/useEventsTonight';
import { useNeighborhoods } from '@/hooks/useNeighborhoods';
import { useHeatmap } from '@/hooks/useHeatmap';
import { VenueSheet } from '@/components/venue/VenueSheet';
import { NeighborhoodSheet } from '@/components/map/NeighborhoodSheet';
import { GameBanner } from '@/components/tonight/GameBanner';
import { SceneSection } from '@/components/tonight/SceneSection';
import { EventsList } from '@/components/tonight/EventsList';
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
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
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
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodMeta | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedNeighborhood(null);
        setSelectedVenue(null);
      };
    }, [])
  );

  const neighborhoodVenues = selectedNeighborhood
    ? venues.filter(v => v.neighborhood_id === selectedNeighborhood.id)
    : [];

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  async function handleCall(venue: Venue) {
    await makeCall('venue', venue.id, venue.current_heat_score);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const liveGames = games.filter(g => g.status === 'in');

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
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

        {loading ? (
          <VenueCardSkeleton />
        ) : hotVenues.length === 0 ? (
          <Text style={styles.empty}>No live activity yet — check back later tonight</Text>
        ) : (
          hotVenues.map((item) => {
            const called = hasCalledTarget(item.venue.id);
            const color = heatColor(item.rank, hotVenues.length);
            return (
              <TouchableOpacity
                key={item.venue.id}
                style={styles.venueCard}
                onPress={() => setSelectedVenue(item.venue)}
                activeOpacity={0.75}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.rankBadge, { backgroundColor: color + '22', borderColor: color }]}>
                    <Text style={[styles.rankText, { color }]}>#{item.rank}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.venueName}>{item.venue.name}</Text>
                    <Text style={styles.venueMeta}>
                      {item.venue.category}{item.venue.music_genre ? ` · ${item.venue.music_genre}` : ''}{item.venue.age_policy ? ` · ${item.venue.age_policy}` : ''}
                    </Text>
                    <View style={styles.pingRow}>
                      <Ionicons name="radio-button-on" size={10} color={color} />
                      <Text style={[styles.pingCount, { color }]}>{item.pingCount} live signal{item.pingCount !== 1 ? 's' : ''}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  city: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  liveGamePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0d1f0d', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: '#4CAF5040' },
  liveGameText: { color: '#4CAF50', fontSize: 10, fontWeight: '600' },
  time: { color: '#555', fontSize: 14, marginTop: 2 },

  callsPill: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  callsNumber: { color: '#3B82F6', fontSize: 22, fontWeight: '900' },
  callsLabel: { color: '#555', fontSize: 10, marginTop: 1 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  empty: { color: '#444', fontSize: 14, fontStyle: 'italic', marginTop: 8 },

  venueCard: {
    backgroundColor: '#111', borderRadius: 14, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#1a1a1a',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rankBadge: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 3 },
  venueName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  venueMeta: { color: '#555', fontSize: 12 },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pingCount: { fontSize: 12, fontWeight: '600' },

  cardRight: { marginLeft: 12 },
  callBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  callBtnDisabled: { backgroundColor: '#1a1a1a' },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  calledBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 4 },
  calledText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },

  predictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#151515' },
  predInfo: { flex: 1 },
  predVenue: { color: '#ddd', fontSize: 15, fontWeight: '600' },
  predPoints: { color: '#4CAF50', fontSize: 12, marginTop: 2 },
  predOutcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  predOutcome: { fontSize: 13, fontWeight: '600' },
});
