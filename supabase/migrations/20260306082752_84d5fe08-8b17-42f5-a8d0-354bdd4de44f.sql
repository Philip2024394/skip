
ALTER TABLE public.profiles ADD COLUMN latitude DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN longitude DOUBLE PRECISION;

-- Update the handle_new_user function to include coordinates
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, age, gender, looking_for, country, city, whatsapp, latitude, longitude)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'age')::INTEGER, 25),
    COALESCE(NEW.raw_user_meta_data->>'gender', 'Other'),
    COALESCE(NEW.raw_user_meta_data->>'looking_for', 'Everyone'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
    (NEW.raw_user_meta_data->>'latitude')::DOUBLE PRECISION,
    (NEW.raw_user_meta_data->>'longitude')::DOUBLE PRECISION
  );
  RETURN NEW;
END;
$$;

-- Create a view to hide sensitive fields (whatsapp) from other users
CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, name, age, gender, looking_for, country, city, bio, avatar_url, 
         is_active, is_banned, hidden_until, latitude, longitude, created_at
  FROM public.profiles;
