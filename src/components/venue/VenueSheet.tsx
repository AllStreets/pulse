import { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useVenue } from '@/hooks/useVenue';
import { HeatChart } from './HeatChart';
import { PingButton } from './PingButton';
import { VibeTags } from './VibeTags';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';
import { isOpenNow, openUntilString } from '@/lib/hours';
import type { Venue } from '@/types';

interface Props {
  venue: Venue | null;
  onClose: () => void;
}

export function VenueSheet({ venue, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { tonightTimeline, predictionCount, vibeTags } = useVenue(venue?.id ?? null);
  const profile = useUserStore((s) => s.profile);
  const { callsRemaining, canCall, makeCall, hasCalledTarget } = usePredictions(profile?.id ?? null);

  useEffect(() => {
    if (venue) sheetRef.current?.expand();
    else sheetRef.current?.close();
  }, [venue]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  const alreadyCalled = venue ? hasCalledTarget(venue.id) : false;

  async function handleCall() {
    if (alreadyCalled || !canCall) return;
    await makeCall('venue', venue!.id, venue!.current_heat_score);
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['52%', '88%']}
      enablePanDownToClose
      onChange={handleSheetChange}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {venue && (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{venue.name}</Text>
                <View style={styles.chips}>
                  {venue.category && <View style={styles.chip}><Text style={styles.chipText}>{venue.category}</Text></View>}
                  {venue.music_genre && <View style={styles.chip}><Text style={styles.chipText}>{venue.music_genre}</Text></View>}
                  {venue.age_policy && <View style={[styles.chip, styles.chipAlt]}><Text style={styles.chipAltText}>{venue.age_policy}</Text></View>}
                  {venue.cover && <View style={[styles.chip, styles.chipAlt]}><Text style={styles.chipAltText}>{venue.cover} cover</Text></View>}
                </View>
              </View>
            </View>

            {(() => {
              const open = isOpenNow(venue.hours);
              const until = openUntilString(venue.hours);
              if (open === null) return null;
              return (
                <View style={styles.openRow}>
                  <View style={[styles.openDot, { backgroundColor: open ? '#4CAF50' : '#f44336' }]} />
                  <Text style={[styles.openText, { color: open ? '#4CAF50' : '#f44336' }]}>
                    {open ? `Open · until ${until}` : 'Closed now'}
                  </Text>
                </View>
              );
            })()}

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{predictionCount}</Text>
                <Text style={styles.statLabel}>calls tonight</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{callsRemaining}</Text>
                <Text style={styles.statLabel}>calls left</Text>
              </View>
            </View>

            {/* Call It button */}
            <TouchableOpacity
              style={[
                styles.callBtn,
                alreadyCalled && styles.callBtnCalled,
                !canCall && !alreadyCalled && styles.callBtnDisabled,
              ]}
              onPress={handleCall}
              disabled={alreadyCalled || !canCall}
              activeOpacity={0.8}
            >
              {alreadyCalled ? (
                <View style={styles.callBtnInner}>
                  <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                  <Text style={[styles.callBtnText, { color: '#4CAF50' }]}>Called</Text>
                </View>
              ) : (
                <Text style={styles.callBtnText}>{canCall ? 'Call It' : 'No calls left tonight'}</Text>
              )}
            </TouchableOpacity>

            {/* Ping */}
            <PingButton
              venueId={venue.id}
              neighborhoodId={venue.neighborhood_id}
            />

            {/* Heat chart */}
            <HeatChart points={tonightTimeline} label="Activity tonight" />

            {/* Vibe tags */}
            <VibeTags tags={vibeTags} />
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#2a2a2a', width: 36 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 10 },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#1e1e1e', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#2a2a2a' },
  chipText: { color: '#aaa', fontSize: 12 },
  chipAlt: { borderColor: '#3B82F6' + '40', backgroundColor: '#3B82F6' + '15' },
  chipAltText: { color: '#3B82F6', fontSize: 12 },

  statsRow: { flexDirection: 'row', backgroundColor: '#161616', borderRadius: 14, borderWidth: 1, borderColor: '#1e1e1e', overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statDivider: { width: 1, backgroundColor: '#1e1e1e' },
  statValue: { color: '#fff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 2 },

  callBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  callBtnCalled: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#4CAF50' + '50' },
  callBtnDisabled: { backgroundColor: '#1a1a1a' },
  callBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '600' },
});
