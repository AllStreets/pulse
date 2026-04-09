-- Migration 015: Expand Chicago neighborhoods to full 13 + update colors
-- Run this in the Supabase SQL editor

-- ─── 1. Update colors for existing 6 neighborhoods to match design system ───

UPDATE neighborhoods SET map_color = '#8B5CF6'
  WHERE slug = 'wicker-park';

UPDATE neighborhoods SET map_color = '#F43F5E'
  WHERE slug = 'logan-square';

UPDATE neighborhoods SET map_color = '#F97316'
  WHERE slug = 'river-north';

UPDATE neighborhoods SET map_color = '#FBBF24'
  WHERE slug = 'wrigleyville';

UPDATE neighborhoods SET map_color = '#EF4444'
  WHERE slug = 'pilsen';

UPDATE neighborhoods SET map_color = '#00D4FF'
  WHERE slug = 'west-loop';

-- ─── 2. Insert 7 new neighborhoods ───

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0007-0000-0000-000000000001',
  c.id,
  'Streeterville',
  'streeterville',
  'High-rises, Navy Pier, and upscale hotel bars along the Magnificent Mile waterfront',
  'Rooftop bars, tourist nightlife, hotel lounges',
  ARRAY['upscale','rooftop','tourist','hotel-bar'],
  18,
  '#1E40AF'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#1E40AF';

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0008-0000-0000-000000000001',
  c.id,
  'Lincoln Park',
  'lincoln-park',
  'Young professionals and DePaul students fill the Sheffield and Clark St bar corridors',
  'Neighborhood bars, dive bars, live music',
  ARRAY['young-professional','neighborhood','dive','live-music'],
  29,
  '#EAB308'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#EAB308';

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0009-0000-0000-000000000001',
  c.id,
  'South Loop',
  'south-loop',
  'Museum Campus, Printer''s Row, and a growing bar scene for young residents near the lakefront',
  'Blues bars, rock venues, chill neighborhood spots',
  ARRAY['blues','rock','neighborhood','lakefront'],
  16,
  '#06B6D4'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#06B6D4';

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0010-0000-0000-000000000001',
  c.id,
  'Bucktown',
  'bucktown',
  'Transitional neighborhood between Wicker Park and Logan Square with indie bars and music venues',
  'Indie music, laid-back bars, creative crowd',
  ARRAY['indie','laid-back','creative','live-music'],
  21,
  '#84CC16'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#84CC16';

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0011-0000-0000-000000000001',
  c.id,
  'Andersonville',
  'andersonville',
  'Welcoming LGBTQ+ neighborhood with Swedish heritage, craft beer bars, and drag shows on Clark St',
  'LGBTQ+ nightlife, craft beer, drag shows',
  ARRAY['lgbtq','craft-beer','drag','community','welcoming'],
  23,
  '#10B981'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#10B981';

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0012-0000-0000-000000000001',
  c.id,
  'Hyde Park',
  'hyde-park',
  'University of Chicago neighborhood with classic campus bars and a quieter, intellectual nightlife scene',
  'Campus bars, jazz, low-key scenes',
  ARRAY['campus','jazz','intellectual','low-key'],
  11,
  '#6366F1'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#6366F1';

INSERT INTO neighborhoods (id, city_id, name, slug, scene_description, best_for, vibe_tags, bar_density, map_color)
SELECT
  '22222222-0013-0000-0000-000000000001',
  c.id,
  'Old Town',
  'old-town',
  'Wells St comedy and bar corridor anchored by Second City — classic Chicago nightlife since the 1960s',
  'Comedy bars, classic dive bars, Wells St crawl',
  ARRAY['comedy','classic','dive','historic'],
  26,
  '#EC4899'
FROM cities c WHERE c.slug = 'chicago'
ON CONFLICT (id) DO UPDATE SET map_color = '#EC4899';

-- ─── 3. Insert venues for each new neighborhood ───

-- Streeterville (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0007-0000-0000-000000000001', 'Drumbar', ST_SetSRID(ST_MakePoint(-87.6224, 41.8954), 4326), 'Rooftop Bar', 'Jazz', '21+', 72),
  (gen_random_uuid(), '22222222-0007-0000-0000-000000000001', 'The Signature Room Bar', ST_SetSRID(ST_MakePoint(-87.6234, 41.8977), 4326), 'Rooftop Bar', 'Ambient', '21+', 65),
  (gen_random_uuid(), '22222222-0007-0000-0000-000000000001', 'Billy Goat Tavern', ST_SetSRID(ST_MakePoint(-87.6267, 41.8887), 4326), 'Dive Bar', NULL, '21+', 48),
  (gen_random_uuid(), '22222222-0007-0000-0000-000000000001', 'BSQA Chicago', ST_SetSRID(ST_MakePoint(-87.6237, 41.8925), 4326), 'Cocktail Bar', 'House', '21+', 58),
  (gen_random_uuid(), '22222222-0007-0000-0000-000000000001', 'The Kerryman', ST_SetSRID(ST_MakePoint(-87.6255, 41.8895), 4326), 'Irish Pub', 'Live Music', '21+', 44);

-- Lincoln Park (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0008-0000-0000-000000000001', 'Delilah''s', ST_SetSRID(ST_MakePoint(-87.6472, 41.9159), 4326), 'Dive Bar', 'Rock', '21+', 80),
  (gen_random_uuid(), '22222222-0008-0000-0000-000000000001', 'Park & Field', ST_SetSRID(ST_MakePoint(-87.6438, 41.9267), 4326), 'Sports Bar', 'Hip-Hop', '21+', 55),
  (gen_random_uuid(), '22222222-0008-0000-0000-000000000001', 'Moe''s Cantina Lincoln Park', ST_SetSRID(ST_MakePoint(-87.6389, 41.9247), 4326), 'Tequila Bar', 'Latin', '21+', 62),
  (gen_random_uuid(), '22222222-0008-0000-0000-000000000001', 'Wrightwood Tap', ST_SetSRID(ST_MakePoint(-87.6512, 41.9234), 4326), 'Neighborhood Bar', NULL, '21+', 38),
  (gen_random_uuid(), '22222222-0008-0000-0000-000000000001', 'Benchmark Bar & Grill', ST_SetSRID(ST_MakePoint(-87.6481, 41.9213), 4326), 'Sports Bar', 'Top 40', '21+', 50);

-- South Loop (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0009-0000-0000-000000000001', 'Punch House', ST_SetSRID(ST_MakePoint(-87.6454, 41.8632), 4326), 'Cocktail Bar', 'Soul', '21+', 76),
  (gen_random_uuid(), '22222222-0009-0000-0000-000000000001', 'Buddy Guy''s Legends', ST_SetSRID(ST_MakePoint(-87.6323, 41.8699), 4326), 'Blues Bar', 'Blues', '21+', 84),
  (gen_random_uuid(), '22222222-0009-0000-0000-000000000001', 'Reggie''s Rock Club', ST_SetSRID(ST_MakePoint(-87.6298, 41.8668), 4326), 'Music Venue', 'Rock', '21+', 68),
  (gen_random_uuid(), '22222222-0009-0000-0000-000000000001', 'The Scout Waterhouse', ST_SetSRID(ST_MakePoint(-87.6321, 41.8690), 4326), 'Bar & Kitchen', 'Indie', '21+', 47),
  (gen_random_uuid(), '22222222-0009-0000-0000-000000000001', 'HopCat Chicago', ST_SetSRID(ST_MakePoint(-87.6334, 41.8715), 4326), 'Craft Beer Bar', NULL, '21+', 52);

-- Bucktown (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0010-0000-0000-000000000001', 'Lottie''s Pub', ST_SetSRID(ST_MakePoint(-87.6834, 41.9189), 4326), 'Neighborhood Bar', NULL, '21+', 59),
  (gen_random_uuid(), '22222222-0010-0000-0000-000000000001', 'The Charleston', ST_SetSRID(ST_MakePoint(-87.6812, 41.9172), 4326), 'Dive Bar', 'Indie', '21+', 46),
  (gen_random_uuid(), '22222222-0010-0000-0000-000000000001', 'Club Lucky', ST_SetSRID(ST_MakePoint(-87.6791, 41.9204), 4326), 'Cocktail Lounge', 'Swing', '21+', 53),
  (gen_random_uuid(), '22222222-0010-0000-0000-000000000001', 'Hideout', ST_SetSRID(ST_MakePoint(-87.6765, 41.9081), 4326), 'Music Venue', 'Alt Country', '21+', 71),
  (gen_random_uuid(), '22222222-0010-0000-0000-000000000001', 'Small Bar', ST_SetSRID(ST_MakePoint(-87.6856, 41.9225), 4326), 'Craft Beer Bar', 'Indie', '21+', 41);

-- Andersonville (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0011-0000-0000-000000000001', 'Simon''s Tavern', ST_SetSRID(ST_MakePoint(-87.6654, 41.9796), 4326), 'Dive Bar', NULL, '21+', 63),
  (gen_random_uuid(), '22222222-0011-0000-0000-000000000001', 'The Hopleaf', ST_SetSRID(ST_MakePoint(-87.6658, 41.9814), 4326), 'Craft Beer Bar', 'Jazz', '21+', 70),
  (gen_random_uuid(), '22222222-0011-0000-0000-000000000001', 'Big Chicks', ST_SetSRID(ST_MakePoint(-87.6629, 41.9843), 4326), 'LGBTQ+ Bar', 'Dance', '21+', 77),
  (gen_random_uuid(), '22222222-0011-0000-0000-000000000001', 'Hamburger Mary''s', ST_SetSRID(ST_MakePoint(-87.6641, 41.9782), 4326), 'Drag Bar', 'Pop', '21+', 82),
  (gen_random_uuid(), '22222222-0011-0000-0000-000000000001', 'Granville Anvil', ST_SetSRID(ST_MakePoint(-87.6649, 41.9831), 4326), 'LGBTQ+ Bar', 'House', '21+', 56);

-- Hyde Park (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0012-0000-0000-000000000001', 'Jimmy''s Woodlawn Tap', ST_SetSRID(ST_MakePoint(-87.5992, 41.7921), 4326), 'Dive Bar', NULL, '21+', 54),
  (gen_random_uuid(), '22222222-0012-0000-0000-000000000001', 'The Cove Chicago', ST_SetSRID(ST_MakePoint(-87.5981, 41.7897), 4326), 'Dive Bar', 'Blues', '21+', 42),
  (gen_random_uuid(), '22222222-0012-0000-0000-000000000001', 'Falcon Inn', ST_SetSRID(ST_MakePoint(-87.5997, 41.7934), 4326), 'Neighborhood Bar', NULL, '21+', 36),
  (gen_random_uuid(), '22222222-0012-0000-0000-000000000001', 'Harper Court Bar', ST_SetSRID(ST_MakePoint(-87.5963, 41.7944), 4326), 'Cocktail Bar', 'Jazz', '21+', 49),
  (gen_random_uuid(), '22222222-0012-0000-0000-000000000001', 'Medici on 57th', ST_SetSRID(ST_MakePoint(-87.5989, 41.7912), 4326), 'Bar & Grill', 'Indie', '21+', 38);

-- Old Town (5 venues)
INSERT INTO venues (id, neighborhood_id, name, coordinates, category, music_genre, age_policy, current_heat_score)
VALUES
  (gen_random_uuid(), '22222222-0013-0000-0000-000000000001', 'Old Town Ale House', ST_SetSRID(ST_MakePoint(-87.6366, 41.9176), 4326), 'Dive Bar', NULL, '21+', 73),
  (gen_random_uuid(), '22222222-0013-0000-0000-000000000001', 'Wells on Wells', ST_SetSRID(ST_MakePoint(-87.6349, 41.9172), 4326), 'Cocktail Bar', 'Jazz', '21+', 66),
  (gen_random_uuid(), '22222222-0013-0000-0000-000000000001', 'Spybar', ST_SetSRID(ST_MakePoint(-87.6321, 41.9020), 4326), 'Nightclub', 'House', '21+', 89),
  (gen_random_uuid(), '22222222-0013-0000-0000-000000000001', 'Stereo', ST_SetSRID(ST_MakePoint(-87.6309, 41.9028), 4326), 'Nightclub', 'Techno', '21+', 85),
  (gen_random_uuid(), '22222222-0013-0000-0000-000000000001', 'Second City Bar', ST_SetSRID(ST_MakePoint(-87.6370, 41.9180), 4326), 'Comedy Bar', 'Live Music', '21+', 61);
