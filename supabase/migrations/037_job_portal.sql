-- Job portal: postings, applications, recruiter access to APPLY_ONLY reels & storage.

-- 1) Annual-package gate for applying (aligns with client inferPackageDurationMonths heuristics)
CREATE OR REPLACE FUNCTION public.profile_has_job_portal_apply_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = p_user_id
        AND up.role = 'ADMIN'
    )
    OR EXISTS (
      SELECT 1
      FROM user_profiles up
      WHERE up.id = p_user_id
        AND up.access_mode = 'MANUAL'
    )
    OR EXISTS (
      SELECT 1
      FROM user_entitlements ue
      JOIN packages p ON p.id = ue.package_id
      WHERE ue.user_id = p_user_id
        AND ue.scope = 'PACKAGE'
        AND ue.status = 'ACTIVE'
        AND (ue.ends_at IS NULL OR ue.ends_at > now())
        AND (
          lower(coalesce(p.name, '') || ' ' || coalesce(p.duration_label, ''))
            ~ '(12|twelve)[[:space:]]*months?|annual|yearly'
        )
    );
$$;

-- 2) Job postings (recruiter = hiring user; no separate employer role enum)
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  description text,
  location varchar(255),
  employment_type varchar(32) NOT NULL DEFAULT 'FULL_TIME'
    CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE', 'OTHER')),
  profession_id uuid REFERENCES professions(id) ON DELETE SET NULL,
  salary_band varchar(128),
  status varchar(16) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_recruiter ON job_postings(recruiter_user_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_profession ON job_postings(profession_id);

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3) Applications + denormalized applicant contact (recruiters cannot read user_profiles RLS)
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  applicant_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  applicant_name_at_apply varchar(255) NOT NULL DEFAULT '',
  applicant_email_at_apply varchar(255) NOT NULL DEFAULT '',
  cover_note text,
  attached_reel_id uuid REFERENCES applicant_reels(id) ON DELETE SET NULL,
  status varchar(24) NOT NULL DEFAULT 'SUBMITTED'
    CHECK (status IN ('SUBMITTED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_user_id);

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.job_application_fill_applicant_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name varchar(255);
  v_email varchar(255);
BEGIN
  SELECT full_name, email INTO v_name, v_email
  FROM user_profiles
  WHERE id = NEW.applicant_user_id;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Applicant profile not found';
  END IF;
  NEW.applicant_name_at_apply := v_name;
  NEW.applicant_email_at_apply := v_email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_applications_snapshot ON job_applications;
CREATE TRIGGER trg_job_applications_snapshot
  BEFORE INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.job_application_fill_applicant_snapshot();

CREATE OR REPLACE FUNCTION public.job_application_validate_attached_reel()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.attached_reel_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM applicant_reels r
    WHERE r.id = NEW.attached_reel_id
      AND r.user_id = NEW.applicant_user_id
      AND r.status = 'PUBLISHED'
  ) THEN
    RAISE EXCEPTION 'attached_reel_id must be the applicant''s published reel';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_applications_validate_reel ON job_applications;
CREATE TRIGGER trg_job_applications_validate_reel
  BEFORE INSERT OR UPDATE OF attached_reel_id ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.job_application_validate_attached_reel();

-- 4) RLS job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job postings: anyone authenticated read published" ON job_postings;
CREATE POLICY "Job postings: anyone authenticated read published"
  ON job_postings FOR SELECT TO authenticated
  USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS "Job postings: recruiter read own" ON job_postings;
CREATE POLICY "Job postings: recruiter read own"
  ON job_postings FOR SELECT TO authenticated
  USING (recruiter_user_id = auth.uid());

DROP POLICY IF EXISTS "Job postings: recruiter insert own" ON job_postings;
CREATE POLICY "Job postings: recruiter insert own"
  ON job_postings FOR INSERT TO authenticated
  WITH CHECK (recruiter_user_id = auth.uid());

DROP POLICY IF EXISTS "Job postings: recruiter update own" ON job_postings;
CREATE POLICY "Job postings: recruiter update own"
  ON job_postings FOR UPDATE TO authenticated
  USING (recruiter_user_id = auth.uid())
  WITH CHECK (recruiter_user_id = auth.uid());

DROP POLICY IF EXISTS "Job postings: recruiter delete own" ON job_postings;
CREATE POLICY "Job postings: recruiter delete own"
  ON job_postings FOR DELETE TO authenticated
  USING (recruiter_user_id = auth.uid());

DROP POLICY IF EXISTS "Job postings: admin all" ON job_postings;
CREATE POLICY "Job postings: admin all"
  ON job_postings FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- 5) RLS job_applications
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Job applications: applicant read own" ON job_applications;
CREATE POLICY "Job applications: applicant read own"
  ON job_applications FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid());

DROP POLICY IF EXISTS "Job applications: recruiter read for own jobs" ON job_applications;
CREATE POLICY "Job applications: recruiter read for own jobs"
  ON job_applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = job_applications.job_id
        AND jp.recruiter_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Job applications: applicant insert" ON job_applications;
CREATE POLICY "Job applications: applicant insert"
  ON job_applications FOR INSERT TO authenticated
  WITH CHECK (
    applicant_user_id = auth.uid()
    AND public.profile_has_job_portal_apply_access(auth.uid())
    AND EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = job_applications.job_id
        AND jp.status = 'PUBLISHED'
    )
    AND NOT EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = job_applications.job_id
        AND jp.recruiter_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Job applications: recruiter update" ON job_applications;
CREATE POLICY "Job applications: recruiter update"
  ON job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = job_applications.job_id
        AND jp.recruiter_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM job_postings jp
      WHERE jp.id = job_applications.job_id
        AND jp.recruiter_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Job applications: applicant withdraw" ON job_applications;
DROP POLICY IF EXISTS "Job applications: applicant update withdraw only" ON job_applications;
CREATE POLICY "Job applications: applicant update withdraw only" ON job_applications
  FOR UPDATE TO authenticated
  USING (applicant_user_id = auth.uid())
  WITH CHECK (
    applicant_user_id = auth.uid()
    AND status = 'WITHDRAWN'
  );

DROP POLICY IF EXISTS "Job applications: admin all" ON job_applications;
CREATE POLICY "Job applications: admin all"
  ON job_applications FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Recruiter policy must not allow recruiter to set applicant fields inappropriately - trust app or tighten later.

-- 6) applicant_reels: recruiters see APPLY_ONLY when tied to an application they own
DROP POLICY IF EXISTS "Reels: recruiter select apply-only via application" ON applicant_reels;
CREATE POLICY "Reels: recruiter select apply-only via application"
  ON applicant_reels FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND visibility = 'APPLY_ONLY'
    AND EXISTS (
      SELECT 1
      FROM job_applications ja
      JOIN job_postings jp ON jp.id = ja.job_id
      WHERE ja.attached_reel_id = applicant_reels.id
        AND jp.recruiter_user_id = auth.uid()
    )
  );

-- 7) Storage: recruiter read APPLY_ONLY reel files for their applications
DROP POLICY IF EXISTS "Applicant reels: recruiter read apply-only via application" ON storage.objects;
CREATE POLICY "Applicant reels: recruiter read apply-only via application"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'applicant-reels'
    AND EXISTS (
      SELECT 1
      FROM applicant_reels r
      JOIN job_applications ja ON ja.attached_reel_id = r.id
      JOIN job_postings jp ON jp.id = ja.job_id
      WHERE (r.video_path = storage.objects.name OR r.thumbnail_path = storage.objects.name)
        AND r.status = 'PUBLISHED'
        AND r.visibility = 'APPLY_ONLY'
        AND jp.recruiter_user_id = auth.uid()
    )
  );
