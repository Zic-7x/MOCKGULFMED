-- Allow authenticated users to replace reel objects in their own folder (Storage upsert/update).
DROP POLICY IF EXISTS "Applicant reels: users update own uploads" ON storage.objects;
CREATE POLICY "Applicant reels: users update own uploads"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'applicant-reels'
    AND split_part(name, '/', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'applicant-reels'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
