import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Venue, Prediction } from '@/types';
import { useHotVenuesStore } from '@/stores/hotVenuesStore';

export interface HotVenue {
  venue: Venue;
  pingCount: number;
  weightedScore: number;
  rank: number;
  callerCount: number;
  neighborhoodName: string;
  neighborhoodColor: string;
  velocity: 'rising' | 'steady' | 'cooling';
}

export interface PredictionWithVenue extends Prediction {
  venueName: string;
}


export function useTonightFeed(userId: string | null) {
  const { hotVenues, loading: hotVenuesLoading, fetchHotVenues } = useHotVenuesStore();
  const [myPredictions, setMyPredictions] = useState<PredictionWithVenue[]>([]);
  const [predsLoading, setPredsLoading] = useState(true);
  const loading = hotVenuesLoading || predsLoading;

  useEffect(() => {
    fetchFeed();
  }, [userId]);

  async function fetchFeed() {
    await Promise.all([
      fetchHotVenues(),
      userId ? fetchMyPredictions(userId) : Promise.resolve(),
    ]);
    setPredsLoading(false);
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
