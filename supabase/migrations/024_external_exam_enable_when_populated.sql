-- Applicants could not see exam details when admins entered data but left section_enabled false.
-- Turn on the profile section whenever any booking field is already populated.

UPDATE user_external_exam_details u
SET section_enabled = true
WHERE u.section_enabled = false
  AND (
    NULLIF(btrim(COALESCE(u.applicant_name, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.applicant_address, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.exam_health_authority, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.examination_authority, '')), '') IS NOT NULL
    OR u.exam_date IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.exam_time, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.exam_status, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.registration_id, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.candidate_eligibility_id, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.announcement, '')), '') IS NOT NULL
    OR NULLIF(btrim(COALESCE(u.exam_pass_storage_path, '')), '') IS NOT NULL
  );
