-- Applicants must be able to read job rows for jobs they applied to (any status),
-- so embedded `job:job_postings` in job_applications queries does not come back null
-- after a recruiter closes a listing.

DROP POLICY IF EXISTS "Job postings: applicant read applied jobs" ON job_postings;
CREATE POLICY "Job postings: applicant read applied jobs"
  ON job_postings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM job_applications ja
      WHERE ja.job_id = job_postings.id
        AND ja.applicant_user_id = auth.uid()
    )
  );
