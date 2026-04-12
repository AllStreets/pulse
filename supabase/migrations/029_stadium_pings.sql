-- Stadium pings: I'm Here button for sports venues
-- Not linked to location_pings (stadiums are not in the venues table)

CREATE TABLE IF NOT EXISTS stadium_pings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stadium_id  text NOT NULL,
  user_id     uuid REFERENCES auth.users ON DELETE SET NULL,
  pinged_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stadium_pings_stadium_id ON stadium_pings(stadium_id);
CREATE INDEX idx_stadium_pings_pinged_at  ON stadium_pings(pinged_at);

-- RLS: anyone can read counts; authenticated users can insert their own pings
ALTER TABLE stadium_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stadium_pings_select" ON stadium_pings
  FOR SELECT USING (true);

CREATE POLICY "stadium_pings_insert" ON stadium_pings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
