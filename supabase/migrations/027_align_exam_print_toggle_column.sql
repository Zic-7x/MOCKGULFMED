-- Some projects applied an older 026 that renamed the column to exam_details_print_enabled.
-- App + migration 025 expect exam_pass_print_enabled. Safe to run if already canonical.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_external_exam_details'
      AND column_name = 'exam_details_print_enabled'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_external_exam_details'
      AND column_name = 'exam_pass_print_enabled'
  ) THEN
    ALTER TABLE user_external_exam_details
      RENAME COLUMN exam_details_print_enabled TO exam_pass_print_enabled;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_external_exam_details'
      AND column_name = 'exam_pass_print_enabled'
  ) THEN
    ALTER TABLE user_external_exam_details
      ADD COLUMN exam_pass_print_enabled BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN user_external_exam_details.exam_pass_print_enabled IS
  'When true, applicants can use Print exam details on their profile official exam section.';
