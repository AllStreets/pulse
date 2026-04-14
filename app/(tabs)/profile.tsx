import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Switch, ActivityIndicator, Alert, Linking } from 'react-native';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useUserStore } from '@/stores/userStore';
import { usePredictions } from '@/hooks/usePredictions';
import { supabase } from '@/lib/supabase';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useFriendships } from '@/hooks/useFriendships';
import { FriendRequestsPanel } from '@/components/friends/FriendRequestsPanel';
import { FriendsListPanel } from '@/components/friends/FriendsListPanel';

const BADGE_COLORS: Record<string, string> = {
  casual: '#555',
  regular: '#4A90D9',
  local: '#CE1141',
  legend: '#FFD700',
};

export default function ProfileScreen() {
  const { signOut, session, loading: authLoading } = useAuth();
  const profile = useUserStore((s) => s.profile);
  const browseMode = useUserStore((s) => s.browseMode);
  const router = useRouter();
  const { predictions, callsRemaining } = usePredictions(profile?.id ?? null);
  const [pingCount, setPingCount] = useState<number | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [showRequests, setShowRequests] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [topVenues, setTopVenues] = useState<{ venueId: string; name: string; count: number }[]>([]);
  const [showAllVenues, setShowAllVenues] = useState(false);
  const [showAllCallers, setShowAllCallers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { friends, pendingIncoming, acceptRequest, declineRequest, removeFriend } = useFriendships(profile?.id ?? null);
  const { top10, userPercentile, lastNight } = useLeaderboard(
    profile?.id ?? null,
    profile?.heat_score ?? 0
  );

  const setProfile = useUserStore((s) => s.setProfile);
  const profileIdRef = useRef<string | undefined>(undefined);
  profileIdRef.current = profile?.id;

  const [refreshKey, setRefreshKey] = useState(0);

  useFocusEffect(useCallback(() => {
    setRefreshKey(k => k + 1);
    setShowAllVenues(false);
    setShowAllCallers(false);
  }, []));

  useEffect(() => {
    const userId = profileIdRef.current;
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const [{ count }, { data: profileData }, { data: pingRows }] = await Promise.all([
        supabase.from('location_pings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('location_pings').select('venue_id').eq('user_id', userId),
      ]);
      if (cancelled) return;
      setPingCount(count ?? 0);
      if (profileData) {
        setProfile(profileData);
        setNotifEnabled(profileData.notifications_enabled);
      }
      if (pingRows?.length) {
        const counts = new Map<string, number>();
        for (const r of pingRows) counts.set(r.venue_id, (counts.get(r.venue_id) ?? 0) + 1);
        const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        if (sorted.length) {
          const { data: venueData } = await supabase.from('venues').select('id, name').in('id', sorted.map(([id]) => id));
          if (cancelled) return;
          const nameMap = new Map((venueData ?? []).map((v: any) => [v.id, v.name]));
          setTopVenues(sorted.map(([venueId, c]) => ({ venueId, name: nameMap.get(venueId) ?? 'Unknown', count: c })));
        } else {
          setTopVenues([]);
        }
      } else {
        setTopVenues([]);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, profile?.id]);

  if (!profile && (authLoading || session)) {
    return (
      <View style={styles.guestContainer}>
        <ActivityIndicator color="#3B82F6" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.guestContainer}>
        <Text style={styles.guestTitle}>Sign up to track your calls</Text>
        <Text style={styles.guestBody}>Create a free account to make predictions, earn points, and see how you rank.</Text>
        <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/(auth)/login?signup=1')}>
          <Text style={styles.guestBtnText}>Sign Up Free</Text>
        </TouchableOpacity>
        {browseMode && (
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 12 }}>
            <Text style={styles.guestLink}>Already have an account? Log in</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  async function handleToggleNotifications(value: boolean) {
    if (!profile?.id) return;
    setNotifEnabled(value); // optimistic update
    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: value })
      .eq('id', profile.id);
    if (error) setNotifEnabled(!value); // revert on failure
  }

  async function handleDeleteAccount() {
    if (!profile?.id) return;
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete My Account',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_own_account');
              if (error) throw error;
              await signOut();
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'Could not delete account. Try again.');
            }
          },
        },
      ]
    );
  }

  const scored = predictions.filter((p) => p.outcome !== 'pending' && p.outcome !== 'voided');
  const correct = scored.filter((p) => p.outcome === 'correct').length;
  const accuracy = scored.length > 0 ? Math.round((correct / scored.length) * 100) : null;
  const initials = profile.username.slice(0, 2).toUpperCase();
  const badgeColor = BADGE_COLORS[profile.credibility_badge] ?? '#555';

  return (
    <View style={styles.root}>
      {/* Top-right icon row */}
      <View style={styles.iconRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowRequests(true)}>
          <Ionicons name="notifications-outline" size={22} color={pendingIncoming.length > 0 ? '#00d4ff' : '#4a5568'} />
          {pendingIncoming.length > 0 && (
            <View style={styles.notifDot}>
              <Text style={styles.notifDotText}>{pendingIncoming.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFriends(true)}>
          <Ionicons name="people-outline" size={22} color="#4a5568" />
        </TouchableOpacity>
      </View>

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

      {/* My Top Venues */}
      {topVenues.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Top Venues</Text>
          {(showAllVenues ? topVenues : topVenues.slice(0, 5)).map((v) => (
            <View key={v.venueId} style={styles.venueRow}>
              <Text style={styles.venueName}>{v.name}</Text>
              <Text style={styles.venueCount}>{v.count}×</Text>
            </View>
          ))}
          {topVenues.length > 5 && !showAllVenues && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllVenues(true)} activeOpacity={0.7}>
              <View style={styles.showMoreInner}>
                <Ionicons name="chevron-down" size={14} color="#4a5568" />
                <Text style={styles.showMoreText}>Show more</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

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
          {(showAllCallers ? top10 : top10.slice(0, 5)).map((entry, i) => (
            <View key={entry.id} style={styles.leaderRow}>
              <Text style={styles.leaderRank}>#{i + 1}</Text>
              <Text style={[styles.leaderName, entry.id === profile.id && styles.leaderNameSelf]}>
                @{entry.username}
              </Text>
              <Text style={styles.leaderScore}>{Math.round(entry.heat_score)}</Text>
            </View>
          ))}
          {top10.length > 5 && !showAllCallers && (
            <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowAllCallers(true)} activeOpacity={0.7}>
              <View style={styles.showMoreInner}>
                <Ionicons name="chevron-down" size={14} color="#4a5568" />
                <Text style={styles.showMoreText}>Show more</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Settings */}
      <TouchableOpacity style={styles.showMoreBtn} onPress={() => setShowSettings(s => !s)} activeOpacity={0.7}>
        <View style={styles.showMoreInner}>
          <Ionicons name={showSettings ? 'chevron-up' : 'settings-outline'} size={14} color="#4a5568" />
          <Text style={styles.showMoreText}>Settings</Text>
        </View>
      </TouchableOpacity>

      {showSettings && (
        <View style={styles.settingsPanel}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsRowLabel}>Hot venue alerts</Text>
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ true: '#3B82F6' }}
              thumbColor="#fff"
            />
          </View>
          <TouchableOpacity
            style={styles.settingsRowBtn}
            onPress={() => Linking.openURL('https://allstreets.github.io/pulse/privacy-policy.html')}
          >
            <Text style={styles.settingsRowBtnText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsRowBtn} onPress={signOut}>
            <Text style={styles.settingsRowBtnText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.deleteAccount} onPress={handleDeleteAccount}>
        <Text style={styles.deleteAccountText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>

      <FriendRequestsPanel
        visible={showRequests}
        requests={pendingIncoming}
        onAccept={acceptRequest}
        onDecline={declineRequest}
        onClose={() => setShowRequests(false)}
      />

      <FriendsListPanel
        visible={showFriends}
        friends={friends}
        onRemove={removeFriend}
        onClose={() => setShowFriends(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060b18' },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },

  iconRow: { position: 'absolute', top: 56, right: 20, flexDirection: 'row', gap: 4, zIndex: 10 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#00d4ff', alignItems: 'center', justifyContent: 'center' },
  notifDotText: { color: '#060b18', fontSize: 9, fontWeight: '900' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 32 },
  avatar: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800' },
  headerInfo: { flex: 1, gap: 6 },
  username: { color: '#e2e8f0', fontSize: 24, fontWeight: '800' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  stats: { flexDirection: 'row', backgroundColor: '#0d1628', borderRadius: 16, borderWidth: 1, borderColor: '#1e3a5f', overflow: 'hidden', marginBottom: 16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue: { color: '#00d4ff', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#4a5568', fontSize: 11, marginTop: 2, letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#1e3a5f' },

  percentileRow: { backgroundColor: '#0d1628', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1e3a5f' },
  percentileText: { color: '#64748b', fontSize: 13 },
  percentileHighlight: { color: '#00d4ff', fontWeight: '700' },

  section: { marginBottom: 24 },
  sectionTitle: { color: '#4a5568', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  accuracy: { color: '#e2e8f0', fontSize: 20, fontWeight: '700' },
  accuracySub: { color: '#4a5568', fontSize: 13, marginTop: 2 },
  callsLeft: { color: '#e2e8f0', fontSize: 16, fontWeight: '600' },

  nightSummary: { gap: 4 },
  nightScore: { color: '#e2e8f0', fontSize: 18, fontWeight: '700' },
  nightVenues: { color: '#4a5568', fontSize: 13, marginTop: 2 },

  venueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0d1628' },
  venueName: { color: '#94a3b8', fontSize: 14, flex: 1 },
  venueCount: { color: '#4a5568', fontSize: 13, fontWeight: '700' },

  showMoreBtn: { marginTop: 4, borderRadius: 14, borderWidth: 1, borderColor: '#1e2a3a', backgroundColor: '#080e1a', overflow: 'hidden' },
  showMoreInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 13, gap: 7 },
  showMoreText: { color: '#4a5568', fontSize: 13, fontWeight: '600' },

  leaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#0d1628' },
  leaderRank: { color: '#1e3a5f', fontSize: 13, fontWeight: '700', width: 28 },
  leaderName: { flex: 1, color: '#94a3b8', fontSize: 14 },
  leaderNameSelf: { color: '#00d4ff' },
  leaderScore: { color: '#4a5568', fontSize: 13 },

  settingsPanel: { marginTop: 4, borderRadius: 14, borderWidth: 1, borderColor: '#1e2a3a', backgroundColor: '#080e1a', overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1e2a3a' },
  settingsRowLabel: { color: '#94a3b8', fontSize: 14, fontWeight: '600' },
  settingsRowBtn: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#1e2a3a' },
  settingsRowBtnText: { color: '#4a5568', fontSize: 14, fontWeight: '600' },
  deleteAccount: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  deleteAccountText: { color: '#7f1d1d', fontSize: 14 },

  guestContainer: { flex: 1, backgroundColor: '#060b18', justifyContent: 'center', alignItems: 'center', padding: 32 },
  guestTitle: { color: '#e2e8f0', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  guestBody: { color: '#4a5568', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  guestBtn: { backgroundColor: '#3B82F6', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  guestBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  guestLink: { color: '#1e3a5f', fontSize: 13 },
});
