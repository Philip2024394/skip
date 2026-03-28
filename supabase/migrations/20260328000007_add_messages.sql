-- In-app messaging between matched users
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 500),
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Fast conversation lookup (both directions)
CREATE INDEX IF NOT EXISTS messages_pair_idx ON messages (
  LEAST(sender_id::text, recipient_id::text),
  GREATEST(sender_id::text, recipient_id::text),
  created_at DESC
);

-- Fast unread count per recipient
CREATE INDEX IF NOT EXISTS messages_unread_idx ON messages (recipient_id, read_at)
  WHERE read_at IS NULL;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_see_own_messages" ON messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "users_send_messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "users_mark_read" ON messages
  FOR UPDATE USING (auth.uid() = recipient_id);
