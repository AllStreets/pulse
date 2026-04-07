-- Chicago city
insert into cities (id, name, slug, center) values
  ('11111111-0000-0000-0000-000000000001', 'Chicago', 'chicago',
   ST_SetSRID(ST_MakePoint(-87.6298, 41.8781), 4326));

-- 6 neighborhoods
insert into neighborhoods (id, city_id, name, slug, scene_description, history, best_for) values
  ('22222222-0001-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'Wicker Park', 'wicker-park',
   'Indie bars, vintage shops, and a music scene that mixes rock, hip-hop, and electronic. Younger crowd, locals-heavy.',
   'Once the heart of Chicago''s Polish and Ukrainian immigrant community, Wicker Park became the city''s bohemian epicenter in the 90s.',
   'Late nights Thurs–Sat, live music on weekends, best after midnight'),
  ('22222222-0002-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'Logan Square', 'logan-square',
   'Craft cocktail bars, underground venues, and Chicago''s most creative restaurant scene. Hip without trying.',
   'A working-class neighborhood that became Chicago''s coolest zip code in the 2010s. Still fighting gentrification.',
   'Weekend dinners, late-night bars, the boulevard scene in summer'),
  ('22222222-0003-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'River North', 'river-north',
   'High-end clubs, rooftop bars, and the city''s densest concentration of nightlife. Bridge-and-tunnel Fridays, upscale Saturdays.',
   'Warehouses turned galleries turned luxury condos. Chicago''s nightlife commercial district.',
   'Friday and Saturday nights, bottle service, dress to impress'),
  ('22222222-0004-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'Wrigleyville', 'wrigleyville',
   'Sports bars and dive bars clustered around Wrigley Field. Loud, chaotic, fun — peaks on Cubs game days.',
   'Built around Wrigley Field (1914), the neighborhood has been baseball and bars for over a century.',
   'Game days and nights, bar crawls, college crowd'),
  ('22222222-0005-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'Pilsen', 'pilsen',
   'Murals, mezcal bars, taco spots, and art galleries. Chicago''s Mexican-American cultural heart.',
   'Home to Chicago''s largest Mexican-American community since the 1960s. Now a mix of longtime residents and artists.',
   'Weekend afternoons, gallery nights, low-key bars'),
  ('22222222-0006-0000-0000-000000000001',
   '11111111-0000-0000-0000-000000000001',
   'West Loop', 'west-loop',
   'Michelin-starred restaurants on Restaurant Row, upscale cocktail bars, and the city''s most expensive night out.',
   'Former meatpacking district turned culinary destination. Randolph Street is now Chicago''s most-reviewed restaurant strip.',
   'Friday and Saturday dinners, late cocktails, 30+ crowd');

-- 5 venues per neighborhood (30 total)
insert into venues (neighborhood_id, name, coordinates, category, music_genre, age_policy) values
  -- Wicker Park (5)
  ('22222222-0001-0000-0000-000000000001', 'Wicker Park Inn Rooftop', ST_SetSRID(ST_MakePoint(-87.6818, 41.9087), 4326), 'bar', 'indie/alternative', '21+'),
  ('22222222-0001-0000-0000-000000000001', 'Subterranean', ST_SetSRID(ST_MakePoint(-87.6816, 41.9083), 4326), 'live music', 'indie/hip-hop', '18+'),
  ('22222222-0001-0000-0000-000000000001', 'Emporium Wicker Park', ST_SetSRID(ST_MakePoint(-87.6808, 41.9079), 4326), 'bar', 'mixed', '21+'),
  ('22222222-0001-0000-0000-000000000001', 'Piece Brewery', ST_SetSRID(ST_MakePoint(-87.6820, 41.9091), 4326), 'bar', 'rock', '21+'),
  ('22222222-0001-0000-0000-000000000001', 'Estelle''s', ST_SetSRID(ST_MakePoint(-87.6814, 41.9076), 4326), 'dive bar', 'mixed', '21+'),
  -- Logan Square (5)
  ('22222222-0002-0000-0000-000000000001', 'The Whistler', ST_SetSRID(ST_MakePoint(-87.7077, 41.9218), 4326), 'cocktail bar', 'jazz/electronic', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Scofflaw', ST_SetSRID(ST_MakePoint(-87.7073, 41.9222), 4326), 'cocktail bar', 'gin/jazz', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Cole''s Bar', ST_SetSRID(ST_MakePoint(-87.7081, 41.9215), 4326), 'dive bar', 'rock', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Longman & Eagle', ST_SetSRID(ST_MakePoint(-87.7085, 41.9220), 4326), 'gastropub', 'mixed', '21+'),
  ('22222222-0002-0000-0000-000000000001', 'Billy Sunday', ST_SetSRID(ST_MakePoint(-87.7069, 41.9214), 4326), 'cocktail bar', 'low-key', '21+'),
  -- River North (5)
  ('22222222-0003-0000-0000-000000000001', 'Sound-Bar', ST_SetSRID(ST_MakePoint(-87.6327, 41.8916), 4326), 'club', 'house/techno', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'Celeste', ST_SetSRID(ST_MakePoint(-87.6331, 41.8920), 4326), 'rooftop bar', 'top 40', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'ROOF on theWit', ST_SetSRID(ST_MakePoint(-87.6292, 41.8859), 4326), 'rooftop bar', 'mixed', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'Crescendo', ST_SetSRID(ST_MakePoint(-87.6340, 41.8912), 4326), 'club', 'hip-hop/R&B', '21+'),
  ('22222222-0003-0000-0000-000000000001', 'Fado Irish Pub', ST_SetSRID(ST_MakePoint(-87.6299, 41.8870), 4326), 'pub', 'live music', '21+'),
  -- Wrigleyville (5)
  ('22222222-0004-0000-0000-000000000001', 'Murphy''s Bleachers', ST_SetSRID(ST_MakePoint(-87.6559, 41.9483), 4326), 'sports bar', 'none', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Sluggers World Class Sports Bar', ST_SetSRID(ST_MakePoint(-87.6556, 41.9479), 4326), 'sports bar', 'none', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'The Cubby Bear', ST_SetSRID(ST_MakePoint(-87.6560, 41.9485), 4326), 'bar/venue', 'mixed', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Guthrie''s Tavern', ST_SetSRID(ST_MakePoint(-87.6553, 41.9476), 4326), 'dive bar', 'none', '21+'),
  ('22222222-0004-0000-0000-000000000001', 'Toons Bar & Grill', ST_SetSRID(ST_MakePoint(-87.6562, 41.9488), 4326), 'bar', 'mixed', '21+'),
  -- Pilsen (5)
  ('22222222-0005-0000-0000-000000000001', 'Simone''s', ST_SetSRID(ST_MakePoint(-87.6609, 41.8571), 4326), 'bar', 'indie', '21+'),
  ('22222222-0005-0000-0000-000000000001', 'Skylark', ST_SetSRID(ST_MakePoint(-87.6606, 41.8566), 4326), 'dive bar', 'mixed', '21+'),
  ('22222222-0005-0000-0000-000000000001', 'Maria''s Packaged Goods', ST_SetSRID(ST_MakePoint(-87.6613, 41.8574), 4326), 'bar', 'eclectic', '21+'),
  ('22222222-0005-0000-0000-000000000001', 'Thalia Hall', ST_SetSRID(ST_MakePoint(-87.6598, 41.8561), 4326), 'live music', 'varied', '18+'),
  ('22222222-0005-0000-0000-000000000001', 'Dusek''s Board & Beer', ST_SetSRID(ST_MakePoint(-87.6600, 41.8563), 4326), 'gastropub', 'low-key', '21+'),
  -- West Loop (5)
  ('22222222-0006-0000-0000-000000000001', 'The Aviary', ST_SetSRID(ST_MakePoint(-87.6494, 41.8832), 4326), 'cocktail bar', 'ambient', '21+'),
  ('22222222-0006-0000-0000-000000000001', 'CH Distillery', ST_SetSRID(ST_MakePoint(-87.6498, 41.8828), 4326), 'cocktail bar', 'jazz', '21+'),
  ('22222222-0006-0000-0000-000000000001', 'Lone Wolf', ST_SetSRID(ST_MakePoint(-87.6490, 41.8836), 4326), 'bar', 'rock', '21+'),
  ('22222222-0006-0000-0000-000000000001', 'Punch House', ST_SetSRID(ST_MakePoint(-87.6492, 41.8830), 4326), 'cocktail bar', 'low-key', '21+'),
  ('22222222-0006-0000-0000-000000000001', 'RM Champagne Salon', ST_SetSRID(ST_MakePoint(-87.6487, 41.8840), 4326), 'bar', 'ambient', '21+');
