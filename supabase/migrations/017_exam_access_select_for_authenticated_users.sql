-- Allow authenticated users to read exam_access rows that determine their own visibility.
-- Without this, only admins satisfy "Admins can view exam_access" (002), so nested EXISTS
-- checks in exams/questions policies and client-side bulk fetches see inconsistent results.

DROP POLICY IF EXISTS "Users can read own exam_access rules" ON exam_access;

CREATE POLICY "Users can read own exam_access rules" ON exam_access
  FOR SELECT USING (
    auth.role() = 'authenticated'
    AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = auth.uid()
        AND (
          (
            exam_access.profession_id IS NOT NULL
            AND exam_access.profession_id = up.profession_id
            AND (
              exam_access.health_authority_id IS NULL
              OR exam_access.health_authority_id = up.health_authority_id
            )
          )
          OR (
            exam_access.profession_id IS NULL
            AND exam_access.health_authority_id IS NOT NULL
            AND exam_access.health_authority_id = up.health_authority_id
          )
        )
    )
    )
  );
