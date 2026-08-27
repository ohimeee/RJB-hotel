-- The Makati property, straight from the design mockups. Rates are in pesos,
-- before VAT — the guest side adds it at checkout.
--
-- Keyed on "number" so re-running refreshes rooms instead of duplicating them
-- or tripping the unique constraint.
--
-- Apply with:  npm run db:seed

INSERT INTO "Room" ("number", "name", "type", "capacity", "amenities", "description", "nightlyRate", "status")
VALUES
  ('402', 'The Garret Suite',  'SUITE',    2, ARRAY['King bed', 'Skylight', 'Free breakfast'],  'King bed | Top floor | Sleeps 2',            8900, 'OCCUPIED'),
  ('501', 'Atelier Suite',     'SUITE',    4, ARRAY['2 bedrooms', 'Kitchenette', 'Balcony'],    'Two bedrooms | Kitchenette | Sleeps 4',      10500, 'OCCUPIED'),
  ('201', 'Courtyard Deluxe',  'DELUXE',   2, ARRAY['Queen bed', 'Courtyard view', 'Minibar'],  'Queen bed | Courtyard view | Sleeps 2',      6400, 'AVAILABLE'),
  ('202', 'Courtyard Deluxe',  'DELUXE',   2, ARRAY['Queen bed', 'Courtyard view', 'Minibar'],  'Queen bed | Courtyard view | Sleeps 2',      6400, 'OCCUPIED'),
  ('305', 'Loft Deluxe',       'DELUXE',   3, ARRAY['King bed', 'Workspace', 'Free breakfast'], 'King bed | Loft workspace | Sleeps 3',       7100, 'OCCUPIED'),
  ('104', 'Harbor Standard',   'STANDARD', 2, ARRAY['Twin beds', 'City view'],                  'Twin beds | City view | Sleeps 2',           4200, 'AVAILABLE'),
  ('103', 'Archive Standard',  'STANDARD', 1, ARRAY['Single bed', 'Reading nook'],              'Single bed | Reading nook | Sleeps 1',       3600, 'AVAILABLE')
ON CONFLICT ("number") DO UPDATE SET
  "name"        = EXCLUDED."name",
  "type"        = EXCLUDED."type",
  "capacity"    = EXCLUDED."capacity",
  "amenities"   = EXCLUDED."amenities",
  "description" = EXCLUDED."description",
  "nightlyRate" = EXCLUDED."nightlyRate",
  "status"      = EXCLUDED."status";
