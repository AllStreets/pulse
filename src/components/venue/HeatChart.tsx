import { View, Text, StyleSheet } from 'react-native';

interface Point { hour: number; heat: number; }

interface Props {
  points: Point[];
  label: string;
}

export function HeatChart({ points, label }: Props) {
  if (points.length === 0) {
    return <Text style={styles.empty}>No data yet tonight</Text>;
  }

  let maxHeat = 1;
  for (const p of points) if (p.heat > maxHeat) maxHeat = p.heat;

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chart}>
        {points.map((p) => (
          <View key={p.hour} style={styles.barContainer}>
            <View style={[styles.bar, { height: Math.max(4, (p.heat / maxHeat) * 60) }]} />
            <Text style={styles.hour}>{p.hour % 12 || 12}{p.hour < 12 ? 'a' : 'p'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: '#888', fontSize: 12, marginBottom: 8 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80 },
  barContainer: { alignItems: 'center', flex: 1 },
  bar: { width: '80%', backgroundColor: '#FF6B35', borderRadius: 2 },
  hour: { color: '#555', fontSize: 9, marginTop: 2 },
  empty: { color: '#555', fontSize: 12, fontStyle: 'italic' },
});
