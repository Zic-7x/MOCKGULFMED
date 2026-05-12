-- Self booking after Freemius checkout completion.
-- Enforces min date server-side and stores payment reference.

CREATE OR REPLACE FUNCTION book_external_exam_paid(
  p_exam_date DATE,
  p_applicant_address TEXT,
  p_applicant_national_id TEXT,
  p_health_authority_country TEXT,
  p_health_authority_id UUID,
  p_external_ref TEXT
)
RETURNS public.user_external_exam_details
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID;
  v_min_date DATE;
  v_full_name TEXT;
  v_health_authority_name TEXT;
  v_row public.user_external_exam_details;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_min_date := (date_trunc('month', now()) + interval '2 months')::date;
  IF p_exam_date IS NULL OR p_exam_date < v_min_date THEN
    RAISE EXCEPTION 'Exam date must be on or after %', v_min_date;
  END IF;

  IF p_applicant_address IS NULL OR btrim(p_applicant_address) = '' THEN
    RAISE EXCEPTION 'Applicant address is required';
  END IF;

  IF p_applicant_national_id IS NULL OR btrim(p_applicant_national_id) = '' THEN
    RAISE EXCEPTION 'CNIC/National ID is required';
  END IF;

  IF p_health_authority_country IS NULL OR btrim(p_health_authority_country) = '' THEN
    RAISE EXCEPTION 'Health authority country is required';
  END IF;

  IF p_health_authority_id IS NULL THEN
    RAISE EXCEPTION 'Health authority is required';
  END IF;

  SELECT ha.name INTO v_health_authority_name
  FROM public.health_authorities ha
  WHERE ha.id = p_health_authority_id
    AND ha.country = p_health_authority_country;

  IF v_health_authority_name IS NULL OR btrim(v_health_authority_name) = '' THEN
    RAISE EXCEPTION 'Invalid health authority selection';
  END IF;

  SELECT up.full_name INTO v_full_name
  FROM public.user_profiles up
  WHERE up.id = v_uid;

  INSERT INTO public.user_external_exam_details (
    user_id,
    section_enabled,
    applicant_name,
    applicant_address,
    applicant_national_id,
    booking_health_authority_country,
    booking_health_authority_id,
    exam_health_authority,
    exam_date,
    booking_payment_status,
    booking_payment_external_ref,
    booking_paid_at,
    updated_by
  )
  VALUES (
    v_uid,
    true,
    v_full_name,
    p_applicant_address,
    p_applicant_national_id,
    p_health_authority_country,
    p_health_authority_id,
    v_health_authority_name,
    p_exam_date,
    'PAID',
    NULLIF(btrim(COALESCE(p_external_ref, '')), ''),
    NOW(),
    v_uid
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    section_enabled = true,
    applicant_name = EXCLUDED.applicant_name,
    applicant_address = EXCLUDED.applicant_address,
    applicant_national_id = EXCLUDED.applicant_national_id,
    booking_health_authority_country = EXCLUDED.booking_health_authority_country,
    booking_health_authority_id = EXCLUDED.booking_health_authority_id,
    exam_health_authority = EXCLUDED.exam_health_authority,
    exam_date = EXCLUDED.exam_date,
    booking_payment_status = EXCLUDED.booking_payment_status,
    booking_payment_external_ref = COALESCE(EXCLUDED.booking_payment_external_ref, user_external_exam_details.booking_payment_external_ref),
    booking_paid_at = COALESCE(EXCLUDED.booking_paid_at, user_external_exam_details.booking_paid_at),
    updated_by = EXCLUDED.updated_by
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION book_external_exam_paid(DATE, TEXT, TEXT, TEXT, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION book_external_exam_paid(DATE, TEXT, TEXT, TEXT, UUID, TEXT) TO authenticated;

