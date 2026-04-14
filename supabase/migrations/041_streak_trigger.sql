-- Increment streak and award 1 heat point on a user's first ping of the day (Chicago time).
-- Chicago = America/Chicago (UTC-5 CDT / UTC-6 CST); AT TIME ZONE handles DST automatically.

CREATE OR REPLACE FUNCTION trg_update_streak_on_ping()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id    uuid := NEW.user_id;
  v_today      date := (now() AT TIME ZONE 'America/Chicago')::date;
  v_yesterday  date := v_today - 1;
  v_ping_count integer;
  v_streak     integer;
  v_last_active date;
BEGIN
  -- Only fire for authenticated pings (anonymous pings have NULL user_id)
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count pings today (Chicago time) for this user, excluding the one just inserted
  SELECT COUNT(*) INTO v_ping_count
  FROM location_pings
  WHERE user_id = v_user_id
    AND (pinged_at AT TIME ZONE 'America/Chicago')::date = v_today
    AND id != NEW.id;

  -- Only act on the FIRST ping of the day
  IF v_ping_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Get current streak and last_active date
  SELECT streak, last_active INTO v_streak, v_last_active
  FROM profiles
  WHERE id = v_user_id;

  -- Increment or reset streak
  IF v_last_active = v_yesterday THEN
    v_streak := COALESCE(v_streak, 0) + 1;
  ELSIF v_last_active = v_today THEN
    -- Already counted today (shouldn't happen given the ping_count check, but be safe)
    RETURN NEW;
  ELSE
    -- Missed a day — reset to 1
    v_streak := 1;
  END IF;

  UPDATE profiles
  SET
    streak      = v_streak,
    last_active = v_today,
    heat_score  = heat_score + 1
  WHERE id = v_user_id;

  RETURN NEW;
END;
$$;

-- Add last_active column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active date;

DROP TRIGGER IF EXISTS after_ping_update_streak ON location_pings;
CREATE TRIGGER after_ping_update_streak
  AFTER INSERT ON location_pings
  FOR EACH ROW
  EXECUTE FUNCTION trg_update_streak_on_ping();
