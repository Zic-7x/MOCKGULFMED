-- Enforce profession-based exam visibility in RLS.
-- Non-admin users can only access exams when:
-- 1) they have a direct user grant, OR
-- 2) the grant profession matches their profession (and optional authority matches).
-- This prevents health-authority-only grants from exposing exams across professions.

-- EXAMS
DROP POLICY IF EXISTS "Users can view accessible exams" ON exams;
CREATE POLICY "Users can view accessible exams" ON exams
  FOR SELECT USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
      OR EXISTS (
        SELECT 1 FROM exam_attempts a
        WHERE a.user_id = auth.uid()
          AND a.exam_id = exams.id
      )
      OR (
        exams.requires_payment = true
        AND EXISTS (
          SELECT 1 FROM exam_access ea
          WHERE ea.exam_id = exams.id
            AND ea.user_id = auth.uid()
        )
      )
      OR (
        exams.requires_payment = false
        AND EXISTS (
          SELECT 1
          FROM exam_access ea
          JOIN user_profiles up ON up.id = auth.uid()
          WHERE ea.exam_id = exams.id
            AND (
              ea.user_id = auth.uid()
              OR (
                ea.profession_id IS NOT NULL
                AND ea.profession_id = up.profession_id
                AND (ea.health_authority_id IS NULL OR ea.health_authority_id = up.health_authority_id)
              )
            )
        )
      )
    )
  );

-- QUESTIONS
DROP POLICY IF EXISTS "Users can view accessible exam questions" ON questions;
CREATE POLICY "Users can view accessible exam questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exams e
      WHERE e.id = questions.exam_id
        AND (
          EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
          )
          OR EXISTS (
            SELECT 1 FROM exam_attempts a
            WHERE a.user_id = auth.uid()
              AND a.exam_id = questions.exam_id
          )
          OR (
            e.requires_payment = true
            AND EXISTS (
              SELECT 1 FROM exam_access ea
              WHERE ea.exam_id = e.id
                AND ea.user_id = auth.uid()
            )
          )
          OR (
            e.requires_payment = false
            AND EXISTS (
              SELECT 1
              FROM exam_access ea
              JOIN user_profiles up ON up.id = auth.uid()
              WHERE ea.exam_id = e.id
                AND (
                  ea.user_id = auth.uid()
                  OR (
                    ea.profession_id IS NOT NULL
                    AND ea.profession_id = up.profession_id
                    AND (ea.health_authority_id IS NULL OR ea.health_authority_id = up.health_authority_id)
                  )
                )
            )
          )
        )
    )
  );
