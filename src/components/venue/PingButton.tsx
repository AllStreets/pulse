import { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface Props {
  venueId: string;
  neighborhoodId: string;
  onPinged?: () => void;
}

const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function pingKey(venueId: string) {
  return `ping_cooldown_${venueId}`;
}

export function PingButton({ venueId, neighborhoodId, onPinged }: Props) {
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkCooldown() {
      const stored = await AsyncStorage.getItem(pingKey(venueId));
      if (!stored) return;
      const lastPingedAt = parseInt(stored, 10);
      const remaining = COOLDOWN_MS - (Date.now() - lastPingedAt);
      if (remaining > 0) setCooldownLeft(remaining);
    }
    checkCooldown();
  }, [venueId]);

  useEffect(() => {
    if (cooldownLeft <= 0) return;
    const interval = setInterval(() => {
      setCooldownLeft((prev) => {
        const next = prev - 10_000;
        return next <= 0 ? 0 : next;
      });
    }, 10_000);
    return () => clearInterval(interval);
  }, [cooldownLeft]);

  async function handlePing() {
    if (cooldownLeft > 0 || loading) return;
    setLoading(true);
    try {
      await supabase.from('location_pings').insert({
        venue_id: venueId,
        neighborhood_id: neighborhoodId,
      });
      await AsyncStorage.setItem(pingKey(venueId), String(Date.now()));
      setCooldownLeft(COOLDOWN_MS);
      onPinged?.();
    } catch {
      // Silent fail — ping is best-effort
    } finally {
      setLoading(false);
    }
  }

  const onCooldown = cooldownLeft > 0;
  const minsLeft = Math.ceil(cooldownLeft / 60_000);

  return (
    <TouchableOpacity
      style={[styles.btn, onCooldown && styles.btnCooldown]}
      onPress={handlePing}
      disabled={onCooldown || loading}
      activeOpacity={0.75}
    >
      <View style={styles.inner}>
        <Ionicons
          name={onCooldown ? 'checkmark-circle' : 'radio-button-on'}
          size={16}
          color={onCooldown ? '#4CAF50' : '#fff'}
        />
        <Text style={[styles.text, onCooldown && styles.textCooldown]}>
          {loading ? 'Sending...' : onCooldown ? `Pinged · ${minsLeft}m` : "I'm Here"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignItems: 'center',
  },
  btnCooldown: {
    backgroundColor: '#0d1f0d',
    borderColor: '#4CAF5050',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
  textCooldown: { color: '#4CAF50' },
});
