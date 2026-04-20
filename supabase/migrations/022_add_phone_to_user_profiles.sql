-- Add phone number to user profiles (captured at registration)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS phone VARCHAR(32);

CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

