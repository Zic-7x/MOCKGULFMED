-- Let admins list all packages (including inactive) and maintain package_exams from the app.
-- Without INSERT/DELETE on package_exams, Exam Management could not attach new exams to
-- subscription tiers; paid users would never pass the package gate in getAvailableExams.

DROP POLICY IF EXISTS "Admins can view all packages" ON packages;
CREATE POLICY "Admins can view all packages" ON packages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Admins can manage package_exams" ON package_exams;
CREATE POLICY "Admins can manage package_exams" ON package_exams
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
