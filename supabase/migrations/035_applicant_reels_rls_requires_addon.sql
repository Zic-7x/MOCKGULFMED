-- Require active REELS add-on for creating or editing applicant_reels (not only UI).

DROP POLICY IF EXISTS "Reels: users insert own" ON applicant_reels;
CREATE POLICY "Reels: users insert own"
  ON applicant_reels FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM user_entitlements ue
      WHERE ue.user_id = auth.uid()
        AND ue.scope = 'ADDON'
        AND ue.addon_code = 'REELS'
        AND ue.status = 'ACTIVE'
        AND (ue.ends_at IS NULL OR ue.ends_at > now())
    )
  );

DROP POLICY IF EXISTS "Reels: users update own" ON applicant_reels;
CREATE POLICY "Reels: users update own"
  ON applicant_reels FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reels: users delete own" ON applicant_reels;
CREATE POLICY "Reels: users delete own"
  ON applicant_reels FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
