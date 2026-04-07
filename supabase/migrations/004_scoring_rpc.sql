create or replace function increment_user_heat_score(user_id uuid, points integer)
returns void language sql security definer
set search_path = public, pg_temp as $$
  update profiles
  set heat_score = heat_score + points
  where id = user_id;
$$;
