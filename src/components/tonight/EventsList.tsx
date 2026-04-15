import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TonightEvent, EventCategory } from '@/hooks/useEventsTonight';

interface Props {
  events: TonightEvent[];
}

const CATEGORY_COLORS: Record<string, string> = {
  all: '#00d4ff',
  music: '#A855F7',
  arts: '#14B8A6',
  sports: '#EF4444',
  other: '#64748B',
};

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'music', label: 'Music' },
  { key: 'arts', label: 'Arts' },
  { key: 'sports', label: 'Sports' },
  { key: 'other', label: 'Other' },
];

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function EventsList({ events }: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  if (events.length === 0) return null;

  const filtered = selectedFilter === 'all'
    ? events
    : events.filter(e => e.categoryKey === selectedFilter);

  const activeColor = CATEGORY_COLORS[selectedFilter];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="calendar-outline" size={18} color="#aaa" />
        <Text style={styles.sectionTitle}>Events Tonight</Text>
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => {
          const color = CATEGORY_COLORS[f.key];
          const active = selectedFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterBtn,
                active && { backgroundColor: color + '22', borderColor: color },
              ]}
              onPress={() => setSelectedFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterBtnText, active && { color }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <Text style={styles.emptyText}>No {selectedFilter} events tonight</Text>
      ) : (
        filtered.map(event => {
          const borderColor = CATEGORY_COLORS[event.categoryKey];
          const hasTickets = !!event.url;
          const Row = hasTickets ? TouchableOpacity : View;
          return (
            <Row
              key={event.id}
              style={[styles.row, { borderLeftColor: borderColor }]}
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
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },

  filterScroll: { marginBottom: 12 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e2a3a',
    backgroundColor: '#080e1a',
  },
  filterBtnText: { color: '#4a5568', fontSize: 13, fontWeight: '600' },

  emptyText: { color: '#2d3748', fontSize: 13, textAlign: 'center', paddingVertical: 20 },

  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 11, paddingLeft: 10,
    borderBottomWidth: 1, borderBottomColor: '#141414',
    borderLeftWidth: 3,
  },
  rowLeft: { flex: 1, gap: 2 },
  eventName: { color: '#ddd', fontSize: 14, fontWeight: '600' },
  eventVenue: { color: '#444', fontSize: 12 },
  rowRight: { alignItems: 'flex-end', gap: 2, marginLeft: 12 },
  eventTime: { color: '#888', fontSize: 13, fontWeight: '600' },
  eventCat: { color: '#333', fontSize: 10 },
  ticketPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,212,255,0.08)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(0,212,255,0.25)',
  },
  ticketText: { color: '#00d4ff', fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
});
