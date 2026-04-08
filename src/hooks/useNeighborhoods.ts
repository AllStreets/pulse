import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { NEIGHBORHOOD_BOUNDARIES } from '@/data/neighborhoodBoundaries';

export interface NeighborhoodMeta {
  id: string;
  name: string;
  slug: string;
  scene_description: string | null;
  best_for: string | null;
  vibe_tags: string[];
  bar_density: number;
  map_color: string;
  boundary: GeoJSON.Polygon | null;
  ping_count: number;
}

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  async function fetchNeighborhoods() {
    // 1. Get neighborhood metadata
    const { data: meta } = await supabase.rpc('get_neighborhoods_meta');
    if (!meta) { setLoading(false); return; }

    // 2. Get ping counts per neighborhood (last 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: pings } = await supabase
      .from('location_pings')
      .select('neighborhood_id')
      .gte('pinged_at', twoHoursAgo);

    const pingCounts = new Map<string, number>();
    for (const p of (pings ?? [])) {
      if (p.neighborhood_id) {
        pingCounts.set(p.neighborhood_id, (pingCounts.get(p.neighborhood_id) ?? 0) + 1);
      }
    }

    // 3. Merge with client-side boundary data
    const result: NeighborhoodMeta[] = meta.map((n: any) => ({
      id: n.id,
      name: n.name,
      slug: n.slug,
      scene_description: n.scene_description,
      best_for: n.best_for,
      vibe_tags: n.vibe_tags ?? [],
      bar_density: n.bar_density ?? 0,
      map_color: n.map_color ?? '#3B82F6',
      boundary: NEIGHBORHOOD_BOUNDARIES[n.slug] ?? null,
      ping_count: pingCounts.get(n.id) ?? 0,
    }));

    setNeighborhoods(result);
    setLoading(false);
  }

  return { neighborhoods, loading };
}
