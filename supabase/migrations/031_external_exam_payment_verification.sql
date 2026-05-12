ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_payment_verified BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_payment_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN user_external_exam_details.booking_payment_verified IS
  'True when a Freemius-signed webhook confirmed the payment reference.';

