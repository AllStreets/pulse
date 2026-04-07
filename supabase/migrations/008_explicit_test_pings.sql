-- Explicit test pings with direct venue lookups
DO $$
DECLARE
  v RECORD;
  ping_count INT;
BEGIN
  FOR v IN SELECT id, neighborhood_id FROM venues LOOP
    ping_count := CASE
      WHEN v.id IN (SELECT id FROM venues WHERE name IN ('Subterranean','Berlin','The Owl','Spybar','Exit')) THEN 8
      WHEN v.id IN (SELECT id FROM venues WHERE name IN ('The Whistler','Scofflaw','Longman & Eagle','Emporium Wicker Park')) THEN 5
      ELSE 2
    END;
    
    INSERT INTO location_pings (venue_id, neighborhood_id, pinged_at)
    SELECT v.id, v.neighborhood_id, NOW() - (random() * INTERVAL '25 minutes')
    FROM generate_series(1, ping_count);
  END LOOP;
END $$;
