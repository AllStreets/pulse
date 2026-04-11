import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export interface ChicagoGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  venueName: string;
  startTime: string;
  status: 'pre' | 'in' | 'post';
  homeScore: number;
  awayScore: number;
  chicagoTeam: string;
  chicagoIsHome: boolean;
  venueLat: number;
  venueLng: number;
}

const CHICAGO_TEAMS: Record<string, { abbr: string; name: string; lat: number; lng: number }[]> = {
  'baseball/mlb': [
    { abbr: 'CHC', name: 'Cubs', lat: 41.9484, lng: -87.6553 },
    { abbr: 'CWS', name: 'White Sox', lat: 41.8299, lng: -87.6338 },
  ],
  'basketball/nba': [
    { abbr: 'CHI', name: 'Bulls', lat: 41.8807, lng: -87.6742 },
  ],
  'football/nfl': [
    { abbr: 'CHI', name: 'Bears', lat: 41.8623, lng: -87.6167 },
  ],
  'hockey/nhl': [
    { abbr: 'CHI', name: 'Blackhawks', lat: 41.8807, lng: -87.6742 },
  ],
};

function todayDateStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function useSportsTonight() {
  const [games, setGames] = useState<ChicagoGame[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchedDate = useRef<string>('');
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchGames();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      clearLivePoll();
    };
  }, []);

  function handleAppStateChange(state: AppStateStatus) {
    if (state === 'active' && todayKey() !== lastFetchedDate.current) {
      fetchGames();
    }
  }

  function clearLivePoll() {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }

  function startLivePoll() {
    clearLivePoll();
    pollInterval.current = setInterval(() => {
      fetchGames();
    }, 30000);
  }

  async function fetchGames() {
    const date = todayDateStr();
    const leagues = Object.keys(CHICAGO_TEAMS);
    const results: ChicagoGame[] = [];

    await Promise.all(leagues.map(async (league) => {
      try {
        const res = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/${league}/scoreboard?dates=${date}&limit=20`
        );
        if (!res.ok) return;
        const json = await res.json();
        const events = json?.events ?? [];
        const chicagoTeams = CHICAGO_TEAMS[league];

        for (const event of events) {
          const comp = event.competitions?.[0];
          if (!comp) continue;
          const competitors = comp.competitors ?? [];
          const home = competitors.find((c: any) => c.homeAway === 'home');
          const away = competitors.find((c: any) => c.homeAway === 'away');
          if (!home || !away) continue;

          const homeAbbr = home.team?.abbreviation ?? '';
          const awayAbbr = away.team?.abbreviation ?? '';
          const chicagoTeamInfo = chicagoTeams.find(t => t.abbr === homeAbbr || t.abbr === awayAbbr);
          if (!chicagoTeamInfo) continue;

          const isHome = chicagoTeamInfo.abbr === homeAbbr;
          const statusType = event.status?.type?.state ?? 'pre';
          const status: 'pre' | 'in' | 'post' = statusType === 'in' ? 'in' : statusType === 'post' ? 'post' : 'pre';

          results.push({
            id: event.id,
            sport: league.split('/')[0],
            league: league.split('/')[1].toUpperCase(),
            homeTeam: home.team?.displayName ?? homeAbbr,
            awayTeam: away.team?.displayName ?? awayAbbr,
            venueName: comp.venue?.fullName ?? '',
            startTime: event.date ?? '',
            status,
            homeScore: parseInt(home.score ?? '0') || 0,
            awayScore: parseInt(away.score ?? '0') || 0,
            chicagoTeam: chicagoTeamInfo.name,
            chicagoIsHome: isHome,
            venueLat: chicagoTeamInfo.lat,
            venueLng: chicagoTeamInfo.lng,
          });
        }
      } catch {
        // silently fail per sport
      }
    }));

    lastFetchedDate.current = todayKey();
    setGames(results);
    setLoading(false);

    const anyLive = results.some(g => g.status === 'in');
    if (anyLive) {
      startLivePoll();
    } else {
      clearLivePoll();
    }
  }

  return { games, loading };
}
