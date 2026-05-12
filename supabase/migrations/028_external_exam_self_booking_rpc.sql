-- Allow applicants to self-book an official exam date (2+ months ahead) and enter their address.
-- Admin still fills the remaining details later.

CREATE OR REPLACE FUNCTION book_external_exam(
  p_exam_date DATE,
  p_applicant_address TEXT
)
RETURNS public.user_external_exam_details
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_uid UUID;
  v_min_date DATE;
  v_full_name TEXT;
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

  SELECT up.full_name INTO v_full_name
  FROM public.user_profiles up
  WHERE up.id = v_uid;

  INSERT INTO public.user_external_exam_details (
    user_id,
    section_enabled,
    applicant_name,
    applicant_address,
    exam_date,
    updated_by
  )
  VALUES (
    v_uid,
    true,
    v_full_name,
    p_applicant_address,
    p_exam_date,
    v_uid
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    section_enabled = true,
    applicant_name = EXCLUDED.applicant_name,
    applicant_address = EXCLUDED.applicant_address,
    exam_date = EXCLUDED.exam_date,
    updated_by = EXCLUDED.updated_by
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION book_external_exam(DATE, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION book_external_exam(DATE, TEXT) TO authenticated;

