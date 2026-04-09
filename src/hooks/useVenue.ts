import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Venue, VenueHeatHistory } from '@/types';

interface TonightPoint {
  hour: number;
  heat: number;
}

export function useVenue(venueId: string | null) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [tonightTimeline, setTonightTimeline] = useState<TonightPoint[]>([]);
  const [historyForNow, setHistoryForNow] = useState<VenueHeatHistory | null>(null);
  const [predictionCount, setPredictionCount] = useState(0);
  const [vibeTags, setVibeTags] = useState<string[]>([]);

  useEffect(() => {
    if (!venueId) {
      setVenue(null);
      setTonightTimeline([]);
      setHistoryForNow(null);
      setPredictionCount(0);
      setVibeTags([]);
      return;
    }

    async function fetchVenue() {
      const { data } = await supabase.from('venues_geo').select('*').eq('id', venueId).single();
      if (data) {
        setVenue({
          ...data,
          coordinates: { lat: data.lat, lng: data.lng },
        });
      }
    }

    async function fetchTonightTimeline() {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from('location_pings')
        .select('pinged_at')
        .eq('venue_id', venueId)
        .gte('pinged_at', todayStart.toISOString())
        .order('pinged_at');

      if (!data) return;

      const buckets = new Map<number, number>();
      for (const ping of data) {
        const hour = new Date(ping.pinged_at).getHours();
        const bucket = Math.floor(hour / 2) * 2;
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
      }

      setTonightTimeline(
        Array.from(buckets.entries()).map(([hour, heat]) => ({ hour, heat }))
      );
    }

    async function fetchHistoryForNow() {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const hourBucket = Math.floor(now.getHours() / 2);
      const { data } = await supabase
        .from('venue_heat_history')
        .select('*')
        .eq('venue_id', venueId)
        .eq('day_of_week', dayOfWeek)
        .eq('hour_bucket', hourBucket)
        .single();
      if (data) setHistoryForNow(data);
    }

    async function fetchPredictionCount() {
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('predictions')
        .select('id', { count: 'exact', head: true })
        .eq('target_id', venueId)
        .eq('target_type', 'venue')
        .gte('created_at', `${today}T00:00:00`);
      setPredictionCount(count ?? 0);
    }

    async function fetchVibeTags() {
      const { data } = await supabase
        .from('local_knowledge')
        .select('content')
        .eq('target_id', venueId)
        .eq('target_type', 'venue')
        .eq('type', 'vibe_tag')
        .eq('status', 'published');
      if (data) setVibeTags(data.map((d: any) => d.content));
    }

    fetchVenue();
    fetchTonightTimeline();
    fetchHistoryForNow();
    fetchPredictionCount();
    fetchVibeTags();
  }, [venueId]);

  return { venue, tonightTimeline, historyForNow, predictionCount, vibeTags };
}
