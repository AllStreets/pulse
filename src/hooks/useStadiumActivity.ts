import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TimelinePoint {
  hour: number;
  heat: number;
}

export function useStadiumActivity(stadiumId: string | null) {
  const [timeline, setTimeline] = useState<TimelinePoint[]>([]);
  const [pingCount, setPingCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stadiumId) {
      setTimeline([]);
      setPingCount(0);
      setUpdatedAt(null);
      return;
    }

    async function fetch() {
      setLoading(true);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from('stadium_pings')
        .select('pinged_at')
        .eq('stadium_id', stadiumId)
        .gte('pinged_at', todayStart.toISOString())
        .order('pinged_at');

      setLoading(false);
      if (!data) return;

      const buckets = new Map<number, number>();
      for (const ping of data) {
        const hour = new Date(ping.pinged_at).getHours();
        const bucket = Math.floor(hour / 2) * 2;
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
      }

      setTimeline(
        Array.from(buckets.entries()).map(([hour, heat]) => ({ hour, heat }))
      );
      setPingCount(data.length);
      setUpdatedAt(new Date());
    }

    fetch();
  }, [stadiumId]);

  return { timeline, pingCount, updatedAt, loading };
}
