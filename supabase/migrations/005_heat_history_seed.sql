-- Seed venue_heat_history with realistic weekly patterns for all 30 venues
-- hour_bucket: 0=midnight-2am, 1=2am-4am, ..., 11=10pm-midnight
-- day_of_week: 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday

INSERT INTO venue_heat_history (venue_id, day_of_week, hour_bucket, avg_heat, p75_heat, sample_count)
SELECT
  v.id,
  d.day,
  h.bucket,
  ROUND(LEAST(1.0, base_heat * day_mult)::numeric, 3),
  ROUND(LEAST(1.0, base_heat * day_mult * 1.3)::numeric, 3),
  (20 + FLOOR(RANDOM() * 30))::int
FROM venues v
CROSS JOIN (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d(day)
CROSS JOIN (
  VALUES
    (0,  0.70),  -- midnight-2am: late night high
    (1,  0.30),  -- 2am-4am: dying down
    (2,  0.05),  -- 4am-6am: dead
    (3,  0.02),  -- 6am-8am: dead
    (4,  0.03),  -- 8am-10am: dead
    (5,  0.05),  -- 10am-noon: dead
    (6,  0.10),  -- noon-2pm: mild
    (7,  0.12),  -- 2pm-4pm: mild afternoon
    (8,  0.20),  -- 4pm-6pm: happy hour starts
    (9,  0.45),  -- 6pm-8pm: happy hour peak
    (10, 0.75),  -- 8pm-10pm: evening rush
    (11, 0.90)   -- 10pm-midnight: prime time
) AS h(bucket, base_heat)
CROSS JOIN (
  VALUES
    (0, 0.50),  -- Sunday
    (1, 0.50),  -- Monday
    (2, 0.50),  -- Tuesday
    (3, 0.60),  -- Wednesday
    (4, 0.70),  -- Thursday
    (5, 1.00),  -- Friday
    (6, 1.00)   -- Saturday
) AS dm(dm_day, day_mult)
WHERE d.day = dm.dm_day
ON CONFLICT DO NOTHING;

-- Also seed a few test location_pings to make the heatmap visible
INSERT INTO location_pings (venue_id, neighborhood_id, pinged_at)
SELECT
  v.id,
  v.neighborhood_id,
  NOW() - (RANDOM() * INTERVAL '25 minutes')
FROM venues v
  JOIN (VALUES
    ('Subterranean'),
    ('Berlin'),
    ('The Owl'),
    ('Myopic Books'),
    ('Slippery Slope')
  ) AS test_venues(name) ON v.name = test_venues.name;
