-- Insert test location pings across several venues to make heatmap visible
-- Using real venue IDs from the seeded data, within last 25 minutes

INSERT INTO location_pings (venue_id, neighborhood_id, pinged_at)
SELECT 
  v.id,
  v.neighborhood_id,
  NOW() - (random() * INTERVAL '25 minutes')
FROM venues v
CROSS JOIN generate_series(1, 
  CASE 
    WHEN v.name IN ('Subterranean', 'Berlin', 'Beauty Bar', 'Spybar') THEN 8
    WHEN v.name IN ('The Whistler', 'Scofflaw', 'Longman & Eagle', 'Emporium Wicker Park') THEN 5
    ELSE 2
  END
) gs;
