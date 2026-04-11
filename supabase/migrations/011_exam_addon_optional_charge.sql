-- Optional per-exam addon charge controls (admin-managed).
-- Existing exams remain unaffected because addon_enabled defaults to false.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'addon_enabled'
  ) THEN
    ALTER TABLE exams
      ADD COLUMN addon_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'addon_freemius_plan_id'
  ) THEN
    ALTER TABLE exams
      ADD COLUMN addon_freemius_plan_id VARCHAR(64);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'addon_price_display'
  ) THEN
    ALTER TABLE exams
      ADD COLUMN addon_price_display VARCHAR(64);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exams_addon_enabled ON exams(addon_enabled);
