export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      connections: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          last_paid_at: string
          stripe_session_id: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          last_paid_at?: string
          stripe_session_id?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          last_paid_at?: string
          stripe_session_id?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_rose: boolean
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          is_rose?: boolean
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_rose?: boolean
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          connection_id: string | null
          created_at: string
          currency: string
          id: string
          status: string
          stripe_payment_intent: string | null
          stripe_session_id: string
          target_user_id: string | null
          user_id: string
        }
        Insert: {
          amount_cents: number
          connection_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id: string
          target_user_id?: string | null
          user_id: string
        }
        Update: {
          amount_cents?: number
          connection_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          status?: string
          stripe_payment_intent?: string | null
          stripe_session_id?: string
          target_user_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_reviews: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          profile_id: string
          reviewer_id: string
          reviewer_whatsapp_last4: string | null
          text: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          profile_id: string
          reviewer_id: string
          reviewer_whatsapp_last4?: string | null
          text: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          profile_id?: string
          reviewer_id?: string
          reviewer_whatsapp_last4?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "personality_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personality_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personality_reviews_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          available_tonight: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string
          created_at: string
          first_date_idea: string | null
          first_date_places: Json | null
          selected_date_ideas: Json | null
          date_ideas_updated_at: string | null
          generous_lifestyle: boolean
          gender: string
          hidden_until: string | null
          id: string
          image_positions: Json | null
          images: string[] | null
          incognito_until: string | null
          is_active: boolean
          is_banned: boolean
          is_incognito: boolean
          is_plusone: boolean
          is_spotlight: boolean
          is_verified: boolean
          late_night_chat: boolean
          languages: Json | null
          last_rose_at: string | null
          last_seen_at: string | null
          latitude: number | null
          longitude: number | null
          looking_for: string
          main_image_pos: string | null
          name: string
          referral_code: string | null
          referral_rewards_claimed: boolean
          referred_by: string | null
          spotlight_until: string | null
          super_likes_count: number
          terms_accepted_at: string | null
          updated_at: string
          weekend_plans: boolean
          no_drama: boolean
          voice_intro_url: string | null
          whatsapp: string
          contact_preference: string
          whatsapp_connections_count: number
        }
        Insert: {
          age: number
          available_tonight?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country: string
          created_at?: string
          first_date_idea?: string | null
          first_date_places?: Json | null
          selected_date_ideas?: Json | null
          date_ideas_updated_at?: string | null
          generous_lifestyle?: boolean
          gender: string
          hidden_until?: string | null
          id: string
          image_positions?: Json | null
          images?: string[] | null
          incognito_until?: string | null
          is_active?: boolean
          is_banned?: boolean
          is_incognito?: boolean
          is_plusone?: boolean
          is_spotlight?: boolean
          is_verified?: boolean
          late_night_chat?: boolean
          languages?: Json | null
          last_rose_at?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          longitude?: number | null
          looking_for: string
          main_image_pos?: string | null
          name: string
          referral_code?: string | null
          referral_rewards_claimed?: boolean
          referred_by?: string | null
          spotlight_until?: string | null
          super_likes_count?: number
          terms_accepted_at?: string | null
          updated_at?: string
          weekend_plans?: boolean
          no_drama?: boolean
          voice_intro_url?: string | null
          contact_preference?: string
          whatsapp: string
          whatsapp_connections_count?: number
        }
        Update: {
          age?: number
          available_tonight?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string
          created_at?: string
          first_date_idea?: string | null
          first_date_places?: Json | null
          selected_date_ideas?: Json | null
          date_ideas_updated_at?: string | null
          generous_lifestyle?: boolean
          gender?: string
          hidden_until?: string | null
          id?: string
          image_positions?: Json | null
          images?: string[] | null
          incognito_until?: string | null
          is_active?: boolean
          is_banned?: boolean
          is_incognito?: boolean
          is_plusone?: boolean
          is_spotlight?: boolean
          is_verified?: boolean
          late_night_chat?: boolean
          languages?: Json | null
          last_rose_at?: string | null
          last_seen_at?: string | null
          latitude?: number | null
          longitude?: number | null
          looking_for?: string
          main_image_pos?: string | null
          name?: string
          referral_code?: string | null
          referral_rewards_claimed?: boolean
          referred_by?: string | null
          spotlight_until?: string | null
          super_likes_count?: number
          terms_accepted_at?: string | null
          updated_at?: string
          weekend_plans?: boolean
          no_drama?: boolean
          voice_intro_url?: string | null
          contact_preference?: string
          whatsapp?: string
          whatsapp_connections_count?: number
        }
        Relationships: []
      }
      video_calls: {
        Row: {
          id: string
          match_id: string
          caller_id: string
          receiver_id: string
          status: string
          started_at: string | null
          ended_at: string | null
          duration_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          match_id: string
          caller_id: string
          receiver_id: string
          status?: string
          started_at?: string | null
          ended_at?: string | null
          duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          caller_id?: string
          receiver_id?: string
          status?: string
          started_at?: string | null
          ended_at?: string | null
          duration_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_calls_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_calls_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_unlocks: {
        Row: {
          id: string
          match_id: string | null
          user1_id: string
          user2_id: string
          connection_type: string
          paid_at: string
          amount: number
        }
        Insert: {
          id?: string
          match_id?: string | null
          user1_id: string
          user2_id: string
          connection_type: string
          paid_at?: string
          amount: number
        }
        Update: {
          id?: string
          match_id?: string | null
          user1_id?: string
          user2_id?: string
          connection_type?: string
          paid_at?: string
          amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_unlocks_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_unlocks_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string | null
          referred_id: string | null
          whatsapp_shared: boolean
          reward_given: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id?: string | null
          referred_id?: string | null
          whatsapp_shared?: boolean
          reward_given?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string | null
          referred_id?: string | null
          whatsapp_shared?: boolean
          reward_given?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      date_ideas_images: {
        Row: {
          id: string
          idea_name: string
          image_url: string
          image_alt: string | null
          category: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          idea_name: string
          image_url: string
          image_alt?: string | null
          category: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          idea_name?: string
          image_url?: string
          image_alt?: string | null
          category?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          age: number | null
          available_tonight: boolean | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          first_date_idea: string | null
          first_date_places: Json | null
          generous_lifestyle: boolean | null
          gender: string | null
          hidden_until: string | null
          id: string | null
          images: string[] | null
          is_active: boolean | null
          is_banned: boolean | null
          is_plusone: boolean | null
          is_spotlight: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          late_night_chat: boolean | null
          latitude: number | null
          longitude: number | null
          looking_for: string | null
          languages: Json | null
          name: string | null
          no_drama: boolean | null
          spotlight_until: string | null
          contact_preference: string | null
          whatsapp_connections_count: number | null
          weekend_plans: boolean | null
          voice_intro_url: string | null
        }
        Insert: {
          age?: number | null
          available_tonight?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_date_idea?: string | null
          first_date_places?: Json | null
          generous_lifestyle?: boolean | null
          gender?: string | null
          hidden_until?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_plusone?: boolean | null
          is_spotlight?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          late_night_chat?: boolean | null
          latitude?: number | null
          longitude?: number | null
          looking_for?: string | null
          languages?: Json | null
          name?: string | null
          no_drama?: boolean | null
          contact_preference?: string | null
          spotlight_until?: string | null
          whatsapp_connections_count?: number | null
          weekend_plans?: boolean | null
          voice_intro_url?: string | null
        }
        Update: {
          age?: number | null
          available_tonight?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          first_date_idea?: string | null
          first_date_places?: Json | null
          generous_lifestyle?: boolean | null
          gender?: string | null
          hidden_until?: string | null
          id?: string | null
          images?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_plusone?: boolean | null
          is_spotlight?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          late_night_chat?: boolean | null
          latitude?: number | null
          longitude?: number | null
          looking_for?: string | null
          languages?: Json | null
          name?: string | null
          no_drama?: boolean | null
          contact_preference?: string | null
          spotlight_until?: string | null
          whatsapp_connections_count?: number | null
          weekend_plans?: boolean | null
          voice_intro_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
