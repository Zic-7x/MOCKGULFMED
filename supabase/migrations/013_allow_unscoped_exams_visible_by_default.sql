-- Allow globally visible exams when no exam_access rows exist.
-- If an exam has one or more exam_access rows, existing profession/user checks remain enforced.

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
        AND (
          NOT EXISTS (
            SELECT 1 FROM exam_access ea_any
            WHERE ea_any.exam_id = exams.id
          )
          OR EXISTS (
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
    )
  );

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
            AND (
              NOT EXISTS (
                SELECT 1 FROM exam_access ea_any
                WHERE ea_any.exam_id = e.id
              )
              OR EXISTS (
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
    )
  );
