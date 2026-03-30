-- ─────────────────────────────────────────────────────────────────────────────
-- Profile Views  — 6-hour window deduplication
-- Each viewer can add at most 1 view-count per 6-hour window per viewed profile.
-- Multiple visits within the same 6h window all map to the same bucket row.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profile_views (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- epoch seconds floored to the nearest 6-hour boundary
  window_start BIGINT NOT NULL,
  viewed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One row per (viewer, viewed, 6h-window) — prevents count inflation
  CONSTRAINT profile_views_unique_window UNIQUE (viewer_id, viewed_id, window_start)
);

CREATE INDEX IF NOT EXISTS profile_views_viewed_idx  ON public.profile_views (viewed_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS profile_views_viewer_idx  ON public.profile_views (viewer_id);

-- RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert their own view
CREATE POLICY "insert own view" ON public.profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Users can read views on their own profile
CREATE POLICY "read own views" ON public.profile_views
  FOR SELECT USING (auth.uid() = viewed_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- record_profile_view(viewer, viewed)
-- Upserts into the current 6-hour window bucket.
-- Returns the updated total unique-window view count for this viewer→viewed pair.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.record_profile_view(
  p_viewer_id UUID,
  p_viewed_id UUID
)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_window BIGINT;
  v_count  INT;
BEGIN
  -- Don't record views of own profile
  IF p_viewer_id = p_viewed_id THEN
    RETURN 0;
  END IF;

  -- Current 6-hour bucket (floor epoch to 6h = 21600 seconds)
  v_window := (EXTRACT(EPOCH FROM NOW())::BIGINT / 21600) * 21600;

  INSERT INTO public.profile_views (viewer_id, viewed_id, window_start, viewed_at)
  VALUES (p_viewer_id, p_viewed_id, v_window, NOW())
  ON CONFLICT (viewer_id, viewed_id, window_start) DO UPDATE
    SET viewed_at = NOW();  -- refresh timestamp but don't add a new count

  -- Total unique windows (= total meaningful view count for this pair)
  SELECT COUNT(*) INTO v_count
  FROM public.profile_views
  WHERE viewer_id = p_viewer_id AND viewed_id = p_viewed_id;

  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_who_viewed_me(p_user_id)
-- Returns all users who viewed p_user_id's profile, with:
--   viewer_id, name, age, city, photos, last_seen_at, view_count, last_viewed_at
-- Ordered by most recent view first.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_who_viewed_me(
  p_user_id UUID
)
RETURNS TABLE (
  viewer_id      UUID,
  name           TEXT,
  age            INT,
  city           TEXT,
  photos         TEXT[],
  last_seen_at   TIMESTAMPTZ,
  view_count     BIGINT,
  last_viewed_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pv.viewer_id,
    pr.name,
    pr.age,
    pr.city,
    pr.photos,
    pr.last_seen_at,
    COUNT(*)::BIGINT          AS view_count,
    MAX(pv.viewed_at)         AS last_viewed_at
  FROM public.profile_views pv
  JOIN public.profiles pr ON pr.id = pv.viewer_id
  WHERE pv.viewed_id = p_user_id
  GROUP BY pv.viewer_id, pr.name, pr.age, pr.city, pr.photos, pr.last_seen_at
  ORDER BY MAX(pv.viewed_at) DESC;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- unlock_viewer(p_user_id, p_viewer_id, p_cost)
-- Deducts coins and marks the viewer as unlocked in a simple unlock ledger.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.viewer_unlocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  coins_spent INT NOT NULL DEFAULT 0,
  CONSTRAINT viewer_unlocks_unique UNIQUE (user_id, viewer_id)
);

ALTER TABLE public.viewer_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manage own unlocks" ON public.viewer_unlocks
  FOR ALL USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.unlock_viewer(
  p_user_id   UUID,
  p_viewer_id UUID,
  p_cost      INT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_balance INT;
BEGIN
  -- Check balance
  SELECT coins_balance INTO v_balance
  FROM public.profiles WHERE id = p_user_id FOR UPDATE;

  IF v_balance < p_cost THEN
    RETURN jsonb_build_object('ok', false, 'error', 'insufficient_coins');
  END IF;

  -- Deduct coins
  UPDATE public.profiles
  SET coins_balance = coins_balance - p_cost
  WHERE id = p_user_id;

  -- Record unlock (ignore if already unlocked)
  INSERT INTO public.viewer_unlocks (user_id, viewer_id, coins_spent)
  VALUES (p_user_id, p_viewer_id, p_cost)
  ON CONFLICT (user_id, viewer_id) DO NOTHING;

  RETURN jsonb_build_object('ok', true, 'new_balance', v_balance - p_cost);
END;
$$;
