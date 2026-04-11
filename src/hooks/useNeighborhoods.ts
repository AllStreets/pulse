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
  heat_score: number;   // time-decayed weighted score 0-100
  is_hot: boolean;      // true if above activity threshold
  velocity: 'rising' | 'steady' | 'cooling';
}

function decayWeight(pingedAt: string): number {
  const ageMinutes = (Date.now() - new Date(pingedAt).getTime()) / 60000;
  return Math.exp((-ageMinutes * Math.LN2) / 30); // half-life 30 min
}

export function useNeighborhoods() {
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNeighborhoods();
  }, []);

  async function fetchNeighborhoods() {
    const { data: meta } = await supabase.rpc('get_neighborhoods_meta');
    if (!meta) { setLoading(false); return; }

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: pings } = await supabase
      .from('location_pings')
      .select('neighborhood_id, pinged_at')
      .gte('pinged_at', twoHoursAgo);

    // Compute decayed scores and velocity per neighborhood
    const scores = new Map<string, number>();
    const recentScores = new Map<string, number>();
    const rawCounts = new Map<string, number>();

    for (const p of pings ?? []) {
      if (!p.neighborhood_id) continue;
      const w = decayWeight(p.pinged_at);
      scores.set(p.neighborhood_id, (scores.get(p.neighborhood_id) ?? 0) + w);
      rawCounts.set(p.neighborhood_id, (rawCounts.get(p.neighborhood_id) ?? 0) + 1);
      if (p.pinged_at >= thirtyMinsAgo) {
        recentScores.set(p.neighborhood_id, (recentScores.get(p.neighborhood_id) ?? 0) + w);
      }
    }

    const maxScore = Math.max(...Array.from(scores.values()), 0.001);

    const result: NeighborhoodMeta[] = meta.map((n: any) => {
      const rawScore = scores.get(n.id) ?? 0;
      const recentScore = recentScores.get(n.id) ?? 0;
      const olderScore = rawScore - recentScore;
      const normalizedScore = Math.round((rawScore / maxScore) * 100);

      let velocity: 'rising' | 'steady' | 'cooling' = 'steady';
      if (recentScore > olderScore * 1.3) velocity = 'rising';
      else if (recentScore < olderScore * 0.7) velocity = 'cooling';

      return {
        id: n.id,
        name: n.name,
        slug: n.slug,
        scene_description: n.scene_description,
        best_for: n.best_for,
        vibe_tags: n.vibe_tags ?? [],
        bar_density: n.bar_density ?? 0,
        map_color: n.map_color ?? '#3B82F6',
        boundary: NEIGHBORHOOD_BOUNDARIES[n.slug] ?? null,
        ping_count: rawCounts.get(n.id) ?? 0,
        heat_score: normalizedScore,
        is_hot: normalizedScore >= 20 && (rawCounts.get(n.id) ?? 0) >= 2,
        velocity,
      };
    });

    // Sort by heat score descending
    result.sort((a, b) => b.heat_score - a.heat_score);

    setNeighborhoods(result);
    setLoading(false);
  }

  return { neighborhoods, loading };
}
