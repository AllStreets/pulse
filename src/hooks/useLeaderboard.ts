// src/hooks/useLeaderboard.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  username: string;
  heat_score: number;
  credibility_badge: string;
}

export interface NightlySummary {
  correct: number;
  total: number;
  pointsEarned: number;
  venueNames: string[];
}

interface LeaderboardData {
  top10: LeaderboardEntry[];
  userPercentile: number | null;
  lastNight: NightlySummary | null;
  loading: boolean;
}

export function useLeaderboard(userId: string | null, userHeatScore: number): LeaderboardData {
  const [top10, setTop10] = useState<LeaderboardEntry[]>([]);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [lastNight, setLastNight] = useState<NightlySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchAll();
  }, [userId, userHeatScore]);

  async function fetchAll() {
    await Promise.all([fetchLeaderboard(), fetchPercentile(), fetchLastNight()]);
    setLoading(false);
  }

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, heat_score, credibility_badge')
      .order('heat_score', { ascending: false })
      .limit(10);
    if (data) setTop10(data as LeaderboardEntry[]);
  }

  async function fetchPercentile() {
    const [{ count: total }, { count: below }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).lt('heat_score', userHeatScore),
    ]);
    if (total && total > 1) {
      setUserPercentile(Math.round(((below ?? 0) / (total - 1)) * 100));
    }
  }

  async function fetchLastNight() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const { data: preds } = await supabase
      .from('predictions')
      .select('target_id, outcome, points_awarded')
      .eq('user_id', userId!)
      .eq('target_type', 'venue')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', todayMidnight.toISOString())
      .not('scored_at', 'is', null);

    if (!preds?.length) return;

    const scored = preds.filter(p => p.outcome !== 'voided');
    if (!scored.length) return;

    const venueIds = scored.map(p => p.target_id);
    const { data: venues } = await supabase
      .from('venues')
      .select('id, name')
      .in('id', venueIds);

    const nameMap = new Map((venues ?? []).map((v: any) => [v.id, v.name]));

    setLastNight({
      correct: scored.filter(p => p.outcome === 'correct').length,
      total: scored.length,
      pointsEarned: scored.reduce((sum, p) => sum + (p.points_awarded ?? 0), 0),
      venueNames: scored
        .filter(p => p.outcome === 'correct')
        .map(p => nameMap.get(p.target_id) ?? 'Unknown'),
    });
  }

  return { top10, userPercentile, lastNight, loading };
}
