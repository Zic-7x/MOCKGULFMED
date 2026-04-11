-- Legacy users: use "Acing the Exam (3 Months)" (admin grant).
-- Run in Supabase SQL Editor after reviewing UUIDs.
--
-- 1) Points every ACTIVE PACKAGE entitlement for these users to Acing (replaces Basic / Mastering / etc.).
--    Sets a 3-month window: starts_at = now, ends_at = now + 3 months (app enforces ends_at).
-- 2) Inserts Acing for users who still have no ACTIVE PACKAGE entitlement (same 3-month window).
-- 3) Sets daily_mcq_limit = 150 when their active package is Acing.

-- 1) Re-point existing entitlements
UPDATE user_entitlements ue
SET
  package_id = p_acing.id,
  starts_at = NOW(),
  ends_at = NOW() + INTERVAL '3 months'
FROM packages p_acing
WHERE p_acing.name = 'Acing the Exam (3 Months)'
  AND p_acing.is_active = true
  AND ue.scope = 'PACKAGE'
  AND ue.status = 'ACTIVE'
  AND ue.package_id IS DISTINCT FROM p_acing.id
  AND ue.user_id IN (
    'a41431aa-5b77-4d20-bdb9-c04bf6e1ef1f',
    'c1bd2eb6-ca70-471a-9b49-b77ffa466bd3',
    'ce8c5014-a59f-48c4-8076-959a17069373',
    'bc67eb6e-f7f3-4d52-9d04-b1bd5cd0cf4d',
    '0dd98ee6-03a6-4a96-a92c-f563e41d330a',
    'c4b11a90-152e-4620-802e-961648139308',
    '4b475e1a-1b70-4d8c-a168-3e8482efc6cf',
    '8cac8c31-2a33-466d-bd47-fd74ebd2991d',
    'c36d575f-b92b-4967-8b57-3a718ed28df2',
    'd62908d9-6f5c-4bb6-b1b1-a7a98069cb64'
  );

-- 2) Insert Acing only where there is still no ACTIVE PACKAGE row
INSERT INTO user_entitlements (
  user_id,
  scope,
  package_id,
  exam_id,
  status,
  source,
  starts_at,
  ends_at
)
SELECT
  u.id,
  'PACKAGE',
  p.id,
  NULL,
  'ACTIVE',
  'ADMIN',
  NOW(),
  NOW() + INTERVAL '3 months'
FROM (
  SELECT unnest(ARRAY[
    'a41431aa-5b77-4d20-bdb9-c04bf6e1ef1f'::uuid,
    'c1bd2eb6-ca70-471a-9b49-b77ffa466bd3'::uuid,
    'ce8c5014-a59f-48c4-8076-959a17069373'::uuid,
    'bc67eb6e-f7f3-4d52-9d04-b1bd5cd0cf4d'::uuid,
    '0dd98ee6-03a6-4a96-a92c-f563e41d330a'::uuid,
    'c4b11a90-152e-4620-802e-961648139308'::uuid,
    '4b475e1a-1b70-4d8c-a168-3e8482efc6cf'::uuid,
    '8cac8c31-2a33-466d-bd47-fd74ebd2991d'::uuid,
    'c36d575f-b92b-4967-8b57-3a718ed28df2'::uuid,
    'd62908d9-6f5c-4bb6-b1b1-a7a98069cb64'::uuid
  ]) AS id
) u
CROSS JOIN LATERAL (
  SELECT id
  FROM packages
  WHERE name = 'Acing the Exam (3 Months)'
    AND is_active = true
  LIMIT 1
) p
WHERE NOT EXISTS (
  SELECT 1
  FROM user_entitlements ue
  WHERE ue.user_id = u.id
    AND ue.scope = 'PACKAGE'
    AND ue.status = 'ACTIVE'
);

-- 3) Daily cap for Acing tier (150)
UPDATE user_profiles up
SET
  daily_mcq_limit = 150,
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM user_entitlements ue
  JOIN packages pkg ON pkg.id = ue.package_id
  WHERE ue.user_id = up.id
    AND ue.scope = 'PACKAGE'
    AND ue.status = 'ACTIVE'
    AND pkg.name = 'Acing the Exam (3 Months)'
);
