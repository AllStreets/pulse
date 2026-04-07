import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import type { Venue } from '@/types';

interface Props {
  venue: Venue;
  onPress: (venue: Venue) => void;
}

export function VenueMarker({ venue, onPress }: Props) {
  return (
    <MapboxGL.MarkerView
      coordinate={[venue.coordinates.lng, venue.coordinates.lat]}
    >
      <TouchableOpacity style={styles.marker} onPress={() => onPress(venue)}>
        <Text style={styles.dot}>●</Text>
      </TouchableOpacity>
    </MapboxGL.MarkerView>
  );
}

const styles = StyleSheet.create({
  marker: { padding: 4 },
  dot: { color: '#3B82F6', fontSize: 12 },
});
