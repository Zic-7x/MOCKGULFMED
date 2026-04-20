-- Health authorities: display names include region/country; add GCC regulators.
-- Idempotent: skip rename if the target name already exists (avoids 23505 when seed + old row both exist).

UPDATE health_authorities ha
SET name = 'SCFHS (Saudi Arabia)', country = 'Saudi Arabia'
WHERE ha.name = 'Saudi Commission for Health Specialties'
  AND NOT EXISTS (SELECT 1 FROM health_authorities x WHERE x.name = 'SCFHS (Saudi Arabia)');

UPDATE health_authorities ha
SET name = 'DHA (Dubai)', country = 'United Arab Emirates'
WHERE ha.name = 'Dubai Health Authority'
  AND NOT EXISTS (SELECT 1 FROM health_authorities x WHERE x.name = 'DHA (Dubai)');

UPDATE health_authorities ha
SET name = 'DOH (Abu Dhabi)', country = 'United Arab Emirates'
WHERE ha.name = 'Abu Dhabi Department of Health'
  AND NOT EXISTS (SELECT 1 FROM health_authorities x WHERE x.name = 'DOH (Abu Dhabi)');

UPDATE health_authorities ha
SET name = 'QCHP (Qatar)', country = 'Qatar'
WHERE ha.name = 'Qatar Council for Healthcare Practitioners'
  AND NOT EXISTS (SELECT 1 FROM health_authorities x WHERE x.name = 'QCHP (Qatar)');

UPDATE health_authorities ha
SET name = 'MOH (Kuwait)', country = 'Kuwait'
WHERE ha.name = 'Kuwait Ministry of Health'
  AND NOT EXISTS (SELECT 1 FROM health_authorities x WHERE x.name = 'MOH (Kuwait)');

INSERT INTO health_authorities (name, country) VALUES
  ('MoHAP (UAE)', 'United Arab Emirates'),
  ('OMSB (Oman)', 'Oman'),
  ('NHRA (Bahrain)', 'Bahrain')
ON CONFLICT (name) DO NOTHING;

-- Eligibility assessments: snapshot profession + health authority (must match profile at insert)
ALTER TABLE eligibility_assessments
  ADD COLUMN IF NOT EXISTS profession_id UUID REFERENCES professions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS health_authority_id UUID REFERENCES health_authorities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_eligibility_assessments_profession ON eligibility_assessments(profession_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_assessments_health_authority ON eligibility_assessments(health_authority_id);

DROP POLICY IF EXISTS "Users insert own eligibility assessments" ON eligibility_assessments;

CREATE POLICY "Users insert own eligibility assessments"
  ON eligibility_assessments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND profession_id IS NOT DISTINCT FROM (
      SELECT p.profession_id FROM user_profiles p WHERE p.id = auth.uid()
    )
    AND health_authority_id IS NOT DISTINCT FROM (
      SELECT p.health_authority_id FROM user_profiles p WHERE p.id = auth.uid()
    )
  );

-- Allow non-admin users to update only profession + health authority on their own profile
CREATE OR REPLACE FUNCTION public.set_user_profession_and_health_authority(
  p_profession_id uuid,
  p_health_authority_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_profession_id IS NULL OR p_health_authority_id IS NULL THEN
    RAISE EXCEPTION 'Profession and health authority are required';
  END IF;

  UPDATE public.user_profiles
  SET
    profession_id = p_profession_id,
    health_authority_id = p_health_authority_id,
    updated_at = NOW()
  WHERE id = auth.uid()
    AND role = 'USER';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile could not be updated';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_profession_and_health_authority(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_user_profession_and_health_authority(uuid, uuid) TO authenticated;
