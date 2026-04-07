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
      id={venue.id}
    >
      <TouchableOpacity style={styles.marker} onPress={() => onPress(venue)}>
        <Text style={styles.dot}>●</Text>
      </TouchableOpacity>
    </MapboxGL.MarkerView>
  );
}

const styles = StyleSheet.create({
  marker: { padding: 4 },
  dot: { color: '#FF6B35', fontSize: 12 },
});
