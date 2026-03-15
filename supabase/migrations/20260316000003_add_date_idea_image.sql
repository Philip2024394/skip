ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_idea_image_url text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS second_date_idea text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS second_date_idea_image_url text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS third_date_idea text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS third_date_idea_image_url text DEFAULT NULL;
