-- Optional: align legacy profiles with app default (100) when never set.
-- App logic also treats null MANUAL users as 100; this keeps the DB consistent.

UPDATE user_profiles
SET daily_mcq_limit = 100
WHERE daily_mcq_limit IS NULL
  AND role = 'USER';
