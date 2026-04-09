import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface LeaderboardEntry {
  id: string;
  username: string;
  heat_score: number;
}

export interface NightlySummary {
  correct: number;
  total: number;
  pointsEarned: number;
  venueNames: string[];
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id, username, heat_score')
    .order('heat_score', { ascending: false })
    .limit(10);
  return data ?? [];
}

async function fetchPercentile(userId: string, userHeatScore: number): Promise<number | null> {
  const { count: above } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('heat_score', userHeatScore);
  const { count: total } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  if (!total || total === 0) return null;
  return Math.round(((above ?? 0) / total) * 100);
}

async function fetchLastNight(userId: string): Promise<NightlySummary | null> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const start = new Date(yesterday);
  start.setHours(18, 0, 0, 0);
  const end = new Date(now);
  end.setHours(2, 0, 0, 0);

  const { data: preds } = await supabase
    .from('predictions')
    .select('outcome, points_earned, venue_id')
    .eq('user_id', userId)
    .in('outcome', ['correct', 'incorrect'])
    .gte('created_at', start.toISOString())
    .lte('created_at', end.toISOString());

  if (!preds || preds.length === 0) return null;

  const correct = preds.filter((p) => p.outcome === 'correct').length;
  const pointsEarned = preds.reduce((sum, p) => sum + (p.points_earned ?? 0), 0);
  const venueIds = [...new Set(preds.map((p) => p.venue_id))];

  const { data: venues } = await supabase
    .from('venues')
    .select('name')
    .in('id', venueIds);

  return {
    correct,
    total: preds.length,
    pointsEarned,
    venueNames: (venues ?? []).map((v) => v.name),
  };
}

export function useLeaderboard(userId: string | null, userHeatScore: number) {
  const [top10, setTop10] = useState<LeaderboardEntry[]>([]);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [lastNight, setLastNight] = useState<NightlySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard()
      .then(setTop10)
      .finally(() => setLoading(false));
    if (userId) {
      fetchPercentile(userId, userHeatScore).then(setUserPercentile);
      fetchLastNight(userId).then(setLastNight);
    }
  }, [userId, userHeatScore]);

  return { top10, userPercentile, lastNight, loading };
}
