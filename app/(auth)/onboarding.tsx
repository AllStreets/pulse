import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

export default function OnboardingScreen() {
  const router = useRouter();

  async function requestLocation() {
    try {
      await Location.requestForegroundPermissionsAsync();
      await Location.requestBackgroundPermissionsAsync();
    } catch {
      // Permission APIs can throw if already in a denied state — still navigate
    } finally {
      router.replace('/(tabs)');
    }
  }

  function skipLocation() {
    router.replace('/(tabs)');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Make the heatmap live.</Text>
      <Text style={styles.body}>
        Your location is anonymized and never stored individually. It contributes to the live heatmap so everyone knows what's hot right now.
      </Text>
      <TouchableOpacity style={styles.button} onPress={requestLocation}>
        <Text style={styles.buttonText}>Enable Location</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={skipLocation}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', padding: 24 },
  title: { color: '#fff', fontSize: 32, fontWeight: '800', marginBottom: 16 },
  body: { color: '#888', fontSize: 16, lineHeight: 24, marginBottom: 40 },
  button: { backgroundColor: '#3B82F6', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { color: '#555', textAlign: 'center', fontSize: 14 },
});
