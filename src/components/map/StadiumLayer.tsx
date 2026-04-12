import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { StadiumTeamEntry } from '@/data/stadiums';

export interface StadiumScreenCoord {
  stadiumId: string;
  teamId: string;
  x: number;
  y: number;
  entry: StadiumTeamEntry;
}

interface Props {
  coords: StadiumScreenCoord[];
  onPress: (entry: StadiumTeamEntry) => void;
}

const BADGE_SIZE = 40;

export function StadiumLayer({ coords, onPress }: Props) {
  if (coords.length === 0) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
      {coords.map(c => (
        <TouchableOpacity
          key={`${c.stadiumId}-${c.teamId}`}
          style={[
            styles.badge,
            {
              left: c.x - BADGE_SIZE / 2,
              top: c.y - BADGE_SIZE / 2,
              backgroundColor: c.entry.team.primaryColor,
              borderColor: c.entry.team.secondaryColor,
            },
          ]}
          onPress={() => onPress(c.entry)}
          activeOpacity={0.8}
        >
          <Text style={styles.abbrev} numberOfLines={1}>{c.entry.team.abbrev}</Text>
          <Text style={styles.sport}>{c.entry.team.sport}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 6,
  },
  abbrev: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 10,
    textAlign: 'center',
  },
  sport: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 6,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 7,
    textAlign: 'center',
  },
});
