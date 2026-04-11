import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { heatColor } from '@/lib/heatColor';
import type { Venue } from '@/types';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

interface Props {
  venues: Venue[];
  neighborhoods: NeighborhoodMeta[];
  onVenueTap: (venue: Venue) => void;
  onNeighborhoodTap: (neighborhood: NeighborhoodMeta) => void;
}

export function LiveIntelPanel({ venues, neighborhoods, onVenueTap, onNeighborhoodTap }: Props) {
  // Top 5 venues by current heat score
  const topVenues = [...venues]
    .sort((a, b) => b.current_heat_score - a.current_heat_score)
    .slice(0, 5);

  // Hottest neighborhood is first in the already-sorted neighborhoods array
  const hotNeighborhood = neighborhoods[0] ?? null;

  if (topVenues.length === 0 && !hotNeighborhood) return null;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.label}>Hot Now</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {topVenues.map(v => {
            const color = heatColor(v.current_heat_score);
            return (
              <TouchableOpacity
                key={v.id}
                style={[styles.card, { borderColor: color + '55' }]}
                onPress={() => onVenueTap(v)}
                activeOpacity={0.75}
              >
                <Text style={[styles.cardScore, { color }]}>{Math.round(v.current_heat_score)}</Text>
                <Text style={styles.cardName} numberOfLines={1}>{v.name}</Text>
              </TouchableOpacity>
            );
          })}
          {hotNeighborhood && (
            <TouchableOpacity
              style={[styles.card, { borderColor: hotNeighborhood.map_color + '55' }]}
              onPress={() => onNeighborhoodTap(hotNeighborhood)}
              activeOpacity={0.75}
            >
              <Text style={[styles.cardScore, { color: hotNeighborhood.map_color, fontSize: 13 }]} numberOfLines={1}>
                {hotNeighborhood.name}
              </Text>
              <Text style={styles.cardName}>Top Scene</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,16,28,0.92)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  label: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 0,
  },
  scroll: {
    gap: 8,
    paddingRight: 4,
  },
  card: {
    backgroundColor: '#0d1628',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    minWidth: 72,
  },
  cardScore: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardName: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
});
