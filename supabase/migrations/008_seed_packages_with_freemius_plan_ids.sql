-- Ensure packages contain Freemius mapping + active seeded rows for website catalog.
-- Run this in Supabase SQL editor after migrations 005-007.

-- 0) Backfill package display columns if migration 007 was not applied yet
ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_display VARCHAR(64);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_label VARCHAR(128);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS highlight BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 1) Add Freemius mapping column (used by frontend checkout integration)
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS freemius_plan_id VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_packages_freemius_plan_id
  ON packages(freemius_plan_id);

-- 2) Upsert the 3 commercial packages
INSERT INTO packages (
  name,
  description,
  price_display,
  duration_label,
  highlight,
  sort_order,
  features,
  freemius_plan_id,
  is_active
)
VALUES
  (
    'Basic Monthly',
    'Focused one-month access with a steady daily MCQ pace for revision.',
    '7,000 PKR',
    'One month access',
    false,
    10,
    '["Basic revision-style exam access","100 MCQs per day (when configured on your profile)"]'::jsonb,
    '45534',
    true
  ),
  (
    'Acing the Exam (3 Months)',
    'Extended preparation window with clinical-style practice and higher daily volume.',
    '15,000 PKR',
    '3 months access',
    true,
    20,
    '["Basic revision + clinical scenario exams","150 MCQs per day (when configured on your profile)"]'::jsonb,
    '45536',
    true
  ),
  (
    'Mastering the Exam Annual (12 Months)',
    'Full-year access including richer content tiers for deep preparation.',
    '25,000 PKR',
    '12 months access',
    false,
    30,
    '["Basic revision + clinical scenarios","Past examination data where available","300 MCQs per day (when configured on your profile)"]'::jsonb,
    '45537',
    true
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_display = EXCLUDED.price_display,
  duration_label = EXCLUDED.duration_label,
  highlight = EXCLUDED.highlight,
  sort_order = EXCLUDED.sort_order,
  features = EXCLUDED.features,
  freemius_plan_id = EXCLUDED.freemius_plan_id,
  is_active = EXCLUDED.is_active;

-- 3) Optional helper: attach all active exams to all 3 packages
INSERT INTO package_exams (package_id, exam_id)
SELECT p.id, e.id
FROM packages p
CROSS JOIN exams e
WHERE p.name IN ('Basic Monthly', 'Acing the Exam (3 Months)', 'Mastering the Exam Annual (12 Months)')
  AND p.is_active = true
  AND e.is_active = true
ON CONFLICT (package_id, exam_id) DO NOTHING;

-- 4) Quick verification (run after migration)
-- SELECT id, name, is_active, freemius_plan_id, price_display FROM packages ORDER BY sort_order, name;
