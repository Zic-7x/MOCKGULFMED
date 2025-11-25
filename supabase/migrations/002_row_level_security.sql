-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_mcq_usage ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users and Admins can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
-- Users can view their own profile or any profile if they are an admin
CREATE POLICY "Users and Admins can view user profiles" ON user_profiles
  FOR SELECT USING (
    auth.uid() = id
    OR
    role = 'ADMIN'
  );

DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
CREATE POLICY "Admins can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    role = 'ADMIN'
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
CREATE POLICY "Admins can update all profiles" ON user_profiles
  FOR UPDATE USING (
    role = 'ADMIN'
  );

DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles" ON user_profiles
  FOR DELETE USING (
    role = 'ADMIN'
  );

-- Professions RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view professions" ON professions;
CREATE POLICY "Authenticated users can view professions" ON professions
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage professions" ON professions;
CREATE POLICY "Admins can manage professions" ON professions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Health Authorities RLS Policies
DROP POLICY IF EXISTS "Authenticated users can view health authorities" ON health_authorities;
CREATE POLICY "Authenticated users can view health authorities" ON health_authorities
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage health authorities" ON health_authorities;
CREATE POLICY "Admins can manage health authorities" ON health_authorities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Exams RLS Policies
DROP POLICY IF EXISTS "Users can view accessible exams" ON exams;
CREATE POLICY "Users can view accessible exams" ON exams
  FOR SELECT USING (
    is_active = true AND (
      EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
      OR
      EXISTS (
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
  );

DROP POLICY IF EXISTS "Admins can manage exams" ON exams;
CREATE POLICY "Admins can manage exams" ON exams
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Questions RLS Policies
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
        OR
        EXISTS (
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
  );

DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Exam Access RLS Policies
DROP POLICY IF EXISTS "Admins can view exam access" ON exam_access;
CREATE POLICY "Admins can view exam access" ON exam_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can manage exam access" ON exam_access;
CREATE POLICY "Admins can manage exam access" ON exam_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Exam Attempts RLS Policies
DROP POLICY IF EXISTS "Users can view own attempts" ON exam_attempts;
CREATE POLICY "Users can view own attempts" ON exam_attempts
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create own attempts" ON exam_attempts;
CREATE POLICY "Users can create own attempts" ON exam_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all attempts" ON exam_attempts;
CREATE POLICY "Admins can view all attempts" ON exam_attempts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Daily MCQ Usage RLS Policies
DROP POLICY IF EXISTS "Users can view own usage" ON daily_mcq_usage;
CREATE POLICY "Users can view own usage" ON daily_mcq_usage
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own usage" ON daily_mcq_usage;
CREATE POLICY "Users can manage own usage" ON daily_mcq_usage
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all usage" ON daily_mcq_usage;
CREATE POLICY "Admins can view all usage" ON daily_mcq_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
