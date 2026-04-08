import '@/lib/locationTask';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/hooks/useAuth';
import { registerForPushNotifications, useNotificationListener } from '@/hooks/useNotifications';
import { useUserStore } from '@/stores/userStore';
import { supabase } from '@/lib/supabase';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useNotificationListener();
  const browseMode = useUserStore((s) => s.browseMode);

  useEffect(() => {
    if (loading) return;
    let stale = false;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup && !browseMode) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      AsyncStorage.getItem('onboarding_complete').then((done) => {
        if (stale) return;
        router.replace(done ? '/(tabs)' : '/(auth)/onboarding');
      });
    }
    return () => { stale = true; };
  }, [session, loading, segments, router, browseMode]);

  useEffect(() => {
    if (session?.user?.id) {
      registerForPushNotifications(session.user.id);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/(auth)/reset-password');
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
