import { useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';
import type { Venue } from '@/types';

interface Props {
  neighborhood: NeighborhoodMeta | null;
  venues: Venue[];
  onClose: () => void;
}

function heatColor(score: number): string {
  if (score >= 80) return '#FF2D55';
  if (score >= 60) return '#FF6D00';
  if (score >= 30) return '#FFE500';
  return '#444';
}

function heatLabel(score: number): string {
  if (score >= 80) return 'Packed';
  if (score >= 60) return 'Buzzing';
  if (score >= 30) return 'Warming up';
  return 'Quiet';
}

export function NeighborhoodSheet({ neighborhood, venues, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  // Leave ~21% at top for the Chicago/calls header
  const snapPoints = useMemo(() => [Math.round(height * 0.79)], [height]);

  useEffect(() => {
    if (neighborhood) sheetRef.current?.snapToIndex(0);
    else sheetRef.current?.close();
  }, [neighborhood]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const color = neighborhood?.map_color ?? '#888';
  const sorted = neighborhood
    ? [...venues].sort((a, b) => b.current_heat_score - a.current_heat_score)
    : [];

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {neighborhood && (
          <>
            {/* Color bar + name */}
            <View style={[styles.headerRow, { borderLeftColor: color }]}>
              <View style={styles.headerText}>
                <Text style={styles.name}>{neighborhood.name}</Text>
                {neighborhood.best_for && (
                  <Text style={styles.bestFor}>Best for {neighborhood.best_for}</Text>
                )}
              </View>
              {neighborhood.ping_count > 0 && (
                <View style={[styles.pingBadge, { borderColor: color + '60', backgroundColor: color + '18' }]}>
                  <Text style={[styles.pingCount, { color }]}>{neighborhood.ping_count}</Text>
                  <Text style={styles.pingLabel}>active</Text>
                </View>
              )}
            </View>

            {/* Description */}
            {neighborhood.scene_description && (
              <Text style={styles.description}>{neighborhood.scene_description}</Text>
            )}

            {/* Vibe tags */}
            {neighborhood.vibe_tags.length > 0 && (
              <View style={styles.tags}>
                {neighborhood.vibe_tags.map(tag => (
                  <View key={tag} style={[styles.tag, { borderColor: color + '50', backgroundColor: color + '15' }]}>
                    <Text style={[styles.tagText, { color }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* Venues */}
            <Text style={styles.sectionTitle}>
              {sorted.length > 0 ? `${sorted.length} spots tonight` : 'No spots on record'}
            </Text>

            {sorted.map(v => {
              const score = v.current_heat_score;
              const accent = heatColor(score);
              return (
                <View key={v.id} style={styles.venueRow}>
                  <View style={styles.venueInfo}>
                    <Text style={styles.venueName}>{v.name}</Text>
                    <Text style={styles.venueMeta}>{v.category}{v.music_genre ? ` · ${v.music_genre}` : ''}</Text>
                  </View>
                  <View style={styles.heatRight}>
                    <Text style={[styles.heatScore, { color: accent }]}>{Math.round(score)}</Text>
                    <Text style={[styles.heatLabel, { color: accent + 'AA' }]}>{heatLabel(score)}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#2a2a2a', width: 36 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, gap: 16 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingLeft: 14,
    gap: 12,
  },
  headerText: { flex: 1 },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  bestFor: { color: '#666', fontSize: 13, marginTop: 3 },

  pingBadge: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pingCount: { fontSize: 20, fontWeight: '800' },
  pingLabel: { color: '#555', fontSize: 10, marginTop: 1 },

  description: { color: '#aaa', fontSize: 14, lineHeight: 21 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#1e1e1e' },

  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },

  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  venueInfo: { flex: 1 },
  venueName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  venueMeta: { color: '#555', fontSize: 12, marginTop: 2 },

  heatRight: { alignItems: 'flex-end' },
  heatScore: { fontSize: 18, fontWeight: '800' },
  heatLabel: { fontSize: 10, marginTop: 1 },
});
