-- Extend official exam booking details with applicant national ID and booking payment metadata.

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS applicant_national_id TEXT;

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_payment_status TEXT;

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_payment_external_ref TEXT;

ALTER TABLE user_external_exam_details
  ADD COLUMN IF NOT EXISTS booking_paid_at TIMESTAMPTZ;

COMMENT ON COLUMN user_external_exam_details.applicant_national_id IS
  'Applicant CNIC/National ID entered during self booking.';

COMMENT ON COLUMN user_external_exam_details.booking_payment_status IS
  'Payment status for the booking (e.g. PAID).';

