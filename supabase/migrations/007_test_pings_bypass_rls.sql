-- Bypass RLS to insert test pings as superuser
ALTER TABLE location_pings DISABLE ROW LEVEL SECURITY;

INSERT INTO location_pings (venue_id, neighborhood_id, pinged_at)
SELECT 
  v.id,
  v.neighborhood_id,
  NOW() - (random() * INTERVAL '20 minutes')
FROM venues v
CROSS JOIN generate_series(1, 
  CASE 
    WHEN v.name IN ('Subterranean', 'Berlin', 'Beauty Bar', 'Spybar', 'Exit') THEN 8
    WHEN v.name IN ('The Whistler', 'Scofflaw', 'Longman & Eagle', 'Emporium Wicker Park') THEN 5
    ELSE 2
  END
) gs(n);

ALTER TABLE location_pings ENABLE ROW LEVEL SECURITY;
