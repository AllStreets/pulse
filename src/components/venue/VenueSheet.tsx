import { useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withSpring } from 'react-native-reanimated';
import { useVenue } from '@/hooks/useVenue';
import { HeatChart } from './HeatChart';
import { PingButton } from './PingButton';
import { VibeTags } from './VibeTags';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';
import { isOpenNow, openUntilString, todayHoursString } from '@/lib/hours';
import { heatColor } from '@/lib/heatColor';
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

  const callScale = useSharedValue(1);
  const callAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: callScale.value }],
  }));

  const alreadyCalled = venue ? hasCalledTarget(venue.id) : false;

  async function handleCall() {
    if (alreadyCalled || !canCall) return;
    callScale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
            {/* Header: name + chips on left, heat badge on right */}
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
              {/* Heat badge */}
              <View style={[styles.heatBadge, { backgroundColor: heatColor(venue.current_heat_score) + '22', borderColor: heatColor(venue.current_heat_score) + '88' }]}>
                <Text style={[styles.heatScore, { color: heatColor(venue.current_heat_score) }]}>
                  {Math.round(venue.current_heat_score)}
                </Text>
                <Text style={[styles.heatLabel, { color: heatColor(venue.current_heat_score) + 'AA' }]}>HEAT</Text>
              </View>
            </View>

            {/* Open/closed row */}
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

            {/* Info rows */}
            <View style={styles.infoSection}>
              {venue.address && (
                <View style={styles.infoRow}>
                  <Ionicons name="location-outline" size={15} color="#4a5568" style={styles.infoIcon} />
                  <Text style={styles.infoText}>{venue.address}</Text>
                </View>
              )}
              {(() => {
                const hrs = todayHoursString(venue.hours);
                if (!hrs) return null;
                return (
                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={15} color="#4a5568" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{hrs}</Text>
                  </View>
                );
              })()}
              {venue.phone && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => Linking.openURL(`tel:${venue.phone}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="call-outline" size={15} color="#4a5568" style={styles.infoIcon} />
                  <Text style={[styles.infoText, styles.infoLink]}>{venue.phone}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Call It button */}
            <Animated.View style={callAnimStyle}>
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
            </Animated.View>

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
  background: { backgroundColor: '#0a1628' },
  handle: { backgroundColor: '#1e3a5f', width: 36 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { flex: 1, gap: 10, marginRight: 12 },
  name: { color: '#e2e8f0', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { backgroundColor: '#0d1e3a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#1e3a5f' },
  chipText: { color: '#94a3b8', fontSize: 12 },
  chipAlt: { borderColor: 'rgba(0,212,255,0.3)', backgroundColor: 'rgba(0,212,255,0.08)' },
  chipAltText: { color: '#00d4ff', fontSize: 12 },

  heatBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 56,
  },
  heatScore: { fontSize: 24, fontWeight: '900' },
  heatLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },

  statsRow: { flexDirection: 'row', backgroundColor: '#0d1628', borderRadius: 14, borderWidth: 1, borderColor: '#1e3a5f', overflow: 'hidden' },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statDivider: { width: 1, backgroundColor: '#1e3a5f' },
  statValue: { color: '#00d4ff', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#4a5568', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },

  infoSection: { gap: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoIcon: { width: 18 },
  infoText: { color: '#94a3b8', fontSize: 13, flex: 1 },
  infoLink: { color: '#00d4ff' },

  callBtn: { backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  callBtnCalled: { backgroundColor: '#0d1628', borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)' },
  callBtnDisabled: { backgroundColor: '#0d1628', borderWidth: 1, borderColor: '#1e3a5f' },
  callBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  openDot: { width: 7, height: 7, borderRadius: 4 },
  openText: { fontSize: 12, fontWeight: '600' },
});
