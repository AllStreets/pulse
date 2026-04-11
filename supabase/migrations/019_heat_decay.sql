-- Heat score with exponential decay: half-life of 30 minutes
-- weight = exp(-age_minutes * ln(2) / 30)
-- Fresh ping (0 min) = 1.0, 30 min = 0.5, 60 min = 0.25, 120 min = 0.0625

create or replace function refresh_venue_heat_scores()
returns void language plpgsql security definer as $$
declare
  two_hours_ago timestamptz := now() - interval '2 hours';
begin
  with decay_scores as (
    select
      venue_id,
      sum(
        exp(
          -extract(epoch from (now() - pinged_at)) / 60.0
          * ln(2.0) / 30.0
        )
      ) as weighted_score
    from location_pings
    where pinged_at >= two_hours_ago
      and venue_id is not null
    group by venue_id
  ),
  max_val as (
    select greatest(max(weighted_score), 0.001) as m from decay_scores
  )
  update venues v
  set current_heat_score = case
    when ds.weighted_score is null then greatest(v.current_heat_score * 0.7, 0)
    else round((ds.weighted_score::numeric / mv.m) * 100, 1)
  end
  from max_val mv
  left join decay_scores ds on ds.venue_id = v.id;

  -- Zero out venues with no recent pings that still show heat
  update venues
  set current_heat_score = 0
  where current_heat_score > 0
    and id not in (
      select distinct venue_id from location_pings
      where pinged_at >= two_hours_ago and venue_id is not null
    );
end;
$$;

-- Trigger function stays the same
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

grant execute on function refresh_venue_heat_scores() to authenticated;
