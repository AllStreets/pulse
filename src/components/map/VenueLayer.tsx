import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type { Venue } from '@/types';

interface Props {
  venues: Venue[];
  onPress: (venue: Venue) => void;
}

export function VenueLayer({ venues, onPress }: Props) {
  return (
    <>
      {venues.map((v) => (
        <MapboxGL.PointAnnotation
          key={v.id}
          id={v.id}
          coordinate={[v.coordinates.lng, v.coordinates.lat]}
          onSelected={() => onPress(v)}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          {/* 44pt outer hit zone, visible 16pt dot in center */}
          <View style={styles.hitArea}>
            <View style={styles.dot} />
          </View>
        </MapboxGL.PointAnnotation>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
});
