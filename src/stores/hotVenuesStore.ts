import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { HotVenue } from '@/hooks/useTonightFeed';

interface HotVenuesStore {
  hotVenues: HotVenue[];
  loading: boolean;
  fetchHotVenues: () => Promise<void>;
}

function decayWeight(pingedAt: string): number {
  const ageMinutes = (Date.now() - new Date(pingedAt).getTime()) / 60000;
  return Math.exp((-ageMinutes * Math.LN2) / 30);
}

function parseVenue(v: any) {
  return { ...v, coordinates: { lat: v.lat, lng: v.lng } };
}

export const useHotVenuesStore = create<HotVenuesStore>((set) => ({
  hotVenues: [],
  loading: true,

  fetchHotVenues: async () => {
    set({ loading: true });
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: pings } = await supabase
      .from('location_pings')
      .select('venue_id, pinged_at')
      .gte('pinged_at', twoHoursAgo);

    if (!pings?.length) { set({ hotVenues: [], loading: false }); return; }

    const scores = new Map<string, number>();
    const recentScores = new Map<string, number>();
    const rawCounts = new Map<string, number>();

    for (const p of pings) {
      if (!p.venue_id) continue;
      const w = decayWeight(p.pinged_at);
      scores.set(p.venue_id, (scores.get(p.venue_id) ?? 0) + w);
      rawCounts.set(p.venue_id, (rawCounts.get(p.venue_id) ?? 0) + 1);
      if (p.pinged_at >= thirtyMinsAgo) {
        recentScores.set(p.venue_id, (recentScores.get(p.venue_id) ?? 0) + w);
      }
    }

    if (scores.size === 0) { set({ hotVenues: [], loading: false }); return; }

    const venueIds = Array.from(scores.keys());
    const { data: venueData } = await supabase
      .from('venues_geo')
      .select('*')
      .in('id', venueIds);

    if (!venueData) { set({ loading: false }); return; }

    const sorted = venueData
      .map((v: any) => {
        const rawScore = scores.get(v.id) ?? 0;
        const recentScore = recentScores.get(v.id) ?? 0;
        const olderScore = rawScore - recentScore;
        let velocity: 'rising' | 'steady' | 'cooling' = 'steady';
        if (recentScore > olderScore * 1.3) velocity = 'rising';
        else if (recentScore < olderScore * 0.7) velocity = 'cooling';
        return {
          venue: parseVenue(v),
          pingCount: rawCounts.get(v.id) ?? 0,
          weightedScore: rawScore,
          velocity,
        };
      })
      .sort((a: any, b: any) => b.weightedScore - a.weightedScore)
      .slice(0, 15)
      .map((item: any, i: number) => ({ ...item, rank: i + 1 }));

    if (sorted.length === 0) { set({ hotVenues: [], loading: false }); return; }

    const hotVenueIds = sorted.map((item: any) => item.venue.id);
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

    const neighborhoodIds = [...new Set(sorted.map((item: any) => item.venue.neighborhood_id).filter(Boolean))];
    const { data: hoodData } = await supabase
      .from('neighborhoods')
      .select('id, name, map_color')
      .in('id', neighborhoodIds as string[]);

    const hoodMap = new Map<string, { name: string; color: string }>(
      (hoodData ?? []).map((h: any) => [h.id, { name: h.name, color: h.map_color ?? '#3B82F6' }])
    );

    set({
      loading: false,
      hotVenues: sorted.map((item: any) => {
        const hood = hoodMap.get(item.venue.neighborhood_id);
        return {
          ...item,
          callerCount: callerCounts.get(item.venue.id) ?? 0,
          neighborhoodName: hood?.name ?? '',
          neighborhoodColor: hood?.color ?? '#3B82F6',
        };
      }),
    });
  },
}));
