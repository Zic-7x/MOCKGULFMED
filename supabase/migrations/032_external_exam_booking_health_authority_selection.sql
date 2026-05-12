-- Applicant self-booking should capture Health Authority country and auto-selected authority.

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_health_authority_country TEXT;

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_health_authority_id UUID REFERENCES health_authorities(id) ON DELETE SET NULL;

COMMENT ON COLUMN user_external_exam_details.booking_health_authority_country IS
  'Country chosen by applicant during booking; used to auto-select health authority.';

COMMENT ON COLUMN user_external_exam_details.booking_health_authority_id IS
  'Health authority auto-selected from health_authorities for the chosen country.';

