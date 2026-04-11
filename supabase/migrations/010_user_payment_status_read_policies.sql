-- Allow authenticated users to read their own payment/intent records.
-- Required for Packages page to show current package / upgrade state.

ALTER TABLE registration_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own registration intents" ON registration_intents;
CREATE POLICY "Users can view own registration intents" ON registration_intents
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all registration intents" ON registration_intents;
CREATE POLICY "Admins can view all registration intents" ON registration_intents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

DROP POLICY IF EXISTS "Users can view own entitlements" ON user_entitlements;
CREATE POLICY "Users can view own entitlements" ON user_entitlements
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all entitlements" ON user_entitlements;
CREATE POLICY "Admins can view all entitlements" ON user_entitlements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
