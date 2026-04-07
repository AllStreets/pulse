import { View, Text, StyleSheet } from 'react-native';

interface Props {
  tags: string[];
}

export function VibeTags({ tags }: Props) {
  if (tags.length === 0) return null;
  return (
    <View style={styles.container}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.text}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  text: { color: '#aaa', fontSize: 12 },
});
