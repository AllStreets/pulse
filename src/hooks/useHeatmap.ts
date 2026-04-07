import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { HeatmapPoint, Venue } from '@/types';

function parseVenue(v: any): Venue {
  return {
    ...v,
    coordinates: {
      lat: v.coordinates.coordinates[1],
      lng: v.coordinates.coordinates[0],
    },
  };
}

export function useHeatmap() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([]);

  useEffect(() => {
    async function fetchVenues() {
      const { data } = await supabase.from('venues').select('*');
      if (!data) return;
      setVenues(data.map(parseVenue));
    }

    async function fetchHeatPoints() {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: pings } = await supabase
        .from('location_pings')
        .select('venue_id')
        .gte('pinged_at', thirtyMinutesAgo);

      if (!pings) return;

      const counts = new Map<string, number>();
      for (const ping of pings) {
        if (ping.venue_id) {
          counts.set(ping.venue_id, (counts.get(ping.venue_id) ?? 0) + 1);
        }
      }

      // Safe iterative max — avoids call-stack overflow on large datasets
      let maxCount = 1;
      for (const v of counts.values()) if (v > maxCount) maxCount = v;

      const { data: venueData } = await supabase
        .from('venues')
        .select('id, coordinates');

      if (!venueData) return;

      const points: HeatmapPoint[] = venueData
        .filter((v: any) => counts.has(v.id))
        .map((v: any) => ({
          lng: v.coordinates.coordinates[0],
          lat: v.coordinates.coordinates[1],
          weight: (counts.get(v.id) ?? 0) / maxCount,
        }));

      setHeatPoints(points);
    }

    fetchVenues();
    fetchHeatPoints();

    const channel = supabase
      .channel('location_pings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'location_pings' }, () => {
        fetchHeatPoints();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { venues, heatPoints };
}
