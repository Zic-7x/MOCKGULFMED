ALTER TABLE user_external_exam_details
ADD COLUMN IF NOT EXISTS exam_pass_print_enabled BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN user_external_exam_details.exam_pass_print_enabled IS
  'When true, applicants can use Print exam details on their profile (name is historical).';
