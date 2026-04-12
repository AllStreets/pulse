import { useRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions,
} from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/userStore';
import { HeatChart } from '@/components/venue/HeatChart';
import { useStadiumActivity } from '@/hooks/useStadiumActivity';
import type { StadiumTeamEntry } from '@/data/stadiums';

interface Props {
  entry: StadiumTeamEntry | null;
  onClose: () => void;
}

const COOLDOWN_MS = 60 * 60 * 1000;

function pingKey(stadiumId: string) {
  return `stadium_ping_cooldown_${stadiumId}`;
}

export function StadiumSheet({ entry, onClose }: Props) {
  const sheetRef = useRef<BottomSheet>(null);
  const { height } = useWindowDimensions();
  const snapPoints = useMemo(() => [Math.round(height * 0.62)], [height]);
  const profile = useUserStore(s => s.profile);

  const { timeline, pingCount, updatedAt } = useStadiumActivity(
    entry?.stadiumId ?? null
  );

  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [pinging, setPinging] = useState(false);

  useEffect(() => {
    if (!entry) {
      sheetRef.current?.close();
      return;
    }
    sheetRef.current?.snapToIndex(0);

    AsyncStorage.getItem(pingKey(entry.stadiumId)).then(stored => {
      if (!stored) { setCooldownLeft(0); return; }
      const remaining = COOLDOWN_MS - (Date.now() - parseInt(stored, 10));
      setCooldownLeft(remaining > 0 ? remaining : 0);
    });
  }, [entry?.stadiumId]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft(prev => {
        const next = prev - 10_000;
        return next <= 0 ? 0 : next;
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) onClose();
  }, [onClose]);

  async function handleImHere() {
    if (!entry || cooldownLeft > 0 || pinging) return;
    setPinging(true);
    try {
      await supabase.from('stadium_pings').insert({
        stadium_id: entry.stadiumId,
        user_id: profile?.id ?? null,
      });
      await AsyncStorage.setItem(pingKey(entry.stadiumId), String(Date.now()));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCooldownLeft(COOLDOWN_MS);
    } catch {
      // silent fail — ping is best-effort
    } finally {
      setPinging(false);
    }
  }

  const onCooldown = cooldownLeft > 0;
  const minsLeft = Math.ceil(cooldownLeft / 60_000);
  const color = entry?.team.primaryColor ?? '#00d4ff';
  const border = entry?.team.secondaryColor ?? '#1e3a5f';

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
      {entry && (
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.teamBadge, { backgroundColor: color + '22', borderColor: color + '80' }]}>
              <Text style={[styles.teamAbbrev, { color }]}>{entry.team.abbrev}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.teamName}>{entry.team.name}</Text>
              <Text style={styles.stadiumName}>{entry.stadiumName}</Text>
              <View style={styles.chips}>
                <View style={[styles.chip, { borderColor: color + '50', backgroundColor: color + '15' }]}>
                  <Text style={[styles.chipText, { color }]}>{entry.team.sport}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Ping activity chart */}
          <HeatChart points={timeline} label="Pings tonight" />

          {/* Ping count card */}
          <View style={styles.countCard}>
            <Text style={styles.countValue}>{pingCount}</Text>
            <Text style={styles.countLabel}>total pings tonight</Text>
          </View>

          {updatedAt && (
            <Text style={styles.updatedAt}>
              Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}

          {/* I'm Here button */}
          <TouchableOpacity
            style={[
              styles.imHereBtn,
              { borderColor: onCooldown ? '#4CAF5050' : color },
              onCooldown && styles.imHereBtnCooldown,
            ]}
            onPress={handleImHere}
            disabled={onCooldown || pinging}
            activeOpacity={0.75}
          >
            <View style={styles.imHereInner}>
              <Ionicons
                name={onCooldown ? 'checkmark-circle' : 'radio-button-on'}
                size={16}
                color={onCooldown ? '#4CAF50' : '#fff'}
              />
              <Text style={[styles.imHereText, onCooldown && styles.imHereTextCooldown]}>
                {pinging ? 'Sending...' : onCooldown ? `Pinged · ${minsLeft}m` : "I'm Here"}
              </Text>
            </View>
          </TouchableOpacity>
        </BottomSheetScrollView>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: '#111' },
  handle: { backgroundColor: '#2a2a2a', width: 36 },

  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 16 },

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  teamBadge: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  teamAbbrev: { fontSize: 13, fontWeight: '900', letterSpacing: -0.5 },
  headerText: { flex: 1, gap: 3 },
  teamName: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  stadiumName: { color: '#555', fontSize: 13 },
  chips: { flexDirection: 'row', gap: 6, marginTop: 4 },
  chip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  chipText: { fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#1e1e1e' },

  countCard: {
    backgroundColor: '#0d1628',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    padding: 14,
    alignItems: 'center',
  },
  countValue: { color: '#00d4ff', fontSize: 26, fontWeight: '800' },
  countLabel: { color: '#4a5568', fontSize: 11, marginTop: 2 },

  updatedAt: { color: '#333', fontSize: 11, textAlign: 'right' },

  imHereBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    alignItems: 'center',
  },
  imHereBtnCooldown: { backgroundColor: '#0d1f0d' },
  imHereInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  imHereText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  imHereTextCooldown: { color: '#4CAF50' },
});
