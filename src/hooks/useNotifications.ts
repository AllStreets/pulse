import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<void> {
  // Push tokens don't work on simulators — skip silently
  if (!Constants.isDevice) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;
  if (!token) return;

  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);
}

export async function notifyIfCallsPoppingOff(
  userId: string,
  predictions: Array<{ target_id: string; heat_at_call_time: number | null; outcome: string }>,
  venues: Array<{ id: string; name: string; current_heat_score: number }>
): Promise<void> {
  // Check user's notification preference before sending anything
  const { data: profile } = await supabase
    .from('profiles')
    .select('notifications_enabled')
    .eq('id', userId)
    .single();
  if (!profile?.notifications_enabled) return;

  for (const p of predictions) {
    if (p.outcome !== 'pending') continue;
    if ((p.heat_at_call_time ?? 100) >= 40) continue;

    const venue = venues.find((v) => v.id === p.target_id);
    if (!venue) continue;
    if (venue.current_heat_score < 70) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Your call is paying off',
        body: `${venue.name} is hitting ${Math.round(venue.current_heat_score)} heat — you called it early.`,
        data: { venueId: venue.id },
      },
      trigger: null,
    });
  }
}

export function useNotificationListener() {
  const router = useRouter();
  const notifListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Fired when notification arrives while app is foregrounded
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // No-op: banner shows automatically via setNotificationHandler above
    });

    // Fired when user taps the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (!data) return;
      if (data.venueId) {
        // Navigate to tonight tab; VenueSheet opens when selectedVenue is set
        // Store the pending venue open in a global signal via router params
        router.push({ pathname: '/(tabs)', params: { openVenueId: data.venueId } });
      } else if (data.neighborhoodId) {
        router.push({ pathname: '/(tabs)', params: { openNeighborhoodId: data.neighborhoodId } });
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [router]);
}
