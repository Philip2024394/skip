-- Track how many free gifts a verified user has sent
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS free_gifts_used int DEFAULT 0;
