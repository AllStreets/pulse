-- Migration 013: Delete stale pings and re-seed fresh ones
-- (Migration 011's pings are now > 30 min old so heatmap was empty)

DELETE FROM location_pings;

-- Seed 5 fresh pings per venue, spread across last 20 minutes
INSERT INTO location_pings (venue_id, neighborhood_id, pinged_at)
SELECT
  v.id,
  v.neighborhood_id,
  NOW() - (random() * INTERVAL '20 minutes')
FROM venues v
CROSS JOIN generate_series(1, 5) gs(n);
