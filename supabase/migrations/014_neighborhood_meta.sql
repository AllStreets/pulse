-- Add columns if they don't exist
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS vibe_tags text[] DEFAULT '{}';
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS bar_density integer DEFAULT 0;
ALTER TABLE neighborhoods ADD COLUMN IF NOT EXISTS map_color text DEFAULT '#3B82F6';

-- Populate the 6 Chicago neighborhoods
UPDATE neighborhoods SET vibe_tags = ARRAY['indie','artsy','late-night'], bar_density = 24, map_color = '#8B5CF6'
WHERE id = '22222222-0001-0000-0000-000000000001';

UPDATE neighborhoods SET vibe_tags = ARRAY['craft','creative','underground'], bar_density = 19, map_color = '#10B981'
WHERE id = '22222222-0002-0000-0000-000000000001';

UPDATE neighborhoods SET vibe_tags = ARRAY['upscale','club','rooftop'], bar_density = 38, map_color = '#3B82F6'
WHERE id = '22222222-0003-0000-0000-000000000001';

UPDATE neighborhoods SET vibe_tags = ARRAY['sports','dive','loud'], bar_density = 31, map_color = '#EF4444'
WHERE id = '22222222-0004-0000-0000-000000000001';

UPDATE neighborhoods SET vibe_tags = ARRAY['cultural','mezcal','laid-back'], bar_density = 14, map_color = '#F59E0B'
WHERE id = '22222222-0005-0000-0000-000000000001';

UPDATE neighborhoods SET vibe_tags = ARRAY['culinary','cocktails','expensive'], bar_density = 22, map_color = '#EC4899'
WHERE id = '22222222-0006-0000-0000-000000000001';

-- RPC to get neighborhoods with metadata (no boundary -- boundaries stored client-side)
CREATE OR REPLACE FUNCTION get_neighborhoods_meta(city_slug text DEFAULT 'chicago')
RETURNS TABLE(
  id uuid, name text, slug text, scene_description text, best_for text,
  vibe_tags text[], bar_density integer, map_color text
) AS $$
  SELECT n.id, n.name, n.slug, n.scene_description, n.best_for,
         n.vibe_tags, n.bar_density, n.map_color
  FROM neighborhoods n
  JOIN cities c ON c.id = n.city_id
  WHERE c.slug = city_slug
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION get_neighborhoods_meta(text) TO anon, authenticated;
