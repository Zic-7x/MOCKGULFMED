-- Official exam bookings arranged via our platform (Prometric / Pearson), separate from mock exams.

CREATE TABLE user_external_exam_details (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  section_enabled BOOLEAN NOT NULL DEFAULT false,
  applicant_name TEXT,
  applicant_address TEXT,
  exam_health_authority TEXT,
  examination_authority TEXT,
  exam_date DATE,
  exam_time TEXT,
  exam_status TEXT,
  registration_id TEXT,
  candidate_eligibility_id TEXT,
  announcement TEXT,
  exam_pass_storage_path TEXT,
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_user_external_exam_details_updated_at
  BEFORE UPDATE ON user_external_exam_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE user_external_exam_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_external_exam_details_select"
  ON user_external_exam_details FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

CREATE POLICY "user_external_exam_details_insert_admin"
  ON user_external_exam_details FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

CREATE POLICY "user_external_exam_details_update_admin"
  ON user_external_exam_details FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

CREATE POLICY "user_external_exam_details_delete_admin"
  ON user_external_exam_details FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

-- Private bucket: object key = {user_id}/...
INSERT INTO storage.buckets (id, name, public)
VALUES ('external-exam-passes', 'external-exam-passes', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "external_exam_passes_users_read_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'external-exam-passes'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "external_exam_passes_admins_read_all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'external-exam-passes'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

CREATE POLICY "external_exam_passes_admins_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'external-exam-passes'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

CREATE POLICY "external_exam_passes_admins_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'external-exam-passes'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );

CREATE POLICY "external_exam_passes_admins_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'external-exam-passes'
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'ADMIN'
    )
  );
