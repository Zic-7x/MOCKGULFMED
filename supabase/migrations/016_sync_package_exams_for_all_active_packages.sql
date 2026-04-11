-- Keep package_exams aligned with active exams for every active package.
-- Migrations 007/008 only seeded links for the three named commercial packages; new exams
-- added later (or entitlements pointing at other package rows) otherwise fail the client
-- package gate in getAvailableExams with "Not in package" for valid profession matches.
--
-- Idempotent: only inserts missing (package_id, exam_id) pairs.

INSERT INTO package_exams (package_id, exam_id)
SELECT p.id, e.id
FROM packages p
CROSS JOIN exams e
WHERE p.is_active = true
  AND e.is_active = true
ON CONFLICT (package_id, exam_id) DO NOTHING;
