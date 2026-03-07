export interface Profile {
  id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  image: string;
  images: string[];
  gender: string;
  avatar_url?: string;
  latitude?: number;
  longitude?: number;
  available_tonight?: boolean;
  voice_intro_url?: string | null;
  expires_at?: string | null;
  is_rose?: boolean;
  last_seen_at?: string | null;
  looking_for?: string;
  main_image_pos?: string;
  main_image_zoom?: number;
  first_date_idea?: string | null;
  first_date_places?: Array<{ idea: string; url: string; image_url: string | null; title: string | null }>;
  languages?: string[];
}
