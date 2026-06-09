-- Seed BTO data based on HDB 2026 launches
-- Feb 2026: 4,692 flats across 6 projects (already launched)
-- Jun 2026: includes Lakeview & Shunfu (first time in 40+ years for those areas)
-- Oct 2026: TBA — placeholder projects included
--
-- Coordinates approximate; production should run scripts/enrich-locations.ts
-- to get precise coords + nearest MRT + amenity counts from OneMap.

insert into public.bto_projects
  (launch, town, project_name, classification, lat, lng, unit_mix, swt)
values
  -- February 2026 (launched)
  ('Feb 2026', 'Ang Mo Kio',   'Ang Mo Kio Crest',        'Standard', 1.3691, 103.8454, '{"3-room": 80, "4-room": 240, "5-room": 120}'::jsonb, false),
  ('Feb 2026', 'Bukit Merah',  'Alexandra Peaks',         'Prime',    1.2853, 103.8198, '{"3-room": 100, "4-room": 280}'::jsonb, false),
  ('Feb 2026', 'Sembawang',    'Sembawang Beacon',        'Standard', 1.4491, 103.8185, '{"3-room": 60, "4-room": 320, "5-room": 220}'::jsonb, true),
  ('Feb 2026', 'Toa Payoh',    'Toa Payoh Ridge',         'Plus',     1.3343, 103.8563, '{"4-room": 200, "5-room": 140}'::jsonb, false),
  ('Feb 2026', 'Woodlands',    'Woodlands Glen',          'Standard', 1.4360, 103.7864, '{"3-room": 80, "4-room": 380, "5-room": 260}'::jsonb, true),
  ('Feb 2026', 'Yishun',       'Yishun Glades',           'Standard', 1.4296, 103.8350, '{"3-room": 70, "4-room": 290, "5-room": 180}'::jsonb, false),

  -- June 2026 (upcoming)
  ('Jun 2026', 'Jurong East',  'Lakeview Vista',          'Plus',     1.3414, 103.7311, '{"3-room": 90, "4-room": 260, "5-room": 150}'::jsonb, false),
  ('Jun 2026', 'Jurong East',  'Lakeview Heights',        'Plus',     1.3389, 103.7295, '{"4-room": 220, "5-room": 160}'::jsonb, false),
  ('Jun 2026', 'Bishan',       'Shunfu Greens',           'Prime',    1.3551, 103.8407, '{"3-room": 80, "4-room": 220}'::jsonb, false),
  ('Jun 2026', 'Tampines',     'Tampines North Vista',    'Standard', 1.3825, 103.9410, '{"3-room": 70, "4-room": 340, "5-room": 240}'::jsonb, true),
  ('Jun 2026', 'Punggol',      'Punggol Coast Edge',      'Standard', 1.4170, 103.9075, '{"4-room": 380, "5-room": 280}'::jsonb, true),
  ('Jun 2026', 'Queenstown',   'Queenstown Vue',          'Prime',    1.2945, 103.8055, '{"3-room": 120, "4-room": 200}'::jsonb, false),

  -- October 2026 (placeholders — refine when HDB publishes)
  ('Oct 2026', 'Hougang',      'Hougang Hillside',        'Standard', 1.3613, 103.8861, '{"3-room": 80, "4-room": 320, "5-room": 220}'::jsonb, false),
  ('Oct 2026', 'Sengkang',     'Sengkang Spring',         'Standard', 1.3917, 103.8954, '{"3-room": 60, "4-room": 360, "5-room": 240}'::jsonb, true),
  ('Oct 2026', 'Bukit Batok',  'Bukit Batok Brook',       'Plus',     1.3500, 103.7493, '{"4-room": 280, "5-room": 180}'::jsonb, false),
  ('Oct 2026', 'Kallang',      'Kallang Riverside',       'Prime',    1.3120, 103.8636, '{"3-room": 100, "4-room": 220}'::jsonb, false)
on conflict (launch, project_name) do nothing;
