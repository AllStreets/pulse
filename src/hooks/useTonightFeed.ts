import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Venue, Prediction } from '@/types';

export interface HotVenue {
  venue: Venue;
  pingCount: number;
  rank: number;
  callerCount: number;
  neighborhoodName: string;
  neighborhoodColor: string;
}

export interface PredictionWithVenue extends Prediction {
  venueName: string;
}

function parseVenue(v: any): Venue {
  return {
    ...v,
    coordinates: { lat: v.lat, lng: v.lng },
  };
}

export function useTonightFeed(userId: string | null) {
  const [hotVenues, setHotVenues] = useState<HotVenue[]>([]);
  const [myPredictions, setMyPredictions] = useState<PredictionWithVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  async function fetchFeed() {
    await Promise.all([fetchHotVenues(), userId ? fetchMyPredictions(userId) : Promise.resolve()]);
    setLoading(false);
  }

  async function fetchHotVenues() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: pings } = await supabase
      .from('location_pings')
      .select('venue_id')
      .gte('pinged_at', twoHoursAgo);

    if (!pings) return;

    const counts = new Map<string, number>();
    for (const p of pings) {
      if (p.venue_id) counts.set(p.venue_id, (counts.get(p.venue_id) ?? 0) + 1);
    }

    if (counts.size === 0) {
      setHotVenues([]);
      return;
    }

    const venueIds = Array.from(counts.keys());
    const { data: venueData } = await supabase
      .from('venues_geo')
      .select('*')
      .in('id', venueIds);

    if (!venueData) return;

    const sorted = venueData
      .map((v: any) => ({ venue: parseVenue(v), pingCount: counts.get(v.id) ?? 0 }))
      .sort((a, b) => b.pingCount - a.pingCount)
      .slice(0, 15)
      .map((item, i) => ({ ...item, rank: i + 1 }));

    if (sorted.length === 0) {
      setHotVenues([]);
      return;
    }

    // Fetch caller counts
    const hotVenueIds = sorted.map((item) => item.venue.id);
    const today = new Date().toISOString().split('T')[0];
    const { data: predRows } = await supabase
      .from('predictions')
      .select('target_id')
      .eq('target_type', 'venue')
      .in('target_id', hotVenueIds)
      .gte('created_at', `${today}T00:00:00`);

    const callerCounts = new Map<string, number>();
    for (const row of predRows ?? []) {
      callerCounts.set(row.target_id, (callerCounts.get(row.target_id) ?? 0) + 1);
    }

    // Fetch neighborhood names + colors for the venues
    const neighborhoodIds = [...new Set(sorted.map((item) => item.venue.neighborhood_id).filter(Boolean))];
    const { data: hoodData } = await supabase
      .from('neighborhoods')
      .select('id, name, map_color')
      .in('id', neighborhoodIds);

    const hoodMap = new Map<string, { name: string; color: string }>(
      (hoodData ?? []).map((h: any) => [h.id, { name: h.name, color: h.map_color ?? '#3B82F6' }])
    );

    const withMeta = sorted.map((item) => {
      const hood = hoodMap.get(item.venue.neighborhood_id);
      return {
        ...item,
        callerCount: callerCounts.get(item.venue.id) ?? 0,
        neighborhoodName: hood?.name ?? '',
        neighborhoodColor: hood?.color ?? '#3B82F6',
      };
    });

    setHotVenues(withMeta);
  }

  async function fetchMyPredictions(uid: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data: preds } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', uid)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false });

    if (!preds?.length) return;

    const venueIds = [...new Set(
      preds.filter((p: Prediction) => p.target_type === 'venue').map((p: Prediction) => p.target_id)
    )];
    const { data: venues } = await supabase.from('venues').select('id, name').in('id', venueIds);
    const nameMap = new Map((venues ?? []).map((v: any) => [v.id, v.name]));

    setMyPredictions(
      preds.map((p: Prediction) => ({ ...p, venueName: nameMap.get(p.target_id) ?? 'Unknown Venue' }))
    );
  }

  return { hotVenues, myPredictions, loading, refresh: fetchFeed };
}
