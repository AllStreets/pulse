import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { HeatmapPoint, Venue } from '@/types';

function parseVenue(v: any): Venue {
  return {
    ...v,
    coordinates: { lat: v.lat, lng: v.lng },
  };
}

export function useHeatmap() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([]);

  async function fetchVenues() {
    const { data } = await supabase.from('venues_geo').select('*');
    if (!data) return;
    setVenues(data.map(parseVenue));
  }

  async function fetchHeatPoints() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: pings } = await supabase
      .from('location_pings')
      .select('venue_id')
      .gte('pinged_at', twoHoursAgo);

    if (!pings) return;

    const counts = new Map<string, number>();
    for (const ping of pings) {
      if (ping.venue_id) {
        counts.set(ping.venue_id, (counts.get(ping.venue_id) ?? 0) + 1);
      }
    }

    let maxCount = 1;
    for (const v of counts.values()) if (v > maxCount) maxCount = v;

    const { data: venueData } = await supabase
      .from('venues_geo')
      .select('id, lat, lng');

    if (!venueData) return;

    const points: HeatmapPoint[] = venueData
      .filter((v: any) => counts.has(v.id))
      .map((v: any) => ({
        lng: v.lng,
        lat: v.lat,
        weight: (counts.get(v.id) ?? 0) / maxCount,
      }));

    setHeatPoints(points);
  }

  const refreshHeatPoints = useCallback(async () => {
    await Promise.all([fetchHeatPoints(), fetchVenues()]);
  }, []);

  useEffect(() => {
    fetchVenues();
    fetchHeatPoints();
  }, []);

  return { venues, heatPoints, refreshHeatPoints };
}
