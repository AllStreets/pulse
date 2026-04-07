-- Migration 012: Add public SELECT policy for location_pings
-- Heatmap needs to read pings anonymously

CREATE POLICY "location_pings_select" ON location_pings
  FOR SELECT
  USING (true);
