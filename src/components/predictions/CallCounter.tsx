import { View, Text, StyleSheet } from 'react-native';

interface Props {
  callsRemaining: number;
}

export function CallCounter({ callsRemaining }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.count}>{callsRemaining}</Text>
      <Text style={styles.label}>calls left tonight</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  count: { color: '#FF6B35', fontSize: 22, fontWeight: '900' },
  label: { color: '#666', fontSize: 11 },
});
