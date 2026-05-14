-- Only users with an active REELS add-on may upload into the applicant-reels bucket.
DROP POLICY IF EXISTS "Applicant reels: users upload under own user id folder" ON storage.objects;
CREATE POLICY "Applicant reels: users upload under own user id folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'applicant-reels'
    AND split_part(name, '/', 1) = auth.uid()::text
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
