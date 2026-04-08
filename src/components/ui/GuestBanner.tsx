import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserStore } from '@/stores/userStore';

export function GuestBanner() {
  const browseMode = useUserStore((s) => s.browseMode);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!browseMode) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.text}>Browsing as guest</Text>
      <TouchableOpacity onPress={() => router.replace('/(auth)/login?signup=1')}>
        <Text style={styles.cta}>Sign up free →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  text: { color: '#555', fontSize: 13 },
  cta: { color: '#3B82F6', fontSize: 13, fontWeight: '700' },
});
