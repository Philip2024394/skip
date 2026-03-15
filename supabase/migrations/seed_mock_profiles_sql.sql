CREATE OR REPLACE FUNCTION public.seed_mock_profiles_tmp()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $seed$
DECLARE
  i integer;
  v_email text;
  v_uid uuid;
  v_is_female bool;
  v_gi integer;
  v_name text;
  v_bio text;
  v_city text;
  v_lat double precision;
  v_lng double precision;
  v_img1 text;
  v_img2 text;
  v_gender text;
  v_lf text;
  v_hours integer;
  v_last_seen timestamptz;
  v_langs jsonb;

  fn text[] := ARRAY['Putri','Dewi','Sari','Ayu','Rina','Wulan','Indah','Ratna','Mega','Dian',
    'Lestari','Anisa','Fitri','Nurul','Sinta','Kartika','Melati','Citra','Bunga','Kirana',
    'Dinda','Nadia','Laras','Tari','Widya','Ariani','Bella','Cahya','Devi','Eka',
    'Farah','Gita','Hasna','Intan','Jasmine','Kezia','Lila','Maya','Nova','Olivia',
    'Puspita','Rara','Salma','Tiara','Ulfa','Vina','Widi','Yasmin','Zahra','Amira',
    'Diana','Elsa','Grace','Hana','Ines','Jihan','Lana','Mira','Nayla','Reni',
    'Sela','Tria','Vera','Wenny','Adinda','Calista','Dahlia','Elina','Firda','Ghina'];

  mn text[] := ARRAY['Budi','Rizky','Dimas','Arief','Bayu','Dwi','Eko','Gilang',
    'Hendra','Irfan','Joko','Kevin','Made','Naufal','Oka','Teguh','Umar','Vito','Wahyu','Yusuf'];

  fb text[] := ARRAY[
    'Marketing exec by day, home chef by night. Love trying new warungs around the city.',
    'Freelance designer based in Bali. Looking for someone to watch sunsets with.',
    'Med student, coffee addict. Let''s grab nasi goreng sometime?',
    'Teaching English to kids. Weekend hiker, love Bromo and Rinjani.',
    'Working in fintech. Obsessed with matcha lattes and bookstores.',
    'Fashion buyer. Always planning my next trip, love Komodo Island.',
    'Nurse at RS Siloam. Enjoy cooking for friends and karaoke nights.',
    'Content creator. Cat mom to 3 rescue babies.',
    'Accountant who dreams of opening a bakery. Swipe right if you love dessert.',
    'Environmental scientist. Beach cleanups on weekends.',
    'Graphic designer and part-time DJ. Always discovering new music.',
    'Hotel management graduate. Love meeting people from different cultures.',
    'Psychology student. Good listener, better cook.',
    'Software engineer. Yoga every morning, gaming every night.',
    'Dance teacher. Salsa, contemporary, traditional, I do it all.'];

  mb text[] := ARRAY[
    'Software developer. Weekend surfer in Kuta, coffee snob.',
    'Running a small coffee roastery in Bandung. Let''s talk beans.',
    'Civil engineer building bridges. Love hiking on weekends.',
    'Photographer. Chasing golden hours across Java.',
    'Chef at a fusion restaurant. I''ll cook you something amazing.',
    'Startup founder in edtech. Passionate about education access.',
    'Music producer. Guitar player, vinyl collector.',
    'Doctor at a community clinic. Believe in giving back.',
    'Architect designing sustainable homes. Nature lover.',
    'Marine tour guide in Raja Ampat. Best job in the world.'];

  fi text[] := ARRAY[
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1514315384763-ba401779410f?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1504703395950-b89145a5425b?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1530785602389-07594beb8b73?w=400&h=500&fit=crop'];

  mi text[] := ARRAY[
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop',
    'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=500&fit=crop'];

  cities text[] := ARRAY['Jakarta','Bali','Bandung','Surabaya','Yogyakarta','Medan',
    'Semarang','Makassar','Malang','Solo','Palembang','Balikpapan','Manado','Pontianak','Lombok'];
  lats double precision[] := ARRAY[-6.2088,-8.3405,-6.9175,-7.2575,-7.7956,3.5952,-6.9666,-5.1477,-7.9666,-7.5755,-2.9761,-1.2654,1.4748,-0.0263,-8.5833];
  lngs double precision[] := ARRAY[106.8456,115.092,107.6191,112.7521,110.3695,98.6722,110.4196,119.4327,112.6326,110.8243,104.7754,116.8312,124.8421,109.3425,116.1167];

  ci integer;
  total integer := 0;
BEGIN
  FOR i IN 0..89 LOOP
    v_is_female := i < 70;
    v_gi := CASE WHEN v_is_female THEN i ELSE i - 70 END;
    v_gender := CASE WHEN v_is_female THEN 'Female' ELSE 'Male' END;
    v_email := 'mock.profile.' || i || '@skiptheapp.internal';
    ci := (i % 15) + 1;
    v_hours := 6 + (i % 9);
    v_lat := lats[ci] + ((i * 17 + 3) % 100 - 50)::double precision / 100.0 * 0.4;
    v_lng := lngs[ci] + ((i * 13 + 7) % 100 - 50)::double precision / 100.0 * 0.4;
    v_city := cities[ci];

    IF v_is_female THEN
      v_name := fn[(v_gi % array_length(fn,1)) + 1];
      v_bio  := fb[(v_gi % array_length(fb,1)) + 1];
      v_img1 := fi[(v_gi % array_length(fi,1)) + 1];
      v_img2 := fi[((v_gi + 5) % array_length(fi,1)) + 1];
      v_lf   := CASE (v_gi % 5) WHEN 0 THEN 'Dating' WHEN 1 THEN 'Relationship'
                  WHEN 2 THEN 'Dating' WHEN 3 THEN 'Friendship' ELSE 'Relationship' END;
    ELSE
      v_name := mn[(v_gi % array_length(mn,1)) + 1];
      v_bio  := mb[(v_gi % array_length(mb,1)) + 1];
      v_img1 := mi[(v_gi % array_length(mi,1)) + 1];
      v_img2 := mi[((v_gi + 2) % array_length(mi,1)) + 1];
      v_lf   := CASE (v_gi % 4) WHEN 0 THEN 'Dating' WHEN 1 THEN 'Relationship'
                  WHEN 2 THEN 'Friendship' ELSE 'Dating' END;
    END IF;

    v_last_seen := CASE WHEN i % 3 != 0
      THEN now() - ((i % 5) * 30 || ' seconds')::interval
      ELSE now() - ((15 + i % 90) || ' minutes')::interval END;

    v_langs := CASE WHEN i % 5 = 0 THEN '["Indonesian","English"]'::jsonb
                    WHEN i % 7 = 0 THEN '["Indonesian","English","Arabic"]'::jsonb
                    ELSE '["Indonesian"]'::jsonb END;

    -- Create auth user if not exists
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data,
      is_super_admin, confirmation_token,
      recovery_token, email_change_token_current,
      email_change_token_new, is_sso_user
    )
    SELECT
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      v_email, '', now(), now(), now(),
      jsonb_build_object('name', v_name, 'gender', v_gender, 'is_mock', true),
      '{"provider":"email","providers":["email"]}'::jsonb,
      false, '', '', '', '', false
    WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email);

    SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
    IF v_uid IS NULL THEN CONTINUE; END IF;

    INSERT INTO public.profiles (
      id, name, age, gender, looking_for, country, city, bio, whatsapp,
      avatar_url, images, image_positions, latitude, longitude,
      available_tonight, is_plusone, generous_lifestyle, weekend_plans,
      late_night_chat, no_drama, is_verified, is_active, is_banned,
      is_mock, mock_online_hours, last_seen_at, languages,
      basic_info, lifestyle_info, relationship_goals, orientation
    ) VALUES (
      v_uid, v_name, 19 + (i % 16), v_gender, v_lf,
      'Indonesia', v_city, v_bio, '',
      v_img1, ARRAY[v_img1, v_img2], '[]'::jsonb,
      v_lat, v_lng,
      (i % 3 = 0), (i % 5 = 1), (i % 6 = 2), (i % 7 = 1),
      (i % 8 = 3), (i % 9 = 0), (i % 10 < 7), true, false,
      true, v_hours, v_last_seen, v_langs,
      jsonb_build_object(
        'height', CASE WHEN v_is_female THEN (155 + v_gi % 15) || 'cm' ELSE (168 + v_gi % 17) || 'cm' END,
        'body_type', CASE (v_gi % 5) WHEN 0 THEN 'Slim' WHEN 1 THEN 'Athletic'
          WHEN 2 THEN 'Average' WHEN 3 THEN 'Curvy' ELSE 'Petite' END,
        'education', CASE (i % 5) WHEN 0 THEN 'Bachelor''s Degree' WHEN 1 THEN 'Master''s Degree'
          WHEN 2 THEN 'Diploma' WHEN 3 THEN 'High School' ELSE 'Bachelor''s Degree' END,
        'languages', v_langs
      ),
      jsonb_build_object(
        'smoking', CASE (i % 4) WHEN 0 THEN 'Non-smoker' WHEN 1 THEN 'Social smoker' ELSE 'Non-smoker' END,
        'drinking', CASE (i % 4) WHEN 0 THEN 'Non-drinker' WHEN 1 THEN 'Social drinker' ELSE 'Non-drinker' END,
        'exercise', CASE (i % 4) WHEN 0 THEN 'Daily' WHEN 1 THEN '2-3x/week' WHEN 2 THEN 'Weekly' ELSE 'Occasionally' END,
        'love_language', CASE (i % 5) WHEN 0 THEN 'Quality time' WHEN 1 THEN 'Acts of service'
          WHEN 2 THEN 'Words of affirmation' WHEN 3 THEN 'Physical touch' ELSE 'Gift giving' END
      ),
      jsonb_build_object(
        'looking_for', v_lf,
        'timeline', CASE (i % 4) WHEN 0 THEN 'Ready when it feels right' WHEN 1 THEN 'Within 1 year'
          WHEN 2 THEN '1-2 years' ELSE 'Not rushing' END,
        'religion', CASE (i % 6) WHEN 5 THEN 'Christian' WHEN 4 THEN 'Hindu' ELSE 'Muslim' END,
        'marital_status', 'Never married'
      ),
      'Straight'
    )
    ON CONFLICT (id) DO UPDATE SET
      name               = EXCLUDED.name,
      bio                = EXCLUDED.bio,
      city               = EXCLUDED.city,
      avatar_url         = EXCLUDED.avatar_url,
      images             = EXCLUDED.images,
      is_mock            = true,
      mock_online_hours  = EXCLUDED.mock_online_hours,
      last_seen_at       = EXCLUDED.last_seen_at,
      basic_info         = EXCLUDED.basic_info,
      lifestyle_info     = EXCLUDED.lifestyle_info,
      relationship_goals = EXCLUDED.relationship_goals,
      updated_at         = now();

    total := total + 1;
  END LOOP;

  RAISE NOTICE 'Seeded % mock profiles', total;
END;
$seed$;

SELECT public.seed_mock_profiles_tmp();
DROP FUNCTION IF EXISTS public.seed_mock_profiles_tmp();
