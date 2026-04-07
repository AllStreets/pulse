import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Point { hour: number; heat: number; }
interface Props { points: Point[]; label: string; }

// All 12 two-hour slots from midnight to 10pm
const ALL_SLOTS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

function slotLabel(hour: number): string {
  if (hour === 0) return '12a';
  if (hour === 12) return '12p';
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

function heatColor(ratio: number): string {
  if (ratio <= 0) return '#1e1e1e';
  if (ratio < 0.5) {
    const t = ratio / 0.5;
    return `rgb(255,${Math.round(235 - t * 70)},0)`;
  }
  const t = (ratio - 0.5) / 0.5;
  return `rgb(${Math.round(255 - t * 55)},${Math.round(165 - t * 165)},0)`;
}

export function HeatChart({ points, label }: Props) {
  const heatMap = new Map(points.map((p) => [p.hour, p.heat]));

  let maxHeat = 1;
  for (const v of heatMap.values()) if (v > maxHeat) maxHeat = v;

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chart}>
          {ALL_SLOTS.map((hour) => {
            const heat = heatMap.get(hour) ?? 0;
            const ratio = heat / maxHeat;
            const barH = heat > 0 ? Math.max(6, ratio * 52) : 3;
            return (
              <View key={hour} style={styles.barContainer}>
                <View style={[styles.bar, { height: barH, backgroundColor: heatColor(ratio) }]} />
                <Text style={styles.hour}>{slotLabel(hour)}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: '#555', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 72, paddingBottom: 1 },
  barContainer: { alignItems: 'center', width: 26 },
  bar: { width: 18, borderRadius: 3 },
  hour: { color: '#3a3a3a', fontSize: 9, marginTop: 4 },
});
