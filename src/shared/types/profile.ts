export interface BasicInfo {
  height?: string;
  body_type?: string;
  ethnicity?: string;
  education?: string;
  occupation?: string;
  income?: string;
  lives_with?: string;
  children?: string;
  languages?: string[];
}

export interface LifestyleInfo {
  smoking?: string;
  drinking?: string;
  exercise?: string;
  diet?: string;
  sleep?: string;
  social_style?: string;
  love_language?: string;
  pets?: string;
  social_media?: string;
  hobbies?: string[];
}

export interface RelationshipGoals {
  looking_for?: string;
  timeline?: string;
  date_type?: string;
  marital_status?: string;
  /** Type of their last relationship (optional) */
  last_relationship_type?: string;
  /** How long their last relationship lasted (optional) */
  relationship_length?: string;
  /** How long they have been single (optional) */
  single_for?: string;
  religion?: string;
  prayer?: string;
  hijab?: string;
  partner_religion?: string;
  dowry?: string;
  family_involvement?: string;
  polygamy?: string;
  relocate?: string;
  about_partner?: string;
  parent_financial_support?: string;
  marriage_count?: string;
  marriage_registration?: string;
}

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
  is_visiting?: boolean;
  visiting_city?: string | null;
  visiting_badge_type?: "visiting" | "otw" | "just_arrived" | null;
  visiting_badge_expires_at?: string | null;
  intent?: "marriage" | "dating" | "unsure";
  voice_intro_url?: string | null;
  video_url?: string | null;
  date_show_up_count?: number | null;
  date_total_reviews?: number | null;
  date_avg_rating?: number | null;
  expires_at?: string | null;
  is_rose?: boolean;
  last_seen_at?: string | null;
  looking_for?: string;
  height_cm?: number | null;
  drinking?: string | null;
  smoking?: string | null;
  fitness?: string | null;
  pets?: string | null;
  interests?: string[] | null;
  main_image_pos?: string;
  main_image_zoom?: number;
  first_date_idea?: string | null;
  first_date_places?: Array<{ idea: string; url: string; google_url?: string; image_url: string | null; title: string | null }>;
  languages?: string[];
  is_plusone?: boolean;
  generous_lifestyle?: boolean;
  weekend_plans?: boolean;
  late_night_chat?: boolean;
  no_drama?: boolean;
  is_verified?: boolean;
  verification_status?: "pending" | "approved" | "rejected" | null;
  verification_id_type?: "ktp" | "passport" | null;
  verification_name?: string | null;
  verification_age?: number | null;
  verification_id_url?: string | null;
  whatsapp_connections_count?: number;
  date_canceled_count?: number;
  orientation?: string | null;
  basic_info?: BasicInfo;
  lifestyle_info?: LifestyleInfo;
  relationship_goals?: RelationshipGoals;
  selected_date_ideas?: string[];
  is_mock?: boolean;
  mock_online_hours?: number | null;
  mock_offline_days?: number[] | null;
  app_user_id?: string;
  bestie_ids?: string[];
  bestie_reviews?: Record<string, string>; // key = bestieId, value = their review about this profile
  gift_delivery_opted_in?: boolean;
  delivery_address?: string; // private — only visible to admin, never shown to other users
  social_platform?: "instagram" | "tiktok" | "facebook" | "youtube" | "x" | null;
  social_followers?: number | null;
  video_verified?: boolean;
  photo_verified?: boolean;
  contact_provider?: string | null;
  mobile_carrier?: string | null;
  chat_first?: boolean | null;
}
