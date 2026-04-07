-- Migration 010: Add 25+ more real Chicago venues

-- Boystown / Lakeview (use Wrigleyville neighborhood ID)
INSERT INTO venues (neighborhood_id, name, coordinates, category, music_genre, age_policy) VALUES
  ('22222222-0004-0000-0000-000000000001', 'Berlin', ST_SetSRID(ST_MakePoint(-87.6494, 41.9485), 4326), 'club', 'electronic/house', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Hydrate Nightclub', ST_SetSRID(ST_MakePoint(-87.6496, 41.9476), 4326), 'club', 'dance/pop', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Sidetrack', ST_SetSRID(ST_MakePoint(-87.6511, 41.9476), 4326), 'bar', 'video/dance', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Roscoe''s Tavern', ST_SetSRID(ST_MakePoint(-87.6476, 41.9475), 4326), 'bar', 'mixed', '21+'),

-- Lincoln Park (use Wrigleyville neighborhood ID)
  ('22222222-0004-0000-0000-000000000001', 'Kingston Mines', ST_SetSRID(ST_MakePoint(-87.6366, 41.9253), 4326), 'live music', 'blues', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Lincoln Hall', ST_SetSRID(ST_MakePoint(-87.6437, 41.9246), 4326), 'live music', 'indie/rock', '18+'),
  ('22222222-0004-0000-0000-000000000001', 'Delilah''s', ST_SetSRID(ST_MakePoint(-87.6454, 41.9245), 4326), 'dive bar', 'punk/metal', '21+'),

-- Uptown (use Wrigleyville neighborhood ID)
  ('22222222-0004-0000-0000-000000000001', 'Green Mill Cocktail Lounge', ST_SetSRID(ST_MakePoint(-87.6584, 41.9652), 4326), 'cocktail bar', 'jazz', '21+'),

-- Wicker Park additional
  ('22222222-0001-0000-0000-000000000001', 'The Violet Hour', ST_SetSRID(ST_MakePoint(-87.6826, 41.9091), 4326), 'cocktail bar', 'ambient', '21+'),
  ('22222222-0001-0000-0000-000000000001', 'Map Room', ST_SetSRID(ST_MakePoint(-87.6795, 41.9078), 4326), 'bar', 'eclectic', '21+'),
  ('22222222-0001-0000-0000-000000000001', 'Club Lucky', ST_SetSRID(ST_MakePoint(-87.6843, 41.9095), 4326), 'bar', 'lounge', '21+'),
  ('22222222-0001-0000-0000-000000000001', 'Empty Bottle', ST_SetSRID(ST_MakePoint(-87.6780, 41.9065), 4326), 'live music', 'indie/experimental', '21+'),

-- River North additional
  ('22222222-0003-0000-0000-000000000001', 'Three Dots and a Dash', ST_SetSRID(ST_MakePoint(-87.6358, 41.8930), 4326), 'cocktail bar', 'tiki/lounge', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'Spybar', ST_SetSRID(ST_MakePoint(-87.6362, 41.8905), 4326), 'club', 'techno/house', '21+'),

-- Pilsen additional
  ('22222222-0005-0000-0000-000000000001', 'Thalia Hall Punch House', ST_SetSRID(ST_MakePoint(-87.6572, 41.8546), 4326), 'cocktail bar', 'low-key', '21+'),
  ('22222222-0005-0000-0000-000000000001', 'Skylark Bar', ST_SetSRID(ST_MakePoint(-87.6554, 41.8528), 4326), 'dive bar', 'mixed', '21+'),

-- West Loop additional
  ('22222222-0006-0000-0000-000000000001', 'Moneygun', ST_SetSRID(ST_MakePoint(-87.6480, 41.8835), 4326), 'cocktail bar', 'electronic', '21+'),
  ('22222222-0006-0000-0000-000000000001', 'Soho House Chicago', ST_SetSRID(ST_MakePoint(-87.6472, 41.8842), 4326), 'bar', 'lounge', '21+'),
  ('22222222-0006-0000-0000-000000000001', 'Punch House', ST_SetSRID(ST_MakePoint(-87.6488, 41.8820), 4326), 'cocktail bar', 'low-key', '21+'),

-- Logan Square additional
  ('22222222-0002-0000-0000-000000000001', 'Whiner Beer Co', ST_SetSRID(ST_MakePoint(-87.7093, 41.9208), 4326), 'bar', 'none', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Revolution Brewing Tap Room', ST_SetSRID(ST_MakePoint(-87.7099, 41.9225), 4326), 'bar', 'mixed', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Boiler Room', ST_SetSRID(ST_MakePoint(-87.7082, 41.9229), 4326), 'dive bar', 'punk', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Quenchers Saloon', ST_SetSRID(ST_MakePoint(-87.7066, 41.9240), 4326), 'bar', 'rock', '21+'),

-- River North more
  ('22222222-0003-0000-0000-000000000001', 'Gilt Bar', ST_SetSRID(ST_MakePoint(-87.6350, 41.8925), 4326), 'cocktail bar', 'jazz', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'IO Chicago', ST_SetSRID(ST_MakePoint(-87.6348, 41.8918), 4326), 'bar', 'mixed', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'Howl at the Moon', ST_SetSRID(ST_MakePoint(-87.6344, 41.8910), 4326), 'bar', 'rock/pop', '21+');
