export type CredentialBadge = 'casual' | 'regular' | 'local' | 'legend';
export type PredictionOutcome = 'pending' | 'correct' | 'incorrect' | 'voided';
export type TimeWindow = 'tonight' | 'weekend' | 'event';
export type TargetType = 'venue' | 'neighborhood';
export type KnowledgeType = 'vibe_tag' | 'insider_tip' | 'scene_description' | 'history';

export interface City {
  id: string;
  name: string;
  slug: string;
  center: { lat: number; lng: number };
}

export interface Neighborhood {
  id: string;
  city_id: string;
  name: string;
  slug: string;
  scene_description: string | null;
  history: string | null;
  best_for: string | null;
}

export interface Venue {
  id: string;
  neighborhood_id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  category: string;
  cover: string | null;
  age_policy: string | null;
  music_genre: string | null;
  dress_code: string | null;
  current_heat_score: number;
  phone: string | null;
  hours: Record<string, string> | null;
}

export interface VenueHeatHistory {
  venue_id: string;
  day_of_week: number;   // 0 = Sunday
  hour_bucket: number;   // 0 = 12am-2am, 1 = 2am-4am ... 11 = 10pm-12am
  avg_heat: number;
  p75_heat: number;
  sample_count: number;
}

export interface Profile {
  id: string;
  username: string;
  heat_score: number;
  local_rep: number;
  credibility_badge: CredentialBadge;
  streak: number;
}

export interface Prediction {
  id: string;
  user_id: string;
  target_type: TargetType;
  target_id: string;
  time_window: TimeWindow;
  heat_at_call_time: number | null;
  outcome: PredictionOutcome;
  boldness_score: number | null;
  points_awarded: number | null;
  created_at: string;
  scored_at: string | null;
}

export interface HeatmapPoint {
  lng: number;
  lat: number;
  weight: number;  // normalized 0-1
}

export interface NeighborhoodMeta {
  id: string;
  name: string;
  slug: string;
  scene_description: string | null;
  best_for: string | null;
  vibe_tags: string[];
  bar_density: number;
  map_color: string;
  boundary: GeoJSON.Polygon | null;
  ping_count: number;
}

export interface CTATrain {
  run: string;
  route: string;
  lat: number;
  lng: number;
  heading: number;
  nextStation: string;
  color: string;
}

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
