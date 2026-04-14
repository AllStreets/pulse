import { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  venueName: string;
  neighborhoodName: string;
  heatScore: number;
  neighborhoodColor: string;
}

// Rendered off-screen and captured by react-native-view-shot.
export const ShareCard = forwardRef<View, Props>(
  ({ venueName, neighborhoodName, heatScore, neighborhoodColor }, ref) => {
    const heat = Math.round(heatScore);
    const heatLabel =
      heat >= 80 ? 'ON FIRE' : heat >= 50 ? 'HEATING UP' : heat >= 25 ? 'WARMING' : 'QUIET';
    const heatColor =
      heat >= 80 ? '#FF4500' : heat >= 50 ? '#FF6B00' : heat >= 25 ? '#FFB800' : '#4a5568';

    return (
      <View ref={ref} style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: neighborhoodColor }]} />
        <View style={styles.inner}>
          <Text style={styles.wordmark}>Pulse</Text>
          <Text style={styles.venueName} numberOfLines={2}>{venueName}</Text>
          <View style={[styles.neighborhoodPill, { borderColor: neighborhoodColor + '60', backgroundColor: neighborhoodColor + '15' }]}>
            <Text style={[styles.neighborhoodText, { color: neighborhoodColor }]}>{neighborhoodName}</Text>
          </View>
          <View style={styles.heatRow}>
            <View style={styles.heatScoreBlock}>
              <Text style={[styles.heatScore, { color: heatColor }]}>{heat}</Text>
              <Text style={styles.heatUnit}>heat</Text>
            </View>
            <View style={[styles.heatLabelBadge, { backgroundColor: heatColor + '20', borderColor: heatColor + '40' }]}>
              <Text style={[styles.heatLabelText, { color: heatColor }]}>{heatLabel}</Text>
            </View>
          </View>
          <Text style={styles.footer}>pulse.app · real-time chicago nightlife</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  card: {
    width: 340,
    backgroundColor: '#060b18',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  accentBar: { height: 4, width: '100%' },
  inner: { padding: 24, gap: 12 },
  wordmark: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  venueName: {
    color: '#e2e8f0',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 32,
    marginTop: 4,
  },
  neighborhoodPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  neighborhoodText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  heatRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  heatScoreBlock: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heatScore: { fontSize: 52, fontWeight: '900', letterSpacing: -2 },
  heatUnit: { fontSize: 16, color: '#4a5568', fontWeight: '600' },
  heatLabelBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  heatLabelText: { fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  footer: { color: '#1e3a5f', fontSize: 11, marginTop: 8 },
});
