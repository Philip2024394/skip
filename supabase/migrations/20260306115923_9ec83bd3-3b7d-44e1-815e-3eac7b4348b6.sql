
-- Add is_rose column to likes table
ALTER TABLE public.likes ADD COLUMN IF NOT EXISTS is_rose boolean NOT NULL DEFAULT false;

-- Add last_rose_at column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_rose_at timestamp with time zone;

-- Create reports table for abuse reporting
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(reporter_id, reported_id)
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own blocks" ON public.blocked_users
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can view own blocks" ON public.blocked_users
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can delete own blocks" ON public.blocked_users
  FOR DELETE TO authenticated
  USING (blocker_id = auth.uid());
