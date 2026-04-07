import { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { useVenue } from '@/hooks/useVenue';
import { HeatChart } from './HeatChart';
import { VibeTags } from './VibeTags';
import type { Venue } from '@/types';

interface Props {
  venue: Venue | null;
  onClose: () => void;
}

export function VenueSheet({ venue, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { tonightTimeline, historyForNow, predictionCount, vibeTags } = useVenue(venue?.id ?? null);

  useEffect(() => {
    if (venue) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [venue]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  if (!venue) return null;

  const heatVsAvg = historyForNow && historyForNow.avg_heat > 0
    ? `${Math.round((venue.current_heat_score / historyForNow.avg_heat) * 100)}% of avg`
    : null;

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['50%', '85%']}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.name}>{venue.name}</Text>
        <View style={styles.meta}>
          {venue.music_genre && <Text style={styles.metaText}>{venue.music_genre}</Text>}
          {venue.age_policy && <Text style={styles.metaText}>{venue.age_policy}</Text>}
          {venue.cover && <Text style={styles.metaText}>Cover: {venue.cover}</Text>}
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{predictionCount}</Text>
            <Text style={styles.statLabel}>calls tonight</Text>
          </View>
          {heatVsAvg && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{heatVsAvg}</Text>
              <Text style={styles.statLabel}>vs usual</Text>
            </View>
          )}
        </View>
        <HeatChart points={tonightTimeline} label="Heat tonight" />
        <VibeTags tags={vibeTags} />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#333' },
  content: { padding: 20, gap: 16 },
  name: { color: '#fff', fontSize: 24, fontWeight: '800' },
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaText: { color: '#888', fontSize: 13 },
  stats: { flexDirection: 'row', gap: 24 },
  stat: { alignItems: 'center' },
  statValue: { color: '#FF6B35', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 12 },
});
