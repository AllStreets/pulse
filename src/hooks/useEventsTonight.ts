import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

const TM_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY;

export type EventCategory = 'music' | 'arts' | 'sports' | 'other';

export interface TonightEvent {
  id: string;
  name: string;
  venueName: string;
  startTime: string;
  category: string;
  categoryKey: EventCategory;
  url: string;
  lat: number | null;
  lng: number | null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapSegmentToCategory(segment: string): EventCategory {
  const s = segment.toLowerCase();
  if (s.includes('music')) return 'music';
  if (s.includes('arts') || s.includes('theatre') || s.includes('film') || s.includes('comedy')) return 'arts';
  if (s.includes('sport')) return 'sports';
  return 'other';
}

function isAfter5pmChicago(isoTime: string): boolean {
  if (!isoTime) return true;
  const d = new Date(isoTime);
  const hourStr = d.toLocaleString('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(hourStr, 10);
  return hour >= 17;
}

function filterPastEvents(events: TonightEvent[]): TonightEvent[] {
  const now = new Date().toISOString();
  return events.filter(e => !e.startTime || e.startTime > now);
}

export function useEventsTonight() {
  const [events, setEvents] = useState<TonightEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const allFetchedEvents = useRef<TonightEvent[]>([]);
  const lastFetchedDate = useRef<string>('');
  const filterInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!TM_KEY) { setLoading(false); return; }
    fetchEvents();

    filterInterval.current = setInterval(() => {
      setEvents(filterPastEvents(allFetchedEvents.current));
    }, 60000);

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      if (filterInterval.current) clearInterval(filterInterval.current);
    };
  }, []);

  function handleAppStateChange(state: AppStateStatus) {
    if (state === 'active' && todayKey() !== lastFetchedDate.current) {
      fetchEvents();
    }
  }

  async function fetchEvents() {
    if (!TM_KEY) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const url = `https://app.ticketmaster.com/discovery/v2/events.json`
        + `?apikey=${TM_KEY}&city=Chicago&stateCode=IL`
        + `&startDateTime=${today}T00:00:00Z&endDateTime=${tomorrow}T05:00:00Z`
        + `&sort=date,asc&size=100`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const rawEvents = json?._embedded?.events ?? [];

      const counts: Record<EventCategory, number> = { music: 0, arts: 0, sports: 0, other: 0 };
      const results: TonightEvent[] = [];

      for (const e of rawEvents) {
        const startTime = e.dates?.start?.dateTime ?? '';
        if (!isAfter5pmChicago(startTime)) continue;
        const categoryKey = mapSegmentToCategory(e.classifications?.[0]?.segment?.name ?? '');
        if (counts[categoryKey] >= 15) continue;
        counts[categoryKey]++;
        const venue = e._embedded?.venues?.[0];
        results.push({
          id: e.id,
          name: e.name,
          venueName: venue?.name ?? '',
          startTime,
          category: e.classifications?.[0]?.segment?.name ?? 'Event',
          categoryKey,
          url: e.url ?? '',
          lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
          lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
        });
      }

      lastFetchedDate.current = todayKey();
      allFetchedEvents.current = results;
      setEvents(filterPastEvents(results));
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  return { events, loading };
}
