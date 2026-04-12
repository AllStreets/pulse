import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
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

const BADGE_SIZE = 46;
const LOGO_SIZE = 34;

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
          <Image
            source={{ uri: c.entry.team.logoUrl }}
            style={styles.logo}
            resizeMode="contain"
          />
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
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 8,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
