import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
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
  const notifListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    notifListener.current = Notifications.addNotificationReceivedListener(() => {
      // Future: navigate to venue sheet
    });

    return () => {
      if (notifListener.current) {
        notifListener.current.remove();
      }
    };
  }, []);
}
