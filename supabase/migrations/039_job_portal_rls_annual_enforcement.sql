-- Job portal: require active annual (or admin/manual per profile_has_job_portal_apply_access) for
-- browsing published jobs and for recruiter CRUD on own listings.

DROP POLICY IF EXISTS "Job postings: anyone authenticated read published" ON job_postings;
CREATE POLICY "Job postings: annual tier read published"
  ON job_postings FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND public.profile_has_job_portal_apply_access(auth.uid())
  );

DROP POLICY IF EXISTS "Job postings: recruiter read own" ON job_postings;
CREATE POLICY "Job postings: recruiter read own"
  ON job_postings FOR SELECT TO authenticated
  USING (
    recruiter_user_id = auth.uid()
    AND public.profile_has_job_portal_apply_access(auth.uid())
  );

DROP POLICY IF EXISTS "Job postings: recruiter insert own" ON job_postings;
CREATE POLICY "Job postings: recruiter insert own"
  ON job_postings FOR INSERT TO authenticated
  WITH CHECK (
    recruiter_user_id = auth.uid()
    AND public.profile_has_job_portal_apply_access(auth.uid())
  );

DROP POLICY IF EXISTS "Job postings: recruiter update own" ON job_postings;
CREATE POLICY "Job postings: recruiter update own"
  ON job_postings FOR UPDATE TO authenticated
  USING (
    recruiter_user_id = auth.uid()
    AND public.profile_has_job_portal_apply_access(auth.uid())
  )
  WITH CHECK (
    recruiter_user_id = auth.uid()
    AND public.profile_has_job_portal_apply_access(auth.uid())
  );

DROP POLICY IF EXISTS "Job postings: recruiter delete own" ON job_postings;
CREATE POLICY "Job postings: recruiter delete own"
  ON job_postings FOR DELETE TO authenticated
  USING (
    recruiter_user_id = auth.uid()
    AND public.profile_has_job_portal_apply_access(auth.uid())
  );
