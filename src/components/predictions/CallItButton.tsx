import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { usePredictions } from '@/hooks/usePredictions';
import { useUserStore } from '@/stores/userStore';

interface Props {
  targetId: string;
  currentHeat: number;
}

export function CallItButton({ targetId, currentHeat }: Props) {
  const profile = useUserStore((s) => s.profile);
  const { canCall, makeCall, hasCalledTarget } = usePredictions(profile?.id ?? null);

  const alreadyCalled = hasCalledTarget(targetId);

  async function handlePress() {
    if (alreadyCalled) return;
    const { error } = await makeCall('venue', targetId, currentHeat);
    if (error) Alert.alert('Could not make call', error);
  }

  if (alreadyCalled) {
    return (
      <TouchableOpacity style={[styles.button, styles.called]} disabled>
        <Text style={styles.calledText}>Called ✓</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, !canCall && styles.disabled]}
      onPress={handlePress}
      disabled={!canCall}
    >
      <Text style={styles.text}>{canCall ? 'Call It' : 'No calls left'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: '#FF6B35', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  disabled: { backgroundColor: '#2a2a2a' },
  called: { backgroundColor: '#1a3a1a' },
  text: { color: '#fff', fontWeight: '700', fontSize: 15 },
  calledText: { color: '#4CAF50', fontWeight: '700', fontSize: 15 },
});
