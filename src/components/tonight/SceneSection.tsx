import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NeighborhoodMeta } from '@/hooks/useNeighborhoods';

interface Props {
  neighborhoods: NeighborhoodMeta[];
  onPress?: (neighborhood: NeighborhoodMeta) => void;
  hotOnly?: boolean;
}

function VelocityIcon({ velocity }: { velocity: NeighborhoodMeta['velocity'] }) {
  if (velocity === 'rising') return <Ionicons name="trending-up" size={11} color="#4CAF50" />;
  if (velocity === 'cooling') return <Ionicons name="trending-down" size={11} color="#888" />;
  return null;
}

export function SceneSection({ neighborhoods, onPress, hotOnly = false }: Props) {
  const list = hotOnly
    ? neighborhoods.filter(n => n.is_hot)
    : neighborhoods;

  if (list.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="map-outline" size={18} color="#aaa" />
        <Text style={styles.sectionTitle}>Scenes Tonight</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {list.map(n => (
          <TouchableOpacity
            key={n.id}
            style={[styles.card, { borderLeftColor: n.map_color }]}
            onPress={() => onPress?.(n)}
            activeOpacity={onPress ? 0.7 : 1}
          >
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{n.name}</Text>
              {n.velocity && <VelocityIcon velocity={n.velocity} />}
            </View>
            <Text style={styles.description} numberOfLines={2}>{n.scene_description}</Text>
            <View style={styles.tags}>
              {n.vibe_tags.slice(0, 3).map(tag => (
                <View key={tag} style={[styles.tag, { borderColor: n.map_color + '50' }]}>
                  <Text style={[styles.tagText, { color: n.map_color }]}>{tag}</Text>
                </View>
              ))}
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Ionicons name="business-outline" size={11} color="#555" />
                <Text style={styles.statText}>{n.bar_density} bars</Text>
              </View>
              {n.ping_count > 0 && (
                <View style={styles.stat}>
                  <Ionicons name="radio-button-on" size={11} color="#4CAF50" />
                  <Text style={[styles.statText, { color: '#4CAF50' }]}>{n.ping_count} live</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  scroll: { gap: 10, paddingLeft: 2, paddingRight: 4 },
  card: {
    width: 180, backgroundColor: '#111', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: '#1e1e1e', borderLeftWidth: 3, gap: 8,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  description: { color: '#555', fontSize: 11, lineHeight: 16 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2 },
  tagText: { fontSize: 10, fontWeight: '600' },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  statText: { color: '#555', fontSize: 11 },
});
