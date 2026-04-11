import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TonightEvent } from '@/hooks/useEventsTonight';

interface Props {
  events: TonightEvent[];
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function EventsList({ events }: Props) {
  if (events.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar-outline" size={18} color="#aaa" />
        <Text style={styles.sectionTitle}>Events Tonight</Text>
      </View>
      {events.slice(0, 8).map(event => {
        const hasTickets = !!event.url;
        const Row = hasTickets ? TouchableOpacity : View;
        return (
          <Row
            key={event.id}
            style={styles.row}
            {...(hasTickets ? { onPress: () => Linking.openURL(event.url), activeOpacity: 0.7 } : {})}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.eventName} numberOfLines={1}>{event.name}</Text>
              <Text style={styles.eventVenue} numberOfLines={1}>{event.venueName}</Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={styles.eventTime}>{formatTime(event.startTime)}</Text>
              {hasTickets ? (
                <View style={styles.ticketPill}>
                  <Ionicons name="ticket-outline" size={9} color="#00d4ff" />
                  <Text style={styles.ticketText}>Tickets</Text>
                </View>
              ) : (
                <Text style={styles.eventCat}>{event.category}</Text>
              )}
            </View>
          </Row>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#141414',
  },
  rowLeft: { flex: 1, gap: 2 },
  eventName: { color: '#ddd', fontSize: 14, fontWeight: '600' },
  eventVenue: { color: '#444', fontSize: 12 },
  rowRight: { alignItems: 'flex-end', gap: 2, marginLeft: 12 },
  eventTime: { color: '#888', fontSize: 13, fontWeight: '600' },
  eventCat: { color: '#333', fontSize: 10 },
  ticketPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,212,255,0.08)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)' },
  ticketText: { color: '#00d4ff', fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
});
