import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import type { ChicagoGame } from '@/hooks/useSportsTonight';

interface Props {
  games: ChicagoGame[];
}

function sportIcon(sport: string): React.ComponentProps<typeof Ionicons>['name'] {
  switch (sport) {
    case 'baseball': return 'baseball-outline';
    case 'basketball': return 'basketball-outline';
    case 'football': return 'american-football-outline';
    case 'hockey': return 'snow-outline';
    default: return 'trophy-outline';
  }
}

function gameTime(startTime: string): string {
  if (!startTime) return '';
  const d = new Date(startTime);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function LiveBadge() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.3, { duration: 750 })
      ),
      -1,
      false
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.liveBadge}>
      <Animated.View style={[styles.liveDot, dotStyle]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  );
}

export function GameBanner({ games }: Props) {
  if (games.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {games.map(game => (
          <View key={game.id} style={[styles.gameChip, game.status === 'in' && styles.gameChipLive]}>
            {game.status === 'in' && <View style={styles.colorBar} />}
            <Ionicons name={sportIcon(game.sport)} size={13} color={game.status === 'in' ? '#ef4444' : '#4a5568'} />
            <View style={styles.gameInfo}>
              <Text style={styles.gameTeams} numberOfLines={1}>
                {game.chicagoIsHome
                  ? `${game.chicagoTeam} vs ${game.awayTeam}`
                  : `${game.chicagoTeam} @ ${game.homeTeam}`}
              </Text>
              {game.status === 'in' ? (
                <View style={styles.scoreRow}>
                  <Text style={styles.gameScore}>
                    {game.chicagoIsHome ? game.homeScore : game.awayScore}
                    {' – '}
                    {game.chicagoIsHome ? game.awayScore : game.homeScore}
                  </Text>
                  <LiveBadge />
                </View>
              ) : game.status === 'post' ? (
                <Text style={styles.gameScore}>
                  Final: {game.chicagoIsHome ? game.homeScore : game.awayScore}
                  {' – '}
                  {game.chicagoIsHome ? game.awayScore : game.homeScore}
                </Text>
              ) : (
                <Text style={styles.gameTime}>{gameTime(game.startTime)}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  scroll: { gap: 8, paddingRight: 4 },
  gameChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0d1628', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#1e3a5f',
  },
  gameChipLive: {
    borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  colorBar: {
    width: 3, height: 32, borderRadius: 2,
    backgroundColor: '#ef4444', marginLeft: -4,
  },
  gameInfo: { gap: 3 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gameTeams: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  gameScore: { color: '#94a3b8', fontSize: 11 },
  gameTime: { color: '#4a5568', fontSize: 11 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
    borderRadius: 3, paddingHorizontal: 5, paddingVertical: 2,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ef4444' },
  liveText: { color: '#ef4444', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
});
