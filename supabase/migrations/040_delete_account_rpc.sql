-- RPC callable by the authenticated user to delete their own account.
-- Cascades: predictions, location_pings, friendships, push_token, profile, then auth user.
-- auth.users deletion requires service_role — we use a security definer function.

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Null out venue_id on pings (FK nullable)
  UPDATE location_pings SET venue_id = NULL WHERE user_id = v_user_id;

  -- 2. Delete pings
  DELETE FROM location_pings WHERE user_id = v_user_id;

  -- 3. Delete predictions
  DELETE FROM predictions WHERE user_id = v_user_id;

  -- 4. Delete friendships (both directions)
  DELETE FROM friendships WHERE requester_id = v_user_id OR addressee_id = v_user_id;

  -- 5a. Delete follows (both directions)
  DELETE FROM follows WHERE follower_id = v_user_id OR following_id = v_user_id;

  -- 5b. Delete local knowledge entries
  DELETE FROM local_knowledge WHERE author_id = v_user_id;

  -- 6. Delete profile
  DELETE FROM profiles WHERE id = v_user_id;

  -- 7. Delete auth user (requires service-role security context via security definer)
  DELETE FROM auth.users WHERE id = v_user_id;
END;
$$;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
