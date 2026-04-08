import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { registerForPushNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';

const ONBOARDING_KEY = 'onboarding_complete';

const STEPS = [
  {
    title: 'Know what\u2019s hot tonight.',
    body: 'Pulse shows you real-time nightlife heat across Chicago \u2014 which venues are popping, which scenes are alive, and where the night is heading.',
    cta: 'Next',
  },
  {
    title: 'Make your calls.',
    body: 'You get 10 calls per night. Pick venues you think will blow up before they do. Get scored at 2AM. Build your local rep.',
    cta: 'Next',
  },
  {
    title: 'Power the heatmap.',
    body: 'Your location is anonymized and contributes to the live heatmap. Tap \u201cI\u2019m Here\u201d at a venue to send a signal. The more people, the more accurate.',
    cta: 'Enable & Go',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { session } = useAuth();

  async function handleCta() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }

    // Final step — request permissions
    try {
      await Location.requestForegroundPermissionsAsync();
      await Location.requestBackgroundPermissionsAsync();
    } catch {}

    if (session?.user?.id) {
      await registerForPushNotifications(session.user.id);
    }

    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  }

  const current = STEPS[step];

  return (
    <View style={styles.container}>
      {/* Step dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.bodyText}>{current.body}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCta}>
        <Text style={styles.buttonText}>{current.cta}</Text>
      </TouchableOpacity>

      {step < STEPS.length - 1 && (
        <TouchableOpacity onPress={async () => {
          await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
          router.replace('/(tabs)');
        }}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#08080c', padding: 28, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 52 },
  dots: { flexDirection: 'row', gap: 8, alignSelf: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2a2a2a' },
  dotActive: { backgroundColor: '#3B82F6', width: 18 },
  body: { flex: 1, justifyContent: 'center', gap: 20 },
  title: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -0.5, lineHeight: 42 },
  bodyText: { color: '#666', fontSize: 17, lineHeight: 26 },
  button: { backgroundColor: '#3B82F6', padding: 18, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { color: '#444', textAlign: 'center', fontSize: 14, marginTop: 16 },
});
