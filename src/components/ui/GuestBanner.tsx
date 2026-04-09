import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/userStore';

export function GuestBanner() {
  const router = useRouter();
  const browseMode = useUserStore((s) => s.browseMode);
  const insets = useSafeAreaInsets();

  if (!browseMode) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.text}>Browsing as guest</Text>
      <TouchableOpacity onPress={() => router.push('/(auth)/login?signup=1')}>
        <Text style={styles.link}>Sign up free →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1628',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: { color: '#4a5568', fontSize: 13 },
  link: { color: '#00d4ff', fontSize: 13, fontWeight: '600' },
});
