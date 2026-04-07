import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useUserStore, NIGHTLY_CALL_LIMIT } from '@/stores/userStore';
import type { Prediction, TargetType, TimeWindow } from '@/types';

export function usePredictions(userId: string | null) {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const callsUsedTonight = useUserStore((s) => s.callsUsedTonight);
  const incrementCallsUsed = useUserStore((s) => s.incrementCallsUsed);

  const callsRemaining = NIGHTLY_CALL_LIMIT - callsUsedTonight;
  const canCall = callsRemaining > 0;

  useEffect(() => {
    if (!userId) return;

    async function fetchTonightsPredictions() {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', userId!)
        .gte('created_at', `${today}T00:00:00`);

      if (data) {
        setPredictions(data);
        // Sync call count from DB to handle app restarts
        const tonightCalls = data.filter((p: Prediction) => p.time_window === 'tonight');
        useUserStore.setState({ callsUsedTonight: tonightCalls.length });
      }
    }

    fetchTonightsPredictions();
  }, [userId]);

  async function makeCall(
    targetType: TargetType,
    targetId: string,
    currentHeat: number,
    timeWindow: TimeWindow = 'tonight'
  ): Promise<{ error: string | null }> {
    if (!userId) return { error: 'Not logged in' };
    if (!canCall) return { error: 'No calls remaining tonight' };

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', userId)
      .eq('target_id', targetId)
      .gte('created_at', `${today}T00:00:00`)
      .single();

    if (existing) return { error: 'Already called this tonight' };

    const { data, error } = await supabase
      .from('predictions')
      .insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
        time_window: timeWindow,
        heat_at_call_time: currentHeat,
        outcome: 'pending',
      })
      .select()
      .single();

    if (error) return { error: error.message };
    setPredictions((prev) => [...prev, data]);
    incrementCallsUsed();
    return { error: null };
  }

  function hasCalledTarget(targetId: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return predictions.some(
      (p) => p.target_id === targetId && p.created_at >= `${today}T00:00:00`
    );
  }

  return { predictions, callsRemaining, canCall, makeCall, hasCalledTarget };
}
