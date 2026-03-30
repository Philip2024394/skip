-- ─────────────────────────────────────────────────────────────────────────────
-- Seed mock profile_views for "Who Viewed Me" testing
-- Inserts 20 view records from random existing profiles → each other.
-- Safe to run multiple times (INSERT … ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_profiles  uuid[];
  v_viewer    uuid;
  v_viewed    uuid;
  v_count     integer;
  v_bucket    bigint;
  i           integer;
  j           integer;
BEGIN
  -- Collect up to 25 real mock profile IDs (emails contain 'mock')
  SELECT ARRAY(
    SELECT p.id
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email ILIKE '%mock%' OR u.email ILIKE '%test%' OR u.email ILIKE '%dev%'
    ORDER BY p.created_at
    LIMIT 25
  ) INTO v_profiles;

  -- Fallback: grab any 25 profiles if no mock ones found
  IF array_length(v_profiles, 1) IS NULL OR array_length(v_profiles, 1) < 2 THEN
    SELECT ARRAY(
      SELECT id FROM public.profiles ORDER BY created_at LIMIT 25
    ) INTO v_profiles;
  END IF;

  -- Need at least 2 profiles to create views
  IF array_length(v_profiles, 1) < 2 THEN
    RAISE NOTICE 'Not enough profiles to seed profile_views — skipping.';
    RETURN;
  END IF;

  -- Current 6-hour bucket
  v_bucket := (floor(extract(epoch FROM now()) / 21600) * 21600)::bigint;

  -- Create ~20 view records: each profile views the next few in the list
  FOR i IN 1 .. array_length(v_profiles, 1) LOOP
    v_viewed := v_profiles[i];

    -- Each viewed profile gets 3-5 different viewers
    FOR j IN 1 .. least(5, array_length(v_profiles, 1) - 1) LOOP
      -- Pick viewer that is not the same person
      v_viewer := v_profiles[((i + j - 1) % array_length(v_profiles, 1)) + 1];
      IF v_viewer = v_viewed THEN CONTINUE; END IF;

      -- view_count: vary by position (1-4)
      v_count := ((i + j) % 4) + 1;

      INSERT INTO public.profile_views (viewer_id, viewed_id, window_start, view_count, last_viewed_at)
      VALUES (v_viewer, v_viewed, v_bucket, v_count, now() - ((i * 7 + j * 13) || ' minutes')::interval)
      ON CONFLICT (viewer_id, viewed_id, window_start)
      DO UPDATE SET
        view_count    = EXCLUDED.view_count,
        last_viewed_at = EXCLUDED.last_viewed_at;

    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seeded mock profile_views for % profiles.', array_length(v_profiles, 1);
END $$;
