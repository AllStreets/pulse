import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const SPIKE_THRESHOLD = 30; // min weighted score to qualify as "hot"
const VELOCITY_THRESHOLD = 1.5; // must be 1.5x hotter than 30 min ago

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: 'default';
  badge?: number;
}

async function sendPushBatch(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;
  // Expo push accepts up to 100 per request
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(batch),
    });
  }
}

function decayedScore(pings: Array<{ pinged_at: string }>): number {
  const now = Date.now();
  return pings.reduce((sum, p) => {
    const ageMinutes = (now - new Date(p.pinged_at).getTime()) / 60000;
    return sum + Math.exp((-ageMinutes * Math.LN2) / 30);
  }, 0);
}

Deno.serve(async (_req) => {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();

  // Get all recent pings
  const { data: allPings } = await supabase
    .from('location_pings')
    .select('neighborhood_id, venue_id, pinged_at')
    .gte('pinged_at', twoHoursAgo);

  if (!allPings?.length) {
    return new Response(JSON.stringify({ notified: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  // Group pings by neighborhood
  const byNeighborhood = new Map<string, { all: typeof allPings; recent: typeof allPings }>();
  for (const p of allPings) {
    if (!p.neighborhood_id) continue;
    if (!byNeighborhood.has(p.neighborhood_id)) {
      byNeighborhood.set(p.neighborhood_id, { all: [], recent: [] });
    }
    const g = byNeighborhood.get(p.neighborhood_id)!;
    g.all.push(p);
    if (p.pinged_at >= thirtyMinsAgo) g.recent.push(p);
  }

  // Find spiking neighborhoods
  const spikingNeighborhoodIds: string[] = [];
  for (const [nId, { all, recent }] of byNeighborhood) {
    const currentScore = decayedScore(recent);
    const historicScore = decayedScore(all.filter(p => p.pinged_at < thirtyMinsAgo));
    if (currentScore >= SPIKE_THRESHOLD && currentScore >= historicScore * VELOCITY_THRESHOLD) {
      spikingNeighborhoodIds.push(nId);
    }
  }

  if (spikingNeighborhoodIds.length === 0) {
    return new Response(JSON.stringify({ notified: 0, checked: byNeighborhood.size }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get neighborhood names
  const { data: hoods } = await supabase
    .from('neighborhoods')
    .select('id, name')
    .in('id', spikingNeighborhoodIds);
  const hoodNames = new Map((hoods ?? []).map((h: any) => [h.id, h.name]));

  // Find users with pending predictions in spiking neighborhoods' venues
  const spikingVenueIds = allPings
    .filter(p => spikingNeighborhoodIds.includes(p.neighborhood_id ?? ''))
    .map(p => p.venue_id)
    .filter(Boolean);

  const today = now.toISOString().split('T')[0];
  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, target_id, heat_at_call_time')
    .eq('outcome', 'pending')
    .in('target_id', [...new Set(spikingVenueIds)])
    .gte('created_at', `${today}T00:00:00`);

  if (!predictions?.length) {
    return new Response(JSON.stringify({ notified: 0, spiking: spikingNeighborhoodIds.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get push tokens for those users
  const userIds = [...new Set(predictions.map((p: any) => p.user_id))];
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, push_token, notifications_enabled')
    .in('id', userIds)
    .not('push_token', 'is', null)
    .eq('notifications_enabled', true);

  const tokenMap = new Map((profiles ?? []).map((p: any) => [p.id, p.push_token]));

  // Get venue → neighborhood mapping for message context
  const { data: venues } = await supabase
    .from('venues')
    .select('id, name, neighborhood_id')
    .in('id', [...new Set(spikingVenueIds)]);
  const venueMap = new Map((venues ?? []).map((v: any) => [v.id, v]));

  // Build messages — one per user, don't spam
  const notifiedUsers = new Set<string>();
  const messages: PushMessage[] = [];

  for (const pred of predictions) {
    if (notifiedUsers.has(pred.user_id)) continue;
    const token = tokenMap.get(pred.user_id);
    if (!token || !token.startsWith('ExponentPushToken')) continue;

    const venue = venueMap.get(pred.target_id);
    const hoodName = venue ? hoodNames.get(venue.neighborhood_id) ?? 'your area' : 'your area';

    messages.push({
      to: token,
      sound: 'default',
      title: `${hoodName} is heating up 🔥`,
      body: `Activity is spiking — your call might be paying off.`,
      data: { neighborhoodId: venue?.neighborhood_id ?? '', venueId: pred.target_id },
    });
    notifiedUsers.add(pred.user_id);
  }

  await sendPushBatch(messages);

  return new Response(JSON.stringify({ notified: messages.length, spiking: spikingNeighborhoodIds.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
