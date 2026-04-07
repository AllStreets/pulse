create extension if not exists postgis;

-- Cities
create table cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  center geometry(point, 4326) not null,
  created_at timestamptz default now()
);

-- Neighborhoods
create table neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) not null,
  name text not null,
  slug text not null,
  boundary geometry(polygon, 4326),
  scene_description text,
  history text,
  best_for text,
  created_at timestamptz default now()
);

-- Venues
create table venues (
  id uuid primary key default gen_random_uuid(),
  neighborhood_id uuid references neighborhoods(id) not null,
  name text not null,
  coordinates geometry(point, 4326) not null,
  category text not null,
  cover text,
  age_policy text,
  music_genre text,
  dress_code text,
  current_heat_score numeric default 0,
  created_at timestamptz default now()
);

create index venues_coordinates_idx on venues using gist(coordinates);

-- Heat history (2-hour buckets by day of week)
create table venue_heat_history (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id) not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  hour_bucket smallint not null check (hour_bucket between 0 and 11),
  avg_heat numeric not null default 0,
  p75_heat numeric not null default 0,
  sample_count integer not null default 0,
  updated_at timestamptz default now(),
  unique(venue_id, day_of_week, hour_bucket)
);

-- Location pings (no user_id — anonymized)
create table location_pings (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid references venues(id),
  neighborhood_id uuid references neighborhoods(id) not null,
  pinged_at timestamptz default now()
);

create index location_pings_pinged_at_idx on location_pings(pinged_at desc);
create index location_pings_venue_idx on location_pings(venue_id, pinged_at desc);

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id),
  username text not null unique,
  heat_score numeric default 0,
  local_rep integer default 0,
  credibility_badge text default 'casual' check (credibility_badge in ('casual','regular','local','legend')),
  streak integer default 0,
  created_at timestamptz default now()
);

-- Follows
create table follows (
  follower_id uuid references profiles(id) not null,
  following_id uuid references profiles(id) not null,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Predictions
create table predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  target_type text not null check (target_type in ('venue','neighborhood')),
  target_id uuid not null,
  time_window text not null check (time_window in ('tonight','weekend','event')),
  heat_at_call_time numeric,
  outcome text default 'pending' check (outcome in ('pending','correct','incorrect','voided')),
  boldness_score numeric,
  points_awarded integer,
  created_at timestamptz default now(),
  scored_at timestamptz
);

create index predictions_pending_idx on predictions(outcome) where outcome = 'pending';

-- Local knowledge
create table local_knowledge (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) not null,
  target_type text not null check (target_type in ('venue','neighborhood')),
  target_id uuid not null,
  type text not null check (type in ('vibe_tag','insider_tip','scene_description','history')),
  content text not null,
  upvotes integer default 0,
  status text default 'pending' check (status in ('pending','published')),
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table predictions enable row level security;
alter table local_knowledge enable row level security;
alter table follows enable row level security;
alter table location_pings enable row level security;
alter table venues enable row level security;
alter table neighborhoods enable row level security;
alter table cities enable row level security;
alter table venue_heat_history enable row level security;

-- Public reads
create policy "cities_select" on cities for select using (true);
create policy "neighborhoods_select" on neighborhoods for select using (true);
create policy "venues_select" on venues for select using (true);
create policy "venue_heat_history_select" on venue_heat_history for select using (true);
create policy "profiles_select" on profiles for select using (true);
create policy "predictions_select" on predictions for select using (true);
create policy "follows_select" on follows for select using (true);

-- Auth-gated writes
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id);
create policy "predictions_insert" on predictions for insert with check (auth.uid() = user_id);
create policy "follows_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follows_delete" on follows for delete using (auth.uid() = follower_id);
create policy "pings_insert" on location_pings for insert with check (true);
create policy "local_knowledge_select" on local_knowledge for select using (status = 'published' or auth.uid() = author_id);
create policy "local_knowledge_insert" on local_knowledge for insert with check (auth.uid() = author_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
