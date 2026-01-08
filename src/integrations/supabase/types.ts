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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      convinter_answers: {
        Row: {
          answer_value: Json
          created_at: string | null
          id: number
          question_id: string
          test_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer_value: Json
          created_at?: string | null
          id?: never
          question_id: string
          test_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer_value?: Json
          created_at?: string | null
          id?: never
          question_id?: string
          test_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      convinter_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: number
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: never
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: never
          reason?: string | null
        }
        Relationships: []
      }
      convinter_chats: {
        Row: {
          created_at: string | null
          id: string
          last_message_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      convinter_compat_cache: {
        Row: {
          breakdown: Json
          computed_at: string
          detail_level: number
          score: number
          user_a: string
          user_b: string
        }
        Insert: {
          breakdown?: Json
          computed_at?: string
          detail_level: number
          score: number
          user_a: string
          user_b: string
        }
        Update: {
          breakdown?: Json
          computed_at?: string
          detail_level?: number
          score?: number
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      convinter_consent_requests: {
        Row: {
          created_at: string | null
          from_user: string
          id: number
          requested_level: number
          responded_at: string | null
          status: Database["public"]["Enums"]["convinter_consent_status"] | null
          to_user: string
        }
        Insert: {
          created_at?: string | null
          from_user: string
          id?: never
          requested_level: number
          responded_at?: string | null
          status?:
            | Database["public"]["Enums"]["convinter_consent_status"]
            | null
          to_user: string
        }
        Update: {
          created_at?: string | null
          from_user?: string
          id?: never
          requested_level?: number
          responded_at?: string | null
          status?:
            | Database["public"]["Enums"]["convinter_consent_status"]
            | null
          to_user?: string
        }
        Relationships: []
      }
      convinter_deletion_queue: {
        Row: {
          bucket: string
          done_at: string | null
          id: number
          path: string
          queued_at: string | null
        }
        Insert: {
          bucket: string
          done_at?: string | null
          id?: never
          path: string
          queued_at?: string | null
        }
        Update: {
          bucket?: string
          done_at?: string | null
          id?: never
          path?: string
          queued_at?: string | null
        }
        Relationships: []
      }
      convinter_listing_verification_requests: {
        Row: {
          approved_level: number | null
          created_at: string | null
          doc_path: string
          doc_type: string
          id: number
          listing_id: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status:
            | Database["public"]["Enums"]["convinter_verification_status"]
            | null
          user_id: string
        }
        Insert: {
          approved_level?: number | null
          created_at?: string | null
          doc_path: string
          doc_type: string
          id?: never
          listing_id: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | Database["public"]["Enums"]["convinter_verification_status"]
            | null
          user_id: string
        }
        Update: {
          approved_level?: number | null
          created_at?: string | null
          doc_path?: string
          doc_type?: string
          id?: never
          listing_id?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?:
            | Database["public"]["Enums"]["convinter_verification_status"]
            | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convinter_listing_verification_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "convinter_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      convinter_listings: {
        Row: {
          available_from: string | null
          bills_included: boolean | null
          city: string | null
          created_at: string | null
          description: string | null
          id: string
          listing_type: Database["public"]["Enums"]["convinter_listing_type"]
          listing_verification_level: number | null
          listing_verified: boolean | null
          listing_verified_at: string | null
          min_stay_months: number | null
          owner_id: string
          pets_allowed: boolean | null
          photos: string[] | null
          price_monthly: number | null
          province_code: string | null
          smoking_allowed: boolean | null
          status: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          available_from?: string | null
          bills_included?: boolean | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          listing_type?: Database["public"]["Enums"]["convinter_listing_type"]
          listing_verification_level?: number | null
          listing_verified?: boolean | null
          listing_verified_at?: string | null
          min_stay_months?: number | null
          owner_id: string
          pets_allowed?: boolean | null
          photos?: string[] | null
          price_monthly?: number | null
          province_code?: string | null
          smoking_allowed?: boolean | null
          status?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          available_from?: string | null
          bills_included?: boolean | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          listing_type?: Database["public"]["Enums"]["convinter_listing_type"]
          listing_verification_level?: number | null
          listing_verified?: boolean | null
          listing_verified_at?: string | null
          min_stay_months?: number | null
          owner_id?: string
          pets_allowed?: boolean | null
          photos?: string[] | null
          price_monthly?: number | null
          province_code?: string | null
          smoking_allowed?: boolean | null
          status?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      convinter_messages: {
        Row: {
          body: string
          chat_id: string
          created_at: string | null
          id: number
          sender_id: string
        }
        Insert: {
          body: string
          chat_id: string
          created_at?: string | null
          id?: never
          sender_id: string
        }
        Update: {
          body?: string
          chat_id?: string
          created_at?: string | null
          id?: never
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "convinter_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "convinter_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      convinter_moderators: {
        Row: {
          added_at: string | null
          added_by: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      convinter_notifications: {
        Row: {
          created_at: string | null
          id: number
          notification_type: string
          payload: Json | null
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          notification_type: string
          payload?: Json | null
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          notification_type?: string
          payload?: Json | null
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      convinter_pair_consent: {
        Row: {
          consent_level: number | null
          updated_at: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          consent_level?: number | null
          updated_at?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          consent_level?: number | null
          updated_at?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      convinter_profiles: {
        Row: {
          bio: string | null
          city: string | null
          created_at: string | null
          dealbreakers: string[] | null
          display_name: string | null
          handle: string | null
          languages: string[] | null
          photo_url: string | null
          province_code: string | null
          selfie_verified: boolean | null
          selfie_verified_at: string | null
          test_completed: boolean | null
          trust_badge:
            | Database["public"]["Enums"]["convinter_trust_badge"]
            | null
          trust_score: number | null
          updated_at: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["convinter_visibility"] | null
        }
        Insert: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          dealbreakers?: string[] | null
          display_name?: string | null
          handle?: string | null
          languages?: string[] | null
          photo_url?: string | null
          province_code?: string | null
          selfie_verified?: boolean | null
          selfie_verified_at?: string | null
          test_completed?: boolean | null
          trust_badge?:
            | Database["public"]["Enums"]["convinter_trust_badge"]
            | null
          trust_score?: number | null
          updated_at?: string | null
          user_id: string
          visibility?:
            | Database["public"]["Enums"]["convinter_visibility"]
            | null
        }
        Update: {
          bio?: string | null
          city?: string | null
          created_at?: string | null
          dealbreakers?: string[] | null
          display_name?: string | null
          handle?: string | null
          languages?: string[] | null
          photo_url?: string | null
          province_code?: string | null
          selfie_verified?: boolean | null
          selfie_verified_at?: string | null
          test_completed?: boolean | null
          trust_badge?:
            | Database["public"]["Enums"]["convinter_trust_badge"]
            | null
          trust_score?: number | null
          updated_at?: string | null
          user_id?: string
          visibility?:
            | Database["public"]["Enums"]["convinter_visibility"]
            | null
        }
        Relationships: []
      }
      convinter_rate_limits: {
        Row: {
          action_key: string
          count: number | null
          id: number
          user_id: string
          window_start: string | null
        }
        Insert: {
          action_key: string
          count?: number | null
          id?: never
          user_id: string
          window_start?: string | null
        }
        Update: {
          action_key?: string
          count?: number | null
          id?: never
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      convinter_reports: {
        Row: {
          category: string
          created_at: string | null
          detail: string | null
          id: number
          reason: string
          reporter_id: string
          resolution_action: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["convinter_report_status"] | null
          target_listing_id: string | null
          target_message_id: number | null
          target_user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          detail?: string | null
          id?: never
          reason: string
          reporter_id: string
          resolution_action?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["convinter_report_status"] | null
          target_listing_id?: string | null
          target_message_id?: number | null
          target_user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          detail?: string | null
          id?: never
          reason?: string
          reporter_id?: string
          resolution_action?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["convinter_report_status"] | null
          target_listing_id?: string | null
          target_message_id?: number | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convinter_reports_target_listing_id_fkey"
            columns: ["target_listing_id"]
            isOneToOne: false
            referencedRelation: "convinter_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      convinter_user_restrictions: {
        Row: {
          created_at: string | null
          id: number
          reason: string | null
          restriction: string
          until_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          reason?: string | null
          restriction: string
          until_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          reason?: string | null
          restriction?: string
          until_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      convinter_verification_requests: {
        Row: {
          created_at: string | null
          id: number
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string
          status:
            | Database["public"]["Enums"]["convinter_verification_status"]
            | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url: string
          status?:
            | Database["public"]["Enums"]["convinter_verification_status"]
            | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string
          status?:
            | Database["public"]["Enums"]["convinter_verification_status"]
            | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          autonomous_community: string | null
          bio: string | null
          budget_max: number | null
          budget_min: number | null
          city: string | null
          created_at: string | null
          id: string
          languages: string[] | null
          lifestyle_tags: string[] | null
          min_stay_months: number | null
          move_in_date: string | null
          name: string | null
          neighborhoods: string[] | null
          occupation: string | null
          onboarding_completed: boolean | null
          photos: string[] | null
          province: string | null
          test_completed: boolean | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"] | null
          verification_level:
            | Database["public"]["Enums"]["verification_level"]
            | null
        }
        Insert: {
          autonomous_community?: string | null
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string | null
          id: string
          languages?: string[] | null
          lifestyle_tags?: string[] | null
          min_stay_months?: number | null
          move_in_date?: string | null
          name?: string | null
          neighborhoods?: string[] | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          photos?: string[] | null
          province?: string | null
          test_completed?: boolean | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verification_level?:
            | Database["public"]["Enums"]["verification_level"]
            | null
        }
        Update: {
          autonomous_community?: string | null
          bio?: string | null
          budget_max?: number | null
          budget_min?: number | null
          city?: string | null
          created_at?: string | null
          id?: string
          languages?: string[] | null
          lifestyle_tags?: string[] | null
          min_stay_months?: number | null
          move_in_date?: string | null
          name?: string | null
          neighborhoods?: string[] | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          photos?: string[] | null
          province?: string | null
          test_completed?: boolean | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"] | null
          verification_level?:
            | Database["public"]["Enums"]["verification_level"]
            | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convinter_apply_auto_restrictions: {
        Args: { p_user: string }
        Returns: undefined
      }
      convinter_assert_not_blocked: {
        Args: { p_other: string }
        Returns: undefined
      }
      convinter_block_user: {
        Args: { p_reason?: string; p_target: string }
        Returns: Json
      }
      convinter_calc_trust_score: { Args: { p_user: string }; Returns: number }
      convinter_check_rate_limit: {
        Args: {
          p_action_key: string
          p_max_count: number
          p_window_seconds: number
        }
        Returns: undefined
      }
      convinter_compute_and_cache_guarded: {
        Args: { p_detail_level?: number; p_other_user: string }
        Returns: Json
      }
      convinter_create_chat: { Args: { p_other: string }; Returns: Json }
      convinter_enqueue_listing_doc_deletions: { Args: never; Returns: number }
      convinter_enqueue_selfie_deletions: { Args: never; Returns: number }
      convinter_get_listing_detail: {
        Args: { p_listing_id: string }
        Returns: Json
      }
      convinter_get_my_trust: { Args: never; Returns: Json }
      convinter_get_profile_detail: {
        Args: { p_locale?: string; p_user: string }
        Returns: Json
      }
      convinter_guard: { Args: { p_action: string }; Returns: undefined }
      convinter_is_blocked: {
        Args: { p_user_a: string; p_user_b: string }
        Returns: boolean
      }
      convinter_is_moderator: { Args: { p_user: string }; Returns: boolean }
      convinter_make_fingerprint: { Args: { p_text: string }; Returns: string }
      convinter_mark_deletion_done: {
        Args: { p_id: number }
        Returns: undefined
      }
      convinter_mod_list_reports: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: Json
      }
      convinter_mod_refresh_trust_for_user: {
        Args: { p_user: string }
        Returns: Json
      }
      convinter_mod_resolve_report: {
        Args: { p_action: string; p_note?: string; p_report_id: number }
        Returns: Json
      }
      convinter_mod_review_listing_verification: {
        Args: {
          p_approve: boolean
          p_level?: number
          p_note?: string
          p_request_id: number
        }
        Returns: Json
      }
      convinter_mod_review_selfie: {
        Args: { p_approve: boolean; p_note?: string; p_request_id: number }
        Returns: Json
      }
      convinter_notify: {
        Args: { p_payload: Json; p_type: string; p_user: string }
        Returns: undefined
      }
      convinter_refresh_trust_score: {
        Args: { p_user: string }
        Returns: undefined
      }
      convinter_report_listing: {
        Args: {
          p_category: string
          p_detail?: string
          p_reason: string
          p_target_listing: string
        }
        Returns: Json
      }
      convinter_report_message: {
        Args: {
          p_category: string
          p_detail?: string
          p_reason: string
          p_target_message: number
        }
        Returns: Json
      }
      convinter_report_user: {
        Args: {
          p_category: string
          p_detail?: string
          p_reason: string
          p_target_user: string
        }
        Returns: Json
      }
      convinter_request_consent: {
        Args: { p_requested_level?: number; p_to_user: string }
        Returns: Json
      }
      convinter_resolve_handle: { Args: { p_handle: string }; Returns: string }
      convinter_respond_consent_request: {
        Args: { p_accept: boolean; p_request_id: number }
        Returns: Json
      }
      convinter_save_answer: {
        Args: { p_answer_value: Json; p_question_id: string; p_test_id: string }
        Returns: Json
      }
      convinter_search_listings: {
        Args: {
          p_bills_included?: boolean
          p_city?: string
          p_limit?: number
          p_listing_type?: string
          p_listing_verified_only?: boolean
          p_offset?: number
          p_price_max?: number
          p_price_min?: number
          p_province_code?: string
          p_trust_min?: number
          p_verified_only?: boolean
        }
        Returns: Json
      }
      convinter_search_profiles: {
        Args: {
          p_city?: string
          p_limit?: number
          p_offset?: number
          p_province_code?: string
          p_trust_min?: number
          p_verified_only?: boolean
        }
        Returns: Json
      }
      convinter_send_message: {
        Args: { p_body: string; p_chat_id: string }
        Returns: Json
      }
      convinter_submit_listing_verification: {
        Args: { p_doc_path: string; p_doc_type: string; p_listing_id: string }
        Returns: Json
      }
      convinter_submit_selfie_verification: {
        Args: { p_selfie_url: string }
        Returns: Json
      }
      convinter_unblock_user: { Args: { p_target: string }; Returns: Json }
    }
    Enums: {
      convinter_consent_status: "pending" | "accepted" | "rejected"
      convinter_listing_type: "room" | "flatmate"
      convinter_report_status: "pending" | "resolved" | "dismissed"
      convinter_trust_badge: "none" | "bronze" | "silver" | "gold" | "verified"
      convinter_verification_status: "pending" | "approved" | "rejected"
      convinter_visibility: "public" | "registered_only" | "hidden"
      user_type: "seeking_room" | "offering_room" | "seeking_roommate"
      verification_level: "none" | "email" | "phone" | "document"
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
      convinter_consent_status: ["pending", "accepted", "rejected"],
      convinter_listing_type: ["room", "flatmate"],
      convinter_report_status: ["pending", "resolved", "dismissed"],
      convinter_trust_badge: ["none", "bronze", "silver", "gold", "verified"],
      convinter_verification_status: ["pending", "approved", "rejected"],
      convinter_visibility: ["public", "registered_only", "hidden"],
      user_type: ["seeking_room", "offering_room", "seeking_roommate"],
      verification_level: ["none", "email", "phone", "document"],
    },
  },
} as const
