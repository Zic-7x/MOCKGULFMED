-- Eligibility assessment submissions (form answers + storage paths in payload)
CREATE TABLE eligibility_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  qualification_level VARCHAR(20) NOT NULL
    CHECK (qualification_level IN ('DIPLOMA', 'BACHELOR', 'MASTERS', 'PHD')),
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_eligibility_assessments_user_id ON eligibility_assessments(user_id);
CREATE INDEX idx_eligibility_assessments_created_at ON eligibility_assessments(created_at DESC);

ALTER TABLE eligibility_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own eligibility assessments"
  ON eligibility_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users select own eligibility assessments"
  ON eligibility_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins select all eligibility assessments"
  ON eligibility_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );

-- Private bucket for uploaded documents (paths: {user_id}/{submission_id}/...)
INSERT INTO storage.buckets (id, name, public)
VALUES ('eligibility-documents', 'eligibility-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Eligibility docs: users upload under own user id folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'eligibility-documents'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Eligibility docs: users read own uploads"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'eligibility-documents'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Eligibility docs: users delete own uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'eligibility-documents'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

CREATE POLICY "Eligibility docs: admins read all"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'eligibility-documents'
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );
