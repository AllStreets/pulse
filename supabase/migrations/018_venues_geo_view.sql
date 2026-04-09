-- Expose venues with explicit lat/lng floats so client doesn't
-- have to parse WKB hex geometry strings from PostgREST.
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
  ST_Y(coordinates::geometry) AS lat,
  ST_X(coordinates::geometry) AS lng
FROM venues;

GRANT SELECT ON venues_geo TO anon, authenticated;
