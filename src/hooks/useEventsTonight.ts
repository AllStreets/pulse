import { useEffect, useState } from 'react';

const TM_KEY = process.env.EXPO_PUBLIC_TICKETMASTER_KEY;

export interface TonightEvent {
  id: string;
  name: string;
  venueName: string;
  startTime: string;
  category: string;
  url: string;
  lat: number | null;
  lng: number | null;
}

export function useEventsTonight() {
  const [events, setEvents] = useState<TonightEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!TM_KEY) { setLoading(false); return; }
    fetchEvents();
  }, []);

  async function fetchEvents() {
    if (!TM_KEY) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const url = `https://app.ticketmaster.com/discovery/v2/events.json`
        + `?apikey=${TM_KEY}&city=Chicago&stateCode=IL`
        + `&startDateTime=${today}T00:00:00Z&endDateTime=${tomorrow}T05:00:00Z`
        + `&sort=date,asc&size=20`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      const rawEvents = json?._embedded?.events ?? [];
      const results: TonightEvent[] = rawEvents.map((e: any) => {
        const venue = e._embedded?.venues?.[0];
        return {
          id: e.id,
          name: e.name,
          venueName: venue?.name ?? '',
          startTime: e.dates?.start?.dateTime ?? '',
          category: e.classifications?.[0]?.segment?.name ?? 'Event',
          url: e.url ?? '',
          lat: venue?.location?.latitude ? parseFloat(venue.location.latitude) : null,
          lng: venue?.location?.longitude ? parseFloat(venue.location.longitude) : null,
        };
      });
      setEvents(results);
    } catch {
      // silently fail
    }
    setLoading(false);
  }

  return { events, loading };
}
