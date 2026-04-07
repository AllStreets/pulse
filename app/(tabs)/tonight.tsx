import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTonightFeed } from '@/hooks/useTonightFeed';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';
import { VenueSheet } from '@/components/venue/VenueSheet';
import type { Venue } from '@/types';

const HEAT_COLORS = ['#FFD700', '#FFA500', '#FF6B00', '#FF2200', '#CC0000'];

function heatColor(rank: number, total: number): string {
  const idx = Math.min(HEAT_COLORS.length - 1, Math.floor((rank / total) * HEAT_COLORS.length));
  return HEAT_COLORS[idx];
}

function outcomeLabel(outcome: string): { text: string; color: string } {
  switch (outcome) {
    case 'correct':   return { text: '✓ Correct', color: '#4CAF50' };
    case 'incorrect': return { text: '✗ Missed', color: '#f44' };
    case 'voided':    return { text: '— Voided', color: '#555' };
    default:          return { text: '⏳ Pending', color: '#888' };
  }
}

export default function TonightScreen() {
  const profile = useUserStore((s) => s.profile);
  const { hotVenues, myPredictions, loading, refresh } = useTonightFeed(profile?.id ?? null);
  const { callsRemaining, hasCalledTarget, makeCall, canCall } = usePredictions(profile?.id ?? null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
            <Text style={styles.city}>Chicago</Text>
            <Text style={styles.time}>{timeStr}</Text>
          </View>
          <View style={styles.callsPill}>
            <Text style={styles.callsNumber}>{callsRemaining}</Text>
            <Text style={styles.callsLabel}>calls left</Text>
          </View>
        </View>

        {/* Hot Right Now */}
        <Text style={styles.sectionTitle}>🔥 Hot Right Now</Text>

        {loading ? (
          <ActivityIndicator color="#FF6B00" style={{ marginTop: 24 }} />
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
                      <View style={[styles.pingDot, { backgroundColor: color }]} />
                      <Text style={[styles.pingCount, { color }]}>{item.pingCount} live signal{item.pingCount !== 1 ? 's' : ''}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardRight}>
                  {called ? (
                    <View style={styles.calledBadge}>
                      <Text style={styles.calledText}>Called ✓</Text>
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

        {/* Your Calls Tonight */}
        {myPredictions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Your Calls Tonight</Text>
            {myPredictions.map((p) => {
              const { text, color } = outcomeLabel(p.outcome);
              return (
                <View key={p.id} style={styles.predictionRow}>
                  <View style={styles.predInfo}>
                    <Text style={styles.predVenue}>{p.venueName}</Text>
                    {p.points_awarded != null && p.points_awarded > 0 && (
                      <Text style={styles.predPoints}>+{p.points_awarded} pts</Text>
                    )}
                  </View>
                  <Text style={[styles.predOutcome, { color }]}>{text}</Text>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {selectedVenue && (
        <VenueSheet venue={selectedVenue} onClose={() => setSelectedVenue(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { flex: 1 },
  content: { paddingTop: 60, paddingHorizontal: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  city: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  time: { color: '#555', fontSize: 14, marginTop: 2 },

  callsPill: { backgroundColor: '#111', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  callsNumber: { color: '#3B82F6', fontSize: 22, fontWeight: '900' },
  callsLabel: { color: '#555', fontSize: 10, marginTop: 1 },

  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14, letterSpacing: -0.2 },
  empty: { color: '#444', fontSize: 14, fontStyle: 'italic', marginTop: 8 },

  venueCard: {
    backgroundColor: '#111',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  rankBadge: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 13, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 3 },
  venueName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  venueMeta: { color: '#555', fontSize: 12 },
  pingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  pingDot: { width: 6, height: 6, borderRadius: 3 },
  pingCount: { fontSize: 12, fontWeight: '600' },

  cardRight: { marginLeft: 12 },
  callBtn: { backgroundColor: '#3B82F6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  callBtnDisabled: { backgroundColor: '#1a1a1a' },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  calledBadge: { paddingVertical: 8, paddingHorizontal: 12 },
  calledText: { color: '#4CAF50', fontWeight: '700', fontSize: 13 },

  predictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#151515' },
  predInfo: { flex: 1 },
  predVenue: { color: '#ddd', fontSize: 15, fontWeight: '600' },
  predPoints: { color: '#4CAF50', fontSize: 12, marginTop: 2 },
  predOutcome: { fontSize: 13, fontWeight: '600' },
});
