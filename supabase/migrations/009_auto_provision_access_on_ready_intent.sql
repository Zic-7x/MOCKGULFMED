-- Auto-provision paid access when registration intent becomes READY.
-- This keeps manual SQL/status updates and webhook-driven flows consistent.

CREATE OR REPLACE FUNCTION provision_access_for_ready_intent()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_profession_id uuid;
BEGIN
  -- Only act when the intent is READY.
  IF NEW.status <> 'READY' THEN
    RETURN NEW;
  END IF;

  -- Only run once on transition to READY.
  IF TG_OP = 'UPDATE' AND OLD.status = 'READY' THEN
    RETURN NEW;
  END IF;

  SELECT profession_id
    INTO v_profession_id
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- No profession means we cannot safely scope exam grants.
  IF v_profession_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Ensure a package entitlement exists.
  INSERT INTO user_entitlements (
    user_id,
    scope,
    package_id,
    status,
    source,
    external_ref
  )
  VALUES (
    NEW.user_id,
    'PACKAGE',
    NEW.package_id,
    'ACTIVE',
    'AUTO',
    CONCAT('intent:', NEW.id::text)
  )
  ON CONFLICT DO NOTHING;

  -- Grant only exams that are both in the package and mapped to this profession.
  -- Update existing user-specific rows first.
  UPDATE exam_access target
  SET source = 'AUTO'
  FROM (
    SELECT DISTINCT ea.exam_id
    FROM package_exams pe
    JOIN exam_access ea
      ON ea.exam_id = pe.exam_id
     AND ea.profession_id = v_profession_id
    WHERE pe.package_id = NEW.package_id
  ) scoped
  WHERE target.exam_id = scoped.exam_id
    AND target.user_id = NEW.user_id;

  -- Insert missing user-specific rows (without relying on ON CONFLICT constraints).
  INSERT INTO exam_access (exam_id, user_id, profession_id, health_authority_id, source)
  SELECT DISTINCT scoped.exam_id, NEW.user_id, NULL::uuid, NULL::uuid, 'AUTO'
  FROM (
    SELECT DISTINCT ea.exam_id
    FROM package_exams pe
    JOIN exam_access ea
      ON ea.exam_id = pe.exam_id
     AND ea.profession_id = v_profession_id
    WHERE pe.package_id = NEW.package_id
  ) scoped
  WHERE NOT EXISTS (
    SELECT 1
    FROM exam_access existing
    WHERE existing.exam_id = scoped.exam_id
      AND existing.user_id = NEW.user_id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_registration_intents_ready_provision ON registration_intents;
CREATE TRIGGER trg_registration_intents_ready_provision
AFTER INSERT OR UPDATE OF status ON registration_intents
FOR EACH ROW
EXECUTE FUNCTION provision_access_for_ready_intent();
