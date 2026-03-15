DROP POLICY IF EXISTS "Admin can upload any profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update any profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can delete any profile images" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload any avatars" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update any avatars" ON storage.objects;

CREATE POLICY "Admin can upload any profile images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update any profile images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete any profile images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can upload any avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update any avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
