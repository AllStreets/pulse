-- Migration 011: Seed location pings for all venues
-- CHECK(true) policy allows unrestricted inserts

INSERT INTO location_pings (venue_id, neighborhood_id, pinged_at)
SELECT id, neighborhood_id, NOW() - (random() * INTERVAL '25 minutes')
FROM venues
CROSS JOIN generate_series(1, 5) gs(n);
