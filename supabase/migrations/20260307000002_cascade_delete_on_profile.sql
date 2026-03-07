-- Ensure foreign keys cascade on delete so removing a profile cleans up all related rows

-- likes
ALTER TABLE public.likes
  DROP CONSTRAINT IF EXISTS likes_liker_id_fkey,
  DROP CONSTRAINT IF EXISTS likes_liked_id_fkey;
ALTER TABLE public.likes
  ADD CONSTRAINT likes_liker_id_fkey FOREIGN KEY (liker_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT likes_liked_id_fkey FOREIGN KEY (liked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- connections
ALTER TABLE public.connections
  DROP CONSTRAINT IF EXISTS connections_user_a_fkey,
  DROP CONSTRAINT IF EXISTS connections_user_b_fkey;
ALTER TABLE public.connections
  ADD CONSTRAINT connections_user_a_fkey FOREIGN KEY (user_a) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT connections_user_b_fkey FOREIGN KEY (user_b) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- payments
ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- reports
ALTER TABLE public.reports
  DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey,
  DROP CONSTRAINT IF EXISTS reports_reported_id_fkey;
ALTER TABLE public.reports
  ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- blocked_users
ALTER TABLE public.blocked_users
  DROP CONSTRAINT IF EXISTS blocked_users_blocker_id_fkey,
  DROP CONSTRAINT IF EXISTS blocked_users_blocked_id_fkey;
ALTER TABLE public.blocked_users
  ADD CONSTRAINT blocked_users_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT blocked_users_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
