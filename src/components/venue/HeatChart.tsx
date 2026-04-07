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

  function heatColor(heat: number): string {
    const ratio = heat / maxHeat;
    if (ratio < 0.5) {
      // yellow → orange
      const t = ratio / 0.5;
      const r = Math.round(255);
      const g = Math.round(235 - t * 70);
      return `rgb(${r},${g},0)`;
    }
    // orange → red
    const t = (ratio - 0.5) / 0.5;
    const r = Math.round(255 - t * 55);
    const g = Math.round(165 - t * 165);
    return `rgb(${r},${g},0)`;
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.chart}>
        {points.map((p) => (
          <View key={p.hour} style={styles.barContainer}>
            <View style={[styles.bar, { height: Math.max(4, (p.heat / maxHeat) * 60), backgroundColor: heatColor(p.heat) }]} />
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
  bar: { width: '80%', borderRadius: 2 },
  hour: { color: '#555', fontSize: 9, marginTop: 2 },
  empty: { color: '#555', fontSize: 12, fontStyle: 'italic' },
});
