import { useEffect, useState } from 'react';

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
  // Approximate venue coordinates for context
  venueLat: number;
  venueLng: number;
}

// Chicago team abbreviations by ESPN sport/league
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

export function useSportsTonight() {
  const [games, setGames] = useState<ChicagoGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

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

    setGames(results);
    setLoading(false);
  }

  return { games, loading };
}
