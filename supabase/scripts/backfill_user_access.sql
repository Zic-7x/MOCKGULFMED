-- Maintenance SQL (run in Supabase SQL Editor as postgres / dashboard).
-- Adjust dates, UUIDs, and filters before executing UPDATE/INSERT blocks.
--
-- Concepts:
--   access_mode = 'AUTO'  → app requires an ACTIVE PACKAGE entitlement (paid Freemius / admin grant).
--   access_mode = 'MANUAL' → app uses exam_access profession rules only; no package purchase gate.
--
-- "Old users asked to purchase": usually AUTO + no row in user_entitlements (scope=PACKAGE, ACTIVE).
-- Fix either grant MANUAL (legacy) or insert a PACKAGE entitlement (they really bought a plan).

-- ---------------------------------------------------------------------------
-- 1) PREVIEW: users on AUTO with no active package (see paywall / "purchase package")
-- ---------------------------------------------------------------------------
SELECT
  up.id,
  up.email,
  up.full_name,
  up.access_mode,
  up.created_at,
  up.profession_id,
  up.health_authority_id
FROM user_profiles up
WHERE up.role = 'USER'
  AND COALESCE(up.access_mode, 'AUTO') = 'AUTO'
  AND NOT EXISTS (
    SELECT 1
    FROM user_entitlements ue
    WHERE ue.user_id = up.id
      AND ue.scope = 'PACKAGE'
      AND ue.status = 'ACTIVE'
  )
ORDER BY up.created_at ASC;

-- ---------------------------------------------------------------------------
-- 2) PREVIEW: legacy users to grandfather (example: accounts before payments existed)
--    Tighten the date or replace with a list of ids.
-- ---------------------------------------------------------------------------
SELECT id, email, access_mode, created_at
FROM user_profiles
WHERE role = 'USER'
  AND created_at < TIMESTAMPTZ '2026-04-01 00:00:00+00'  -- change cutoff
ORDER BY created_at;

-- ---------------------------------------------------------------------------
-- 3) GRANDFATHER: set MANUAL for legacy users without a package entitlement
--    (stops "purchase package" for those users; they keep profession-based exam_access only.)
--    Run PREVIEW first; then uncomment and adjust WHERE.
-- ---------------------------------------------------------------------------
/*
UPDATE user_profiles up
SET
  access_mode = 'MANUAL',
  updated_at = NOW()
WHERE up.role = 'USER'
  AND COALESCE(up.access_mode, 'AUTO') = 'AUTO'
  AND up.created_at < TIMESTAMPTZ '2026-04-01 00:00:00+00'
  AND NOT EXISTS (
    SELECT 1
    FROM user_entitlements ue
    WHERE ue.user_id = up.id
      AND ue.scope = 'PACKAGE'
      AND ue.status = 'ACTIVE'
  );
*/

-- ---------------------------------------------------------------------------
-- 4) GRANT PACKAGE ACCESS: user who paid but has no entitlement (replace UUIDs)
--    package_id must exist in public.packages; one ACTIVE PACKAGE row per paying user.
-- ---------------------------------------------------------------------------
/*
INSERT INTO user_entitlements (
  user_id,
  scope,
  package_id,
  exam_id,
  status,
  source,
  starts_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,  -- user_profiles.id
  'PACKAGE',
  '00000000-0000-0000-0000-000000000002'::uuid,  -- packages.id (e.g. Basic Monthly)
  NULL,
  'ACTIVE',
  'ADMIN',
  NOW()
);
*/

-- Idempotent helper: only insert if they have no active PACKAGE entitlement
/*
INSERT INTO user_entitlements (user_id, scope, package_id, exam_id, status, source, starts_at)
SELECT
  u.id,
  'PACKAGE',
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'ACTIVE',
  'ADMIN',
  NOW()
FROM user_profiles u
WHERE u.id = '00000000-0000-0000-0000-000000000001'::uuid
  AND u.role = 'USER'
  AND NOT EXISTS (
    SELECT 1
    FROM user_entitlements ue
    WHERE ue.user_id = u.id
      AND ue.scope = 'PACKAGE'
      AND ue.status = 'ACTIVE'
  );
*/

-- ---------------------------------------------------------------------------
-- 5) SYNC daily MCQ cap from package name (optional; matches app heuristics)
--    Requires join packages via active entitlement.
-- ---------------------------------------------------------------------------
/*
UPDATE user_profiles up
SET
  daily_mcq_limit = CASE
    WHEN lower(p.name) LIKE '%mastering%' THEN 300
    WHEN lower(p.name) LIKE '%acing%' THEN 150
    ELSE 100
  END,
  updated_at = NOW()
FROM user_entitlements ue
JOIN packages p ON p.id = ue.package_id
WHERE ue.user_id = up.id
  AND ue.scope = 'PACKAGE'
  AND ue.status = 'ACTIVE'
  AND up.role = 'USER'
  AND up.access_mode = 'AUTO';
*/

-- ---------------------------------------------------------------------------
-- 6) "Non-relevant exams" — usually NOT fixed by user_profiles alone
--    Tighten exam_access (profession / health_authority) and/or package_exams per tier.
--    Example: list exams visible to a profession via exam_access
-- ---------------------------------------------------------------------------
/*
SELECT e.id, e.title, ea.profession_id, ea.health_authority_id, ea.user_id
FROM exam_access ea
JOIN exams e ON e.id = ea.exam_id AND e.is_active = true
WHERE ea.profession_id = '00000000-0000-0000-0000-000000000003'::uuid
ORDER BY e.title;
*/
