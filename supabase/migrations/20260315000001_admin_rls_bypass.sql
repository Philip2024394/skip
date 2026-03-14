-- ============================================================
--  ADMIN ROLE & RLS BYPASS SETUP
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── STEP 1: Create user_roles table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles (needed for admin check in-app)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (edge functions) can do everything
DROP POLICY IF EXISTS "Service role full access to user_roles" ON public.user_roles;
CREATE POLICY "Service role full access to user_roles"
  ON public.user_roles FOR ALL
  USING (auth.role() = 'service_role');


-- ── STEP 2: is_admin() helper function ──────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role    = 'admin'
  );
$$;


-- ── STEP 3: Admin bypass — profiles ─────────────────────────
-- Admin can SELECT all profiles (including banned / inactive / from any country)
DROP POLICY IF EXISTS "Admin can select all profiles" ON public.profiles;
CREATE POLICY "Admin can select all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Admin can UPDATE any profile (to ban, spotlight, edit fields, etc.)
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Admin can DELETE any profile
DROP POLICY IF EXISTS "Admin can delete any profile" ON public.profiles;
CREATE POLICY "Admin can delete any profile"
  ON public.profiles FOR DELETE
  USING (public.is_admin());


-- ── STEP 4: Admin bypass — payments ─────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can select all payments" ON public.payments;
CREATE POLICY "Admin can select all payments"
  ON public.payments FOR SELECT
  USING (public.is_admin());


-- ── STEP 5: Admin bypass — likes ────────────────────────────
DROP POLICY IF EXISTS "Admin can select all likes" ON public.likes;
CREATE POLICY "Admin can select all likes"
  ON public.likes FOR SELECT
  USING (public.is_admin());


-- ── STEP 6: Admin bypass — reports ──────────────────────────
DROP POLICY IF EXISTS "Admin can select all reports" ON public.reports;
CREATE POLICY "Admin can select all reports"
  ON public.reports FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can update reports" ON public.reports;
CREATE POLICY "Admin can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin());


-- ── STEP 7: Admin bypass — whatsapp_leads ───────────────────
DROP POLICY IF EXISTS "Admin can select all whatsapp_leads" ON public.whatsapp_leads;
CREATE POLICY "Admin can select all whatsapp_leads"
  ON public.whatsapp_leads FOR SELECT
  USING (public.is_admin());


-- ── STEP 8: Grant admin role to yourself ────────────────────
--
--  ⚠️  REPLACE the UUID below with YOUR actual Supabase user ID.
--  Find it: Supabase Dashboard → Authentication → Users → copy the UUID
--
--  INSERT INTO public.user_roles (user_id, role)
--  VALUES ('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', 'admin')
--  ON CONFLICT (user_id, role) DO NOTHING;
--
-- ────────────────────────────────────────────────────────────
-- Uncomment and fill in your UUID, then run:

-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('YOUR-USER-UUID-HERE', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;
