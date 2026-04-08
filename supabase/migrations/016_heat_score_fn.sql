-- Function to refresh heat scores from recent pings
create or replace function refresh_venue_heat_scores()
returns void language plpgsql security definer as $$
declare
  two_hours_ago timestamptz := now() - interval '2 hours';
begin
  with ping_counts as (
    select venue_id, count(*) as cnt
    from location_pings
    where pinged_at >= two_hours_ago
      and venue_id is not null
    group by venue_id
  ),
  max_val as (
    select greatest(coalesce(max(cnt), 1), 1) as m from ping_counts
  )
  update venues v
  set current_heat_score = case
    when pc.cnt is null then 0
    else round((pc.cnt::numeric / mv.m) * 100, 1)
  end
  from max_val mv
  left join ping_counts pc on pc.venue_id = v.id;
end;
$$;

-- Trigger function: refresh after each ping batch
create or replace function trg_refresh_heat_after_ping()
returns trigger language plpgsql security definer as $$
begin
  perform refresh_venue_heat_scores();
  return null;
end;
$$;

drop trigger if exists after_ping_refresh_heat on location_pings;
create trigger after_ping_refresh_heat
  after insert on location_pings
  for each statement
  execute function trg_refresh_heat_after_ping();

-- Grant execute to authenticated users
grant execute on function refresh_venue_heat_scores() to authenticated;
