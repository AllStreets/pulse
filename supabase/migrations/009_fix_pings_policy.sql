-- Allow the postgres/service_role to insert pings (for seeding + edge functions)
DROP POLICY IF EXISTS "location_pings_insert" ON location_pings;

CREATE POLICY "location_pings_insert" ON location_pings 
  FOR INSERT 
  WITH CHECK (true);
