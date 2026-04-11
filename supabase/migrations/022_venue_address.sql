-- Add address column to venues
ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS address text;

-- Seed addresses for existing Chicago venues
UPDATE venues SET address = '2011 W North Ave, Chicago, IL 60647'   WHERE name = 'Subterranean';
UPDATE venues SET address = '954 W Belmont Ave, Chicago, IL 60657'  WHERE name = 'Berlin';
UPDATE venues SET address = '1444 W Chicago Ave, Chicago, IL 60642' WHERE name = 'Beauty Bar';
UPDATE venues SET address = '2159 N Milwaukee Ave, Chicago, IL 60647' WHERE name = 'The Whistler';
UPDATE venues SET address = '3201 W Armitage Ave, Chicago, IL 60647' WHERE name = 'Scofflaw';
UPDATE venues SET address = '1551 W Division St, Chicago, IL 60642' WHERE name = 'Estelle''s';
UPDATE venues SET address = '2226 W Chicago Ave, Chicago, IL 60622' WHERE name = 'Empty Bottle';

-- Recreate venues_geo view to expose address
CREATE OR REPLACE VIEW venues_geo AS
SELECT
  id,
  neighborhood_id,
  name,
  category,
  cover,
  age_policy,
  music_genre,
  dress_code,
  current_heat_score,
  phone,
  hours,
  address,
  ST_Y(coordinates::geometry) AS lat,
  ST_X(coordinates::geometry) AS lng
FROM venues;

GRANT SELECT ON venues_geo TO anon, authenticated;
