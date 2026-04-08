import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export function GameBanner({ games }: Props) {
  if (games.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {games.map(game => (
          <View key={game.id} style={[styles.gameChip, game.status === 'in' && styles.gameChipLive]}>
            <Ionicons name={sportIcon(game.sport)} size={13} color={game.status === 'in' ? '#4CAF50' : '#888'} />
            <View style={styles.gameInfo}>
              <Text style={styles.gameTeams} numberOfLines={1}>
                {game.chicagoIsHome
                  ? `${game.chicagoTeam} vs ${game.awayTeam}`
                  : `${game.chicagoTeam} @ ${game.homeTeam}`}
              </Text>
              {game.status === 'in' ? (
                <Text style={styles.gameScore}>
                  {game.chicagoIsHome ? game.homeScore : game.awayScore}
                  {' – '}
                  {game.chicagoIsHome ? game.awayScore : game.homeScore}
                  {'  '}
                  <Text style={styles.liveDot}>LIVE</Text>
                </Text>
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
    backgroundColor: '#111', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#1e1e1e',
  },
  gameChipLive: { borderColor: '#4CAF5040', backgroundColor: '#0d1f0d' },
  gameInfo: { gap: 2 },
  gameTeams: { color: '#ddd', fontSize: 13, fontWeight: '600' },
  gameScore: { color: '#aaa', fontSize: 11 },
  gameTime: { color: '#555', fontSize: 11 },
  liveDot: { color: '#4CAF50', fontWeight: '700' },
});
