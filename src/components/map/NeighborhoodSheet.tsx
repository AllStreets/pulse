import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { heatColor } from '@/lib/heatColor';
import { useNeighborhoodActivity } from '@/hooks/useNeighborhoodActivity';
import { HeatChart } from '@/components/venue/HeatChart';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';
import type { Venue } from '@/types';

type Tab = 'scene' | 'venues' | 'activity';

interface Props {
  neighborhood: NeighborhoodMeta | null;
  venues: Venue[];
  onClose: () => void;
  onVenueTap?: (venue: Venue) => void;
  neighborhoodRank?: number;
}

export function NeighborhoodSheet({ neighborhood, venues, onClose, onVenueTap, neighborhoodRank }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [Math.round(height * 0.79)], [height]);
  const [activeTab, setActiveTab] = useState<Tab>('scene');

  const { timeline, pingCount, updatedAt } = useNeighborhoodActivity(neighborhood?.id ?? null);

  useEffect(() => {
    if (neighborhood) {
      setActiveTab('scene');
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [neighborhood]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const color = neighborhood?.map_color ?? '#888';
  const sorted = useMemo(
    () => neighborhood
      ? [...venues].sort((a, b) => b.current_heat_score - a.current_heat_score)
      : [],
    [venues, neighborhood]
  );

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
      {neighborhood && (
        <>
          {/* Persistent header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <Text style={styles.name}>{neighborhood.name}</Text>
              {neighborhoodRank != null && (
                <View style={[styles.rankBadge, { borderColor: color + '80', backgroundColor: color + '18' }]}>
                  <Text style={[styles.rankText, { color }]}>#{neighborhoodRank} HOT</Text>
                </View>
              )}
            </View>
            <Text style={styles.headerMeta}>
              {sorted.length} bars · {pingCount} pings tonight
            </Text>

            {/* Tab bar */}
            <View style={styles.tabBar}>
              {(['scene', 'venues', 'activity'] as Tab[]).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && { borderBottomColor: color }]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, activeTab === tab && { color }]}>
                    {tab.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tab content */}
          <BottomSheetScrollView contentContainerStyle={styles.content}>
            {activeTab === 'scene' && (
              <>
                {neighborhood.scene_description && (
                  <Text style={styles.description}>{neighborhood.scene_description}</Text>
                )}
                {neighborhood.best_for && (
                  <View>
                    <Text style={styles.sectionLabel}>BEST FOR</Text>
                    <Text style={styles.bestForText}>{neighborhood.best_for}</Text>
                  </View>
                )}
                {neighborhood.vibe_tags.length > 0 && (
                  <View style={styles.tags}>
                    {neighborhood.vibe_tags.map(tag => (
                      <View key={tag} style={[styles.tag, { borderColor: color + '50', backgroundColor: color + '15' }]}>
                        <Text style={[styles.tagText, { color }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {activeTab === 'venues' && (
              <>
                {sorted.length === 0 ? (
                  <Text style={styles.emptyText}>No spots on record</Text>
                ) : (
                  sorted.map(v => {
                    const vColor = heatColor(v.current_heat_score);
                    return (
                      <TouchableOpacity
                        key={v.id}
                        style={styles.venueRow}
                        onPress={() => onVenueTap?.(v)}
                        activeOpacity={onVenueTap ? 0.7 : 1}
                      >
                        <View style={styles.venueInfo}>
                          <Text style={styles.venueName}>{v.name}</Text>
                          <Text style={styles.venueMeta}>
                            {v.category}{v.music_genre ? ` · ${v.music_genre}` : ''}
                          </Text>
                        </View>
                        <View style={styles.heatRight}>
                          <Text style={[styles.heatScore, { color: vColor }]}>
                            {Math.round(v.current_heat_score)}
                          </Text>
                          <Text style={[styles.heatLabelSmall, { color: vColor + 'AA' }]}>
                            heat
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </>
            )}

            {activeTab === 'activity' && (
              <>
                <HeatChart points={timeline} label="Pings tonight" />
                <View style={styles.activityStats}>
                  <View style={styles.activityStat}>
                    <Text style={styles.activityStatValue}>{pingCount}</Text>
                    <Text style={styles.activityStatLabel}>total pings tonight</Text>
                  </View>
                </View>
                {updatedAt && (
                  <Text style={styles.updatedAt}>
                    Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </>
            )}
          </BottomSheetScrollView>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#2a2a2a', width: 36 },

  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  rankBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  rankText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headerMeta: { color: '#555', fontSize: 13, marginBottom: 14 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e1e1e' },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { color: '#555', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 16 },

  description: { color: '#aaa', fontSize: 14, lineHeight: 21 },
  sectionLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  bestForText: { color: '#e2e8f0', fontSize: 14, lineHeight: 20 },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 12, fontWeight: '500' },

  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', marginTop: 20 },

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
  heatLabelSmall: { fontSize: 10, marginTop: 1 },

  activityStats: { flexDirection: 'row', gap: 12 },
  activityStat: { flex: 1, backgroundColor: '#0d1628', borderRadius: 12, borderWidth: 1, borderColor: '#1e3a5f', padding: 14, alignItems: 'center' },
  activityStatValue: { color: '#00d4ff', fontSize: 24, fontWeight: '800' },
  activityStatLabel: { color: '#4a5568', fontSize: 11, marginTop: 2 },

  updatedAt: { color: '#333', fontSize: 11, textAlign: 'right' },
});
