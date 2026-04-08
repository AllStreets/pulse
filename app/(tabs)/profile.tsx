import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { usePredictions } from '@/hooks/usePredictions';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';
import { useLeaderboard } from '@/hooks/useLeaderboard';

const BADGE_COLORS: Record<string, string> = {
  casual: '#555',
  regular: '#4A90D9',
  local: '#3B82F6',
  legend: '#FFD700',
};

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const { predictions, callsRemaining } = usePredictions(profile?.id ?? null);
  const [pingCount, setPingCount] = useState<number | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const { top10, userPercentile, lastNight } = useLeaderboard(
    profile?.id ?? null,
    profile?.heat_score ?? 0
  );

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from('location_pings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .then(({ count }) => setPingCount(count ?? 0));

    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotifEnabled(status === 'granted');
    });
  }, [profile?.id]);

  if (!profile) return null;

  const scored = predictions.filter((p) => p.outcome !== 'pending' && p.outcome !== 'voided');
  const correct = scored.filter((p) => p.outcome === 'correct').length;
  const accuracy = scored.length > 0 ? Math.round((correct / scored.length) * 100) : null;
  const initials = profile.username.slice(0, 2).toUpperCase();
  const badgeColor = BADGE_COLORS[profile.credibility_badge] ?? '#555';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: badgeColor + '33', borderColor: badgeColor }]}>
          <Text style={[styles.avatarText, { color: badgeColor }]}>{initials}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.username}>@{profile.username}</Text>
          <View style={[styles.badge, { backgroundColor: badgeColor + '22', borderColor: badgeColor + '80' }]}>
            <Text style={[styles.badgeText, { color: badgeColor }]}>{profile.credibility_badge}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{Math.round(profile.heat_score)}</Text>
          <Text style={styles.statLabel}>Heat Score</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pingCount ?? '—'}</Text>
          <Text style={styles.statLabel}>Pings Sent</Text>
        </View>
      </View>

      {userPercentile !== null && (
        <View style={styles.percentileRow}>
          <Text style={styles.percentileText}>
            You're in the top <Text style={styles.percentileHighlight}>{100 - userPercentile}%</Text> of callers
          </Text>
        </View>
      )}

      {/* Tonight accuracy */}
      {accuracy !== null && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tonight</Text>
          <Text style={styles.accuracy}>{accuracy}% accuracy</Text>
          <Text style={styles.accuracySub}>{correct} correct / {scored.length} scored</Text>
        </View>
      )}

      {/* Calls remaining */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calls</Text>
        <Text style={styles.callsLeft}>{callsRemaining} calls remaining tonight</Text>
      </View>

      {/* Last night's results */}
      {lastNight && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Night</Text>
          <View style={styles.nightSummary}>
            <Text style={styles.nightScore}>
              {lastNight.correct}/{lastNight.total} correct
              {lastNight.pointsEarned > 0 ? ` · +${lastNight.pointsEarned} pts` : ''}
            </Text>
            {lastNight.venueNames.length > 0 && (
              <Text style={styles.nightVenues}>Called: {lastNight.venueNames.join(', ')}</Text>
            )}
          </View>
        </View>
      )}

      {/* Leaderboard */}
      {top10.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Callers</Text>
          {top10.map((entry, i) => (
            <View key={entry.id} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>#{i + 1}</Text>
              <Text style={[styles.leaderName, entry.id === profile.id && styles.leaderNameSelf]}>
                @{entry.username}
              </Text>
              <Text style={styles.leaderScore}>{Math.round(entry.heat_score)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Notification toggle */}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Hot venue alerts</Text>
        <Switch
          value={notifEnabled}
          onValueChange={() => {}}
          disabled
          trackColor={{ true: '#3B82F6' }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity style={styles.signOut} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800' },
  headerInfo: { flex: 1, gap: 6 },
  username: { color: '#fff', fontSize: 24, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  stats: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 16, borderWidth: 1, borderColor: '#1a1a1a', overflow: 'hidden', marginBottom: 28 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue: { color: '#3B82F6', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#555', fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#1a1a1a' },

  percentileRow: { backgroundColor: '#111', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1a1a1a' },
  percentileText: { color: '#666', fontSize: 13 },
  percentileHighlight: { color: '#3B82F6', fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionTitle: { color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  accuracy: { color: '#fff', fontSize: 20, fontWeight: '700' },
  accuracySub: { color: '#555', fontSize: 13, marginTop: 2 },
  callsLeft: { color: '#fff', fontSize: 16, fontWeight: '600' },

  nightSummary: { gap: 4 },
  nightScore: { color: '#fff', fontSize: 18, fontWeight: '700' },
  nightVenues: { color: '#555', fontSize: 13, marginTop: 2 },

  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#151515' },
  leaderRank: { color: '#444', fontSize: 13, fontWeight: '700', width: 28 },
  leaderName: { flex: 1, color: '#ccc', fontSize: 14 },
  leaderNameSelf: { color: '#3B82F6' },
  leaderScore: { color: '#555', fontSize: 13 },

  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  rowLabel: { color: '#aaa', fontSize: 15 },

  signOut: { marginTop: 40, paddingVertical: 14, alignItems: 'center' },
  signOutText: { color: '#333', fontSize: 14 },
});
