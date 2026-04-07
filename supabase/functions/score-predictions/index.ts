import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const MINIMUM_PINGS_TO_SCORE = 5;
const BASE_POINTS = 100;

function getHourBucket(hour: number): number {
  return Math.floor(hour / 2);
}

function scorePrediction(input: {
  heatAtCallTime: number;
  finalHeatScore: number;
  venueHistoricalAvg: number;
  venueP75Heat: number;
}): { outcome: 'correct' | 'incorrect'; boldnessScore: number; pointsAwarded: number } {
  const { heatAtCallTime, finalHeatScore, venueHistoricalAvg, venueP75Heat } = input;
  if (finalHeatScore <= venueHistoricalAvg) {
    return { outcome: 'incorrect', boldnessScore: 0, pointsAwarded: 0 };
  }
  const boldnessScore = heatAtCallTime < venueP75Heat ? 2.0 : 0.5;
  return { outcome: 'correct', boldnessScore, pointsAwarded: Math.round(BASE_POINTS * boldnessScore) };
}

Deno.serve(async (_req) => {
  const scoredAt = new Date().toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: predictions, error: predErr } = await supabase
    .from('predictions')
    .select('*')
    .eq('outcome', 'pending')
    .eq('time_window', 'tonight');

  if (predErr) return new Response(predErr.message, { status: 500 });
  if (!predictions?.length) return new Response(JSON.stringify({ scored: 0 }), { headers: { 'Content-Type': 'application/json' } });

  const results: Array<{ id: string; outcome: string; pointsAwarded?: number }> = [];

  for (const prediction of predictions) {
    if (prediction.target_type !== 'venue') continue;

    const { count } = await supabase
      .from('location_pings')
      .select('id', { count: 'exact', head: true })
      .eq('venue_id', prediction.target_id)
      .gte('pinged_at', todayStart.toISOString());

    if ((count ?? 0) < MINIMUM_PINGS_TO_SCORE) {
      await supabase
        .from('predictions')
        .update({ outcome: 'voided', scored_at: scoredAt })
        .eq('id', prediction.id);
      results.push({ id: prediction.id, outcome: 'voided' });
      continue;
    }

    const { data: venue } = await supabase
      .from('venues')
      .select('current_heat_score')
      .eq('id', prediction.target_id)
      .single();

    const now = new Date();
    const { data: history } = await supabase
      .from('venue_heat_history')
      .select('avg_heat, p75_heat')
      .eq('venue_id', prediction.target_id)
      .eq('day_of_week', now.getDay())
      .eq('hour_bucket', getHourBucket(now.getHours()))
      .single();

    if (!history || !venue) {
      await supabase
        .from('predictions')
        .update({ outcome: 'voided', scored_at: scoredAt })
        .eq('id', prediction.id);
      results.push({ id: prediction.id, outcome: 'voided' });
      continue;
    }

    const { outcome, boldnessScore, pointsAwarded } = scorePrediction({
      heatAtCallTime: prediction.heat_at_call_time ?? 0,
      finalHeatScore: venue.current_heat_score,
      venueHistoricalAvg: history.avg_heat,
      venueP75Heat: history.p75_heat,
    });

    await supabase
      .from('predictions')
      .update({ outcome, boldness_score: boldnessScore, points_awarded: pointsAwarded, scored_at: scoredAt })
      .eq('id', prediction.id);

    if (outcome === 'correct') {
      await supabase.rpc('increment_user_heat_score', {
        user_id: prediction.user_id,
        points: pointsAwarded,
      });
    }

    results.push({ id: prediction.id, outcome, pointsAwarded });
  }

  return new Response(JSON.stringify({ scored: results.length, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
