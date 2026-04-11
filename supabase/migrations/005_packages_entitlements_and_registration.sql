-- Packages + entitlements + self-registration support (Freemius-ready)
-- This migration is designed to keep admins in control (manual overrides remain possible)
-- while enabling automated access provisioning after payment.

-- 1) Access mode on user profiles (AUTO vs MANUAL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_profiles'
      AND column_name = 'access_mode'
  ) THEN
    ALTER TABLE user_profiles
      ADD COLUMN access_mode VARCHAR(16) NOT NULL DEFAULT 'AUTO'
      CHECK (access_mode IN ('AUTO', 'MANUAL'));
  END IF;
END $$;

-- 2) Packages (sellable bundles)
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Packages -> Exams mapping (bundle contents)
CREATE TABLE IF NOT EXISTS package_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (package_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_package_exams_package ON package_exams(package_id);
CREATE INDEX IF NOT EXISTS idx_package_exams_exam ON package_exams(exam_id);

-- 3) Registration intent (what the user selected at signup)
CREATE TABLE IF NOT EXISTS registration_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  profession_id UUID REFERENCES professions(id) ON DELETE SET NULL,
  health_authority_id UUID REFERENCES health_authorities(id) ON DELETE SET NULL,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING_PAYMENT'
    CHECK (status IN ('PENDING_PAYMENT', 'READY', 'CANCELLED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registration_intents_user ON registration_intents(user_id);

-- 4) User entitlements (source-of-truth for paid/manual grants)
CREATE TABLE IF NOT EXISTS user_entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scope VARCHAR(16) NOT NULL CHECK (scope IN ('PACKAGE', 'EXAM')),
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'EXPIRED', 'CANCELED')),
  source VARCHAR(16) NOT NULL DEFAULT 'AUTO'
    CHECK (source IN ('ADMIN', 'AUTO', 'FREEMIUS')),
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  external_ref VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT entitlement_target_required CHECK (
    (scope = 'PACKAGE' AND package_id IS NOT NULL AND exam_id IS NULL)
    OR
    (scope = 'EXAM' AND exam_id IS NOT NULL AND package_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user ON user_entitlements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_status ON user_entitlements(status);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_package ON user_entitlements(package_id);
CREATE INDEX IF NOT EXISTS idx_user_entitlements_exam ON user_entitlements(exam_id);

-- 5) RLS enablement (policies can be added later; server-side service role will manage writes)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

