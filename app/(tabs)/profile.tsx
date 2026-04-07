import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { usePredictions } from '@/hooks/usePredictions';

const BADGE_COLORS: Record<string, string> = {
  casual: '#555',
  regular: '#4A90D9',
  local: '#FF6B35',
  legend: '#FFD700',
};

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const callsUsedTonight = useUserStore((s) => s.callsUsedTonight);
  const { predictions, callsRemaining } = usePredictions(profile?.id ?? null);

  if (!profile) return null;

  const scored = predictions.filter((p) => p.outcome !== 'pending' && p.outcome !== 'voided');
  const correct = scored.filter((p) => p.outcome === 'correct').length;
  const accuracy = scored.length > 0 ? Math.round((correct / scored.length) * 100) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.username}>@{profile.username}</Text>
        <View style={[styles.badge, { backgroundColor: BADGE_COLORS[profile.credibility_badge] ?? '#555' }]}>
          <Text style={styles.badgeText}>{profile.credibility_badge}</Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(profile.heat_score)}</Text>
          <Text style={styles.statLabel}>Heat Score</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.streak}</Text>
          <Text style={styles.statLabel}>Day streak</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{callsRemaining}</Text>
          <Text style={styles.statLabel}>Calls left</Text>
        </View>
      </View>

      {accuracy !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tonight</Text>
          <Text style={styles.accuracy}>{accuracy}% accuracy ({correct}/{scored.length})</Text>
        </View>
      )}

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  username: { color: '#fff', fontSize: 28, fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#111', borderRadius: 16, padding: 20, marginBottom: 24 },
  stat: { alignItems: 'center' },
  statValue: { color: '#FF6B35', fontSize: 28, fontWeight: '900' },
  statLabel: { color: '#666', fontSize: 12, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  accuracy: { color: '#fff', fontSize: 18, fontWeight: '700' },
  signOut: { marginTop: 40 },
  signOutText: { color: '#555', textAlign: 'center', fontSize: 14 },
});
