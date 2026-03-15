ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residing_country text DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visited_countries text[] DEFAULT '{}';
