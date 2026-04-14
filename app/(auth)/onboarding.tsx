import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { registerForPushNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';

const ONBOARDING_KEY = 'onboarding_complete';

const STEPS = [
  {
    icon: 'flame' as const,
    iconColor: '#FF6B00',
    title: 'Know what\u2019s hot tonight.',
    body: 'Pulse shows you real-time nightlife heat across Chicago \u2014 which venues are popping, which scenes are alive, and where the night is heading.',
    cta: 'Next',
  },
  {
    icon: 'radio-button-on' as const,
    iconColor: '#3B82F6',
    title: 'Make your calls.',
    body: 'You get 10 calls per night. Pick venues you think will blow up before they do. Get scored at 2AM. Build your local rep.',
    cta: 'Next',
  },
  {
    icon: 'location' as const,
    iconColor: '#4CAF50',
    title: 'Power the heatmap.',
    body: 'Tap \u201cI\u2019m Here\u201d at a venue to send an anonymous signal. Your exact location is never stored \u2014 only the venue you tap.',
    cta: 'Allow Location',
  },
  {
    icon: 'navigate' as const,
    iconColor: '#4CAF50',
    title: 'Keep the map live.',
    body: 'Pulse works best with background location enabled. This lets you passively contribute to the heatmap when you\u2019re out. You can change this anytime in Settings.',
    cta: 'Enable Background Location',
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { session } = useAuth();

  async function handleCta() {
    // Step 2: request foreground location
    if (step === 2) {
      try {
        await Location.requestForegroundPermissionsAsync();
      } catch {}
      setStep(3);
      return;
    }

    // Step 3: request background location + push, then finish
    if (step === 3) {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          await Location.requestBackgroundPermissionsAsync();
        }
      } catch {}

      if (session?.user?.id) {
        await registerForPushNotifications(session.user.id);
      }

      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/(tabs)');
      return;
    }

    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    }
  }

  function handleSkip() {
    AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  }

  const current = STEPS[step];

  return (
    <View style={styles.container}>
      <Text style={styles.wordmark}>Pulse</Text>

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { borderColor: current.iconColor + '40', backgroundColor: current.iconColor + '15' }]}>
          <Ionicons name={current.icon} size={48} color={current.iconColor} />
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.bodyText}>{current.body}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCta}>
        <Text style={styles.buttonText}>{current.cta}</Text>
      </TouchableOpacity>

      {step < STEPS.length - 1 && (
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060b18',
    padding: 28,
    paddingTop: 60,
    paddingBottom: 52,
  },
  wordmark: {
    color: '#00d4ff',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 32,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#1e3a5f' },
  dotActive: { backgroundColor: '#00d4ff', width: 18 },
  iconWrap: { flex: 0.8, justifyContent: 'center', alignItems: 'center' },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, justifyContent: 'flex-start', gap: 16, paddingTop: 8 },
  title: {
    color: '#e2e8f0',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  bodyText: { color: '#4a5568', fontSize: 16, lineHeight: 24 },
  button: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { color: '#1e3a5f', textAlign: 'center', fontSize: 14, marginTop: 16 },
});
