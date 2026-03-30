// ── Types ─────────────────────────────────────────────────────────────────────
export interface AdminProfile {
  id: string;
  name: string;
  age: number;
  country: string;
  city: string | null;
  gender: string;
  whatsapp: string;
  is_active: boolean;
  is_banned: boolean;
  is_spotlight: boolean;
  is_mock: boolean;
  hidden_until: string | null;
  created_at: string;
  last_seen_at: string | null;
  avatar_url: string | null;
  looking_for: string;
  bio: string | null;
  visible_in_countries: string[] | null;
  images: string[] | null;
  image_positions: Array<{ x: number; y: number; zoom: number }> | null;
  available_tonight: boolean | null;
  is_plusone: boolean;
  weekend_plans: boolean;
  late_night_chat: boolean;
  no_drama: boolean;
  generous_lifestyle: boolean;
  is_incognito: boolean;
  is_verified: boolean;
  mock_online_hours: number | null;
  mock_offline_days: number[] | null;
  height_cm: number | null;
  orientation: string | null;
  interests: string[] | null;
  basic_info: Record<string, any> | null;
  lifestyle_info: Record<string, any> | null;
  relationship_goals: Record<string, any> | null;
  first_date_idea: string | null;
  date_idea_image_url: string | null;
  second_date_idea: string | null;
  second_date_idea_image_url: string | null;
  third_date_idea: string | null;
  third_date_idea_image_url: string | null;
  phone_country_code: string | null;
  country_override_requested: boolean;
  country_override_approved: boolean;
  residing_country: string | null;
  visited_countries: string[] | null;
  voice_intro_url: string | null;
  video_verified: boolean;
  video_verified_at: string | null;
  photo_verified: boolean;
  photo_verified_at: string | null;
  photo_flagged: boolean;
  flag_reason: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  target_user_id: string | null;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  stripe_session_id: string;
}

export type Tab = "overview" | "users" | "income" | "alerts" | "verify" | "setup" | "ads" | "gifts" | "new_profiles" | "games" | "reports";
export type UserFilter = "all" | "active" | "banned" | "hidden" | "spotlight" | "mock" | "verified";
