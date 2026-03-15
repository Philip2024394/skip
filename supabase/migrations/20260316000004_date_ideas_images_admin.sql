ALTER TABLE public.date_ideas_images ADD CONSTRAINT IF NOT EXISTS date_ideas_images_idea_name_key UNIQUE (idea_name);

DROP POLICY IF EXISTS "Admin role can manage date ideas images" ON public.date_ideas_images;
CREATE POLICY "Admin role can manage date ideas images"
  ON public.date_ideas_images FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
