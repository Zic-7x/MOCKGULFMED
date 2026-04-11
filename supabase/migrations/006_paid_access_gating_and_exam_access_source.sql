-- Paid-access gating + exam_access source tracking

-- 1) Mark exams that require payment/entitlement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exams'
      AND column_name = 'requires_payment'
  ) THEN
    ALTER TABLE exams
      ADD COLUMN requires_payment BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_exams_requires_payment ON exams(requires_payment);

-- 2) Tag exam_access rows by source (ADMIN vs FREEMIUS vs AUTO)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'exam_access'
      AND column_name = 'source'
  ) THEN
    ALTER TABLE exam_access
      ADD COLUMN source VARCHAR(16) NOT NULL DEFAULT 'ADMIN'
      CHECK (source IN ('ADMIN', 'AUTO', 'FREEMIUS'));
  END IF;
END $$;

-- Avoid duplicate user-specific grants
CREATE UNIQUE INDEX IF NOT EXISTS ux_exam_access_user_exam
  ON exam_access (exam_id, user_id)
  WHERE user_id IS NOT NULL;

-- 3) Update RLS policies to enforce paid gating:
-- If exams.requires_payment = true, only allow access when the user has an explicit user_id grant.
-- (Admins still see all; attempts still allow review as in migration 004.)

-- EXAMS
DROP POLICY IF EXISTS "Users can view accessible exams" ON exams;
CREATE POLICY "Users can view accessible exams" ON exams
  FOR SELECT USING (
    is_active = true AND (
      -- Admins can view all active exams
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
      -- Users can view exams they've already attempted (for results/review)
      OR EXISTS (
        SELECT 1 FROM exam_attempts a
        WHERE a.user_id = auth.uid()
          AND a.exam_id = exams.id
      )
      -- Paid exams: require explicit user_id exam_access
      OR (
        exams.requires_payment = true
        AND EXISTS (
          SELECT 1 FROM exam_access ea
          WHERE ea.exam_id = exams.id
            AND ea.user_id = auth.uid()
        )
      )
      -- Free exams: allow existing profession/authority/user matching logic
      OR (
        exams.requires_payment = false
        AND EXISTS (
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
        -- Admins can view everything
        EXISTS (
          SELECT 1 FROM user_profiles
          WHERE id = auth.uid() AND role = 'ADMIN'
        )
        -- Users can always review questions for exams they've already attempted
        OR EXISTS (
          SELECT 1 FROM exam_attempts a
          WHERE a.user_id = auth.uid()
            AND a.exam_id = questions.exam_id
        )
        -- Paid exams: require explicit user_id exam_access
        OR (
          e.requires_payment = true
          AND EXISTS (
            SELECT 1 FROM exam_access ea
            WHERE ea.exam_id = e.id
              AND ea.user_id = auth.uid()
          )
        )
        -- Free exams: allow existing profession/authority/user matching logic
        OR (
          e.requires_payment = false
          AND EXISTS (
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
        )
      )
    )
  );

