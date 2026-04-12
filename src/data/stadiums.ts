export interface StadiumTeam {
  id: string;
  name: string;
  abbrev: string;
  sport: string;
  primaryColor: string;
  secondaryColor: string;
  /** URL for the team logo image */
  logoUrl: string;
  /** Pixel offset always applied to separate teams at shared stadiums.
   *  Positive x = right, positive y = down. */
  spreadOffset: { x: number; y: number };
}

export interface Stadium {
  id: string;
  name: string;
  shortName: string;
  coords: [number, number]; // [lng, lat]
  teams: StadiumTeam[];
}

export const STADIUMS: Stadium[] = [
  {
    id: 'wrigley',
    name: 'Wrigley Field',
    shortName: 'Wrigley Field',
    coords: [-87.6553, 41.9484],
    teams: [
      {
        id: 'cubs',
        name: 'Chicago Cubs',
        abbrev: 'C',
        sport: 'MLB',
        primaryColor: '#0E3386',
        secondaryColor: '#CC3433',
        logoUrl: 'https://a.espncdn.com/i/teamlogos/mlb/500/chc.png',
        spreadOffset: { x: 0, y: 0 },
      },
    ],
  },
  {
    id: 'guaranteed-rate',
    name: 'Guaranteed Rate Field',
    shortName: 'Guaranteed Rate',
    coords: [-87.6337, 41.8300],
    teams: [
      {
        id: 'white-sox',
        name: 'Chicago White Sox',
        abbrev: 'SOX',
        sport: 'MLB',
        primaryColor: '#27251F',
        secondaryColor: '#C4CED4',
        logoUrl: 'https://a.espncdn.com/i/teamlogos/mlb/500/chw.png',
        spreadOffset: { x: 0, y: 0 },
      },
    ],
  },
  {
    id: 'soldier-field',
    name: 'Soldier Field',
    shortName: 'Soldier Field',
    coords: [-87.6167, 41.8623],
    teams: [
      {
        id: 'bears',
        name: 'Chicago Bears',
        abbrev: 'C',
        sport: 'NFL',
        primaryColor: '#0B162A',
        secondaryColor: '#C83803',
        logoUrl: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png',
        spreadOffset: { x: 0, y: 0 },
      },
    ],
  },
  {
    id: 'united-center',
    name: 'United Center',
    shortName: 'United Center',
    coords: [-87.6742, 41.8807],
    teams: [
      {
        id: 'bulls',
        name: 'Chicago Bulls',
        abbrev: 'BULLS',
        sport: 'NBA',
        primaryColor: '#CE1141',
        secondaryColor: '#000000',
        logoUrl: 'https://a.espncdn.com/i/teamlogos/nba/500/chi.png',
        spreadOffset: { x: -24, y: 0 },
      },
      {
        id: 'blackhawks',
        name: 'Chicago Blackhawks',
        abbrev: 'HAWKS',
        sport: 'NHL',
        primaryColor: '#CF0A2C',
        secondaryColor: '#FF6720',
        logoUrl: 'https://a.espncdn.com/i/teamlogos/nhl/500/chi.png',
        spreadOffset: { x: 24, y: 0 },
      },
    ],
  },
  {
    id: 'wintrust-arena',
    name: 'Wintrust Arena',
    shortName: 'Wintrust Arena',
    coords: [-87.6200, 41.8756],
    teams: [
      {
        id: 'sky',
        name: 'Chicago Sky',
        abbrev: 'SKY',
        sport: 'WNBA',
        primaryColor: '#5091CD',
        secondaryColor: '#FFC72C',
        logoUrl: 'https://a.espncdn.com/i/teamlogos/wnba/500/chi.png',
        spreadOffset: { x: 0, y: 0 },
      },
    ],
  },
];

/** Flat list of every (stadium, team) pair for iteration */
export interface StadiumTeamEntry {
  stadiumId: string;
  stadiumName: string;
  stadiumShortName: string;
  stadiumCoords: [number, number];
  team: StadiumTeam;
}

export function allStadiumTeams(): StadiumTeamEntry[] {
  return STADIUMS.flatMap(s =>
    s.teams.map(t => ({
      stadiumId: s.id,
      stadiumName: s.name,
      stadiumShortName: s.shortName,
      stadiumCoords: s.coords,
      team: t,
    }))
  );
}
