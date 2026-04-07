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
        >
          <View style={styles.dot} />
        </MapboxGL.PointAnnotation>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
