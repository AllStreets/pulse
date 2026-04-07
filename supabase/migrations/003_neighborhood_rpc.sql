create or replace function get_neighborhood_for_point(lng float, lat float)
returns table(id uuid) language sql security definer
set search_path = public, pg_temp as $$
  select id from neighborhoods
  where ST_Contains(boundary, ST_SetSRID(ST_MakePoint(lng, lat), 4326))
  limit 1;
$$;
