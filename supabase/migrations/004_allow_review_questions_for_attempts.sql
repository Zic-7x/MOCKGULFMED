-- Allow users to review answered MCQs for exams they have previously attempted,
-- even if their current exam_access/profession/health_authority has changed.

-- QUESTIONS: extend SELECT policy to also allow access when the user has an attempt for the exam
DROP POLICY IF EXISTS "Users can view accessible exam questions" ON questions;
CREATE POLICY "Users can view accessible exam questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = questions.exam_id
      AND (
        -- Admins can view everything
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
        -- Users can view questions for exams they have access to (current access)
        OR EXISTS (
          SELECT 1 FROM exam_access ea
          JOIN user_profiles up ON up.id = auth.uid()
          WHERE ea.exam_id = e.id
          AND (
            ea.user_id = auth.uid()
            OR (ea.profession_id IS NOT NULL AND ea.profession_id = up.profession_id AND ea.health_authority_id IS NULL)
            OR (ea.health_authority_id IS NOT NULL AND ea.health_authority_id = up.health_authority_id AND ea.profession_id IS NULL)
            OR (ea.profession_id IS NOT NULL AND ea.profession_id = up.profession_id
                AND ea.health_authority_id IS NOT NULL AND ea.health_authority_id = up.health_authority_id)
          )
        )
        -- Users can always review questions for exams they've already attempted
        OR EXISTS (
          SELECT 1 FROM exam_attempts a
          WHERE a.user_id = auth.uid()
            AND a.exam_id = questions.exam_id
        )
      )
    )
  );

-- EXAMS: extend SELECT policy similarly so attempt review can still read exam title/type
DROP POLICY IF EXISTS "Users can view accessible exams" ON exams;
CREATE POLICY "Users can view accessible exams" ON exams
  FOR SELECT USING (
    is_active = true AND (
      -- Admins can view all active exams
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
      -- Users can view exams they currently have access to
      OR EXISTS (
        SELECT 1 FROM exam_access ea
        JOIN user_profiles up ON up.id = auth.uid()
        WHERE ea.exam_id = exams.id
        AND (
          ea.user_id = auth.uid()
          OR (ea.profession_id IS NOT NULL AND ea.profession_id = up.profession_id AND ea.health_authority_id IS NULL)
          OR (ea.health_authority_id IS NOT NULL AND ea.health_authority_id = up.health_authority_id AND ea.profession_id IS NULL)
          OR (ea.profession_id IS NOT NULL AND ea.profession_id = up.profession_id
              AND ea.health_authority_id IS NOT NULL AND ea.health_authority_id = up.health_authority_id)
        )
      )
      -- Users can view exams they've already attempted (for results/review)
      OR EXISTS (
        SELECT 1 FROM exam_attempts a
        WHERE a.user_id = auth.uid()
          AND a.exam_id = exams.id
      )
    )
  );

