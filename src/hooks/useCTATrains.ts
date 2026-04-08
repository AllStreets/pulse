import { useEffect, useState, useRef } from 'react';

const CTA_KEY = process.env.EXPO_PUBLIC_CTA_API_KEY;
const CTA_URL = 'https://lapi.transitchicago.com/api/1.0/ttpositions.aspx';

export const CTA_LINE_COLORS: Record<string, string> = {
  Red: '#FF2D55', Blue: '#00CFFF', Brn: '#B8860B', G: '#00E676',
  Org: '#FF6D00', P: '#D500F9', Pink: '#FF6B9D', Y: '#FFE500',
};

export interface CTATrain {
  run: string;
  route: string;
  lat: number;
  lng: number;
  heading: number;
  nextStation: string;
  color: string;
}

export function useCTATrains(enabled: boolean) {
  const [trains, setTrains] = useState<CTATrain[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled || !CTA_KEY) return;

    fetchTrains();
    intervalRef.current = setInterval(fetchTrains, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [enabled]);

  async function fetchTrains() {
    if (!CTA_KEY) return;
    try {
      // Fetch all lines
      const routes = ['Red', 'Blue', 'Brn', 'G', 'Org', 'P', 'Pink', 'Y'];
      const rtParam = routes.map(r => `rt=${r}`).join('&');
      const res = await fetch(`${CTA_URL}?key=${CTA_KEY}&${rtParam}&outputType=JSON`);
      if (!res.ok) return;
      const json = await res.json();
      const positions = json?.ctatt?.route ?? [];
      const result: CTATrain[] = [];
      for (const route of positions) {
        const routeName = route['@name'];
        for (const train of (Array.isArray(route.train) ? route.train : [route.train] ?? [])) {
          if (!train) continue;
          result.push({
            run: train.rn,
            route: routeName,
            lat: parseFloat(train.lat),
            lng: parseFloat(train.lon),
            heading: parseInt(train.heading ?? '0'),
            nextStation: train.nextStaNm ?? '',
            color: CTA_LINE_COLORS[routeName] ?? '#888',
          });
        }
      }
      setTrains(result);
    } catch {
      // silently fail -- CTA API is unreliable
    }
  }

  return trains;
}
