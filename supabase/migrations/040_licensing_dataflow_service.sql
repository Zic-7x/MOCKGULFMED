-- Paid licensing + Dataflow / Dataflow-only document intake (see client /services/licensing-dataflow)

CREATE TABLE licensing_dataflow_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  service_kind VARCHAR(40) NOT NULL
    CHECK (service_kind IN ('LICENSING_AND_DATAFLOW', 'DATAFLOW_ONLY')),
  expected_freemius_plan_id VARCHAR(32),
  qualification_level VARCHAR(20) NOT NULL
    CHECK (qualification_level IN ('DIPLOMA', 'BACHELOR', 'MASTERS', 'PHD')),
  profession_id UUID REFERENCES professions(id) ON DELETE SET NULL,
  health_authority_id UUID REFERENCES health_authorities(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (payment_status IN ('PENDING', 'PAID', 'CANCELED')),
  freemius_external_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_licensing_dataflow_requests_user_id ON licensing_dataflow_requests(user_id);
CREATE INDEX idx_licensing_dataflow_requests_created_at ON licensing_dataflow_requests(created_at DESC);
CREATE INDEX idx_licensing_dataflow_requests_payment ON licensing_dataflow_requests(payment_status);

CREATE TRIGGER licensing_dataflow_requests_updated_at
  BEFORE UPDATE ON licensing_dataflow_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE licensing_dataflow_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "LDF requests: users insert own"
  ON licensing_dataflow_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "LDF requests: users select own"
  ON licensing_dataflow_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "LDF requests: admins select all"
  ON licensing_dataflow_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'ADMIN'
    )
  );
