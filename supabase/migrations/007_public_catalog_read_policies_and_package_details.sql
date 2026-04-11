-- Public catalog: allow anonymous (and authenticated) read for registration / marketing pages.
-- Also extend packages with display fields used on Register + Packages pages.

-- 1) Package display fields (safe defaults for existing rows)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS price_display VARCHAR(64);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_label VARCHAR(128);
ALTER TABLE packages ADD COLUMN IF NOT EXISTS highlight BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2) RLS: public read for catalog tables used before login
DROP POLICY IF EXISTS "Public catalog can view professions" ON professions;
CREATE POLICY "Public catalog can view professions" ON professions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public catalog can view health authorities" ON health_authorities;
CREATE POLICY "Public catalog can view health authorities" ON health_authorities
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public catalog can view active packages" ON packages;
CREATE POLICY "Public catalog can view active packages" ON packages
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public catalog can view package_exams" ON package_exams;
CREATE POLICY "Public catalog can view package_exams" ON package_exams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM packages p
      WHERE p.id = package_exams.package_id AND p.is_active = true
    )
  );

-- Exam titles/types for exams linked to an active package (no question access via this path)
DROP POLICY IF EXISTS "Public catalog can view packaged exams" ON exams;
CREATE POLICY "Public catalog can view packaged exams" ON exams
  FOR SELECT USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM package_exams pe
      JOIN packages p ON p.id = pe.package_id AND p.is_active = true
      WHERE pe.exam_id = exams.id
    )
  );

-- 3) Seed default packages (idempotent by name) — link exams later in admin or via SQL
INSERT INTO packages (name, description, price_display, duration_label, highlight, sort_order, features, is_active)
VALUES
  (
    'Basic Monthly',
    'Focused one-month access with a steady daily MCQ pace for revision.',
    '7,000 PKR',
    'One month access',
    false,
    10,
    '["Basic revision-style exam access","100 MCQs per day (when configured on your profile)"]'::jsonb,
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
    true
  )
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price_display = EXCLUDED.price_display,
  duration_label = EXCLUDED.duration_label,
  highlight = EXCLUDED.highlight,
  sort_order = EXCLUDED.sort_order,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active;

-- Optional: attach all active exams to each seeded package (helps dropdowns show “what’s included”)
INSERT INTO package_exams (package_id, exam_id)
SELECT p.id, e.id
FROM packages p
CROSS JOIN exams e
WHERE p.name IN ('Basic Monthly', 'Acing the Exam (3 Months)', 'Mastering the Exam Annual (12 Months)')
  AND e.is_active = true
ON CONFLICT (package_id, exam_id) DO NOTHING;
