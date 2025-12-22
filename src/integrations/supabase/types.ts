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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          message: string
          message_type: string
          push_sent: boolean | null
          receiver_id: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          message: string
          message_type?: string
          push_sent?: boolean | null
          receiver_id?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string
          push_sent?: boolean | null
          receiver_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_states: {
        Row: {
          chat_id: string
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_states_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          channel_name: string
          created_at: string | null
          id: string
          job_request_id: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          channel_name: string
          created_at?: string | null
          id?: string
          job_request_id?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          channel_name?: string
          created_at?: string | null
          id?: string
          job_request_id?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chats_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      company_crew_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_crew_roles_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "company_crew_types"
            referencedColumns: ["id"]
          },
        ]
      }
      company_crew_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          business_category: string | null
          business_category_id: string | null
          company_banner_image: string | null
          company_name: string
          company_portfolio: string | null
          company_profile_picture: string | null
          created_at: string
          description: string | null
          id: string
          latitude: number | null
          links: string | null
          location: string
          longitude: number | null
          our_team_ids: string[] | null
          tags: string | null
          tags_ids: string | null
          team: string | null
          team_size: string | null
          type_of_services: string
          type_of_services_ids: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_category?: string | null
          business_category_id?: string | null
          company_banner_image?: string | null
          company_name: string
          company_portfolio?: string | null
          company_profile_picture?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          links?: string | null
          location: string
          longitude?: number | null
          our_team_ids?: string[] | null
          tags?: string | null
          tags_ids?: string | null
          team?: string | null
          team_size?: string | null
          type_of_services: string
          type_of_services_ids?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_category?: string | null
          business_category_id?: string | null
          company_banner_image?: string | null
          company_name?: string
          company_portfolio?: string | null
          company_profile_picture?: string | null
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number | null
          links?: string | null
          location?: string
          longitude?: number | null
          our_team_ids?: string[] | null
          tags?: string | null
          tags_ids?: string | null
          team?: string | null
          team_size?: string | null
          type_of_services?: string
          type_of_services_ids?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_services: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      event_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          event_id: string
          id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          event_id: string
          id?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_documents_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string
          event_id: string
          id: string
          interest_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          interest_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          interest_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category_id: string[] | null
          category_names: string | null
          cover_picture: string | null
          created_at: string
          duration: string | null
          event_date: string
          event_time: string
          full_description: string
          id: string
          is_allowed: boolean | null
          is_featured: boolean | null
          link_to_dolk_profile: boolean
          location: string | null
          meeting_url: string | null
          short_description: string
          tag_ids: string[] | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          user_id: string
          where_to_host: string | null
        }
        Insert: {
          category_id?: string[] | null
          category_names?: string | null
          cover_picture?: string | null
          created_at?: string
          duration?: string | null
          event_date: string
          event_time: string
          full_description: string
          id?: string
          is_allowed?: boolean | null
          is_featured?: boolean | null
          link_to_dolk_profile?: boolean
          location?: string | null
          meeting_url?: string | null
          short_description: string
          tag_ids?: string[] | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          where_to_host?: string | null
        }
        Update: {
          category_id?: string[] | null
          category_names?: string | null
          cover_picture?: string | null
          created_at?: string
          duration?: string | null
          event_date?: string
          event_time?: string
          full_description?: string
          id?: string
          is_allowed?: boolean | null
          is_featured?: boolean | null
          link_to_dolk_profile?: boolean
          location?: string | null
          meeting_url?: string | null
          short_description?: string
          tag_ids?: string[] | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          where_to_host?: string | null
        }
        Relationships: []
      }
      events_favorites: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_favorites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      hobbies: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_requests: {
        Row: {
          accepted_by_company: boolean | null
          accepted_user_id: string | null
          created_at: string
          id: string
          job_budget: string | null
          job_category_names: string[]
          job_category_type_ids: string[]
          job_complete_date: string
          job_consent: boolean | null
          job_documents_images: string[] | null
          job_full_description: string
          job_latitude: number | null
          job_location: string
          job_longitude: number | null
          job_short_description: string
          job_special_requirements: string
          job_start_date: string
          job_tags_ids: string[] | null
          job_tags_names: string[] | null
          job_title: string
          job_urgency: string
          rejection_reason: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_by_company?: boolean | null
          accepted_user_id?: string | null
          created_at?: string
          id?: string
          job_budget?: string | null
          job_category_names: string[]
          job_category_type_ids: string[]
          job_complete_date: string
          job_consent?: boolean | null
          job_documents_images?: string[] | null
          job_full_description: string
          job_latitude?: number | null
          job_location: string
          job_longitude?: number | null
          job_short_description: string
          job_special_requirements: string
          job_start_date: string
          job_tags_ids?: string[] | null
          job_tags_names?: string[] | null
          job_title: string
          job_urgency: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_by_company?: boolean | null
          accepted_user_id?: string | null
          created_at?: string
          id?: string
          job_budget?: string | null
          job_category_names?: string[]
          job_category_type_ids?: string[]
          job_complete_date?: string
          job_consent?: boolean | null
          job_documents_images?: string[] | null
          job_full_description?: string
          job_latitude?: number | null
          job_location?: string
          job_longitude?: number | null
          job_short_description?: string
          job_special_requirements?: string
          job_start_date?: string
          job_tags_ids?: string[] | null
          job_tags_names?: string[] | null
          job_title?: string
          job_urgency?: string
          rejection_reason?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_job_requests_accepted_user"
            columns: ["accepted_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_favorites: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string[] | null
          latitude: number | null
          location: string | null
          longitude: number | null
          mentions: string[] | null
          tag_ids: string[] | null
          tag_people_ids: string[] | null
          tag_people_name: string[] | null
          tags_name: string[] | null
          thumbnail_urls: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string[] | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mentions?: string[] | null
          tag_ids?: string[] | null
          tag_people_ids?: string[] | null
          tag_people_name?: string[] | null
          tags_name?: string[] | null
          thumbnail_urls?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string[] | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          mentions?: string[] | null
          tag_ids?: string[] | null
          tag_people_ids?: string[] | null
          tag_people_name?: string[] | null
          tags_name?: string[] | null
          thumbnail_urls?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          birth_date: string | null
          company_crew_ids: string | null
          company_crew_type: string | null
          company_id: string | null
          company_name: string | null
          country_code: string
          created_at: string
          email: string
          fcm_token: string | null
          full_name: string | null
          gender: string | null
          hashed_password: string | null
          hobby: string | null
          id: string
          is_approved: boolean | null
          is_company_employee: boolean | null
          is_crew_member: boolean | null
          is_onboarded: boolean | null
          is_otp_verified: boolean | null
          jwt_token: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          nationality: string | null
          otp: string | null
          otp_created_at: string | null
          phone_number: string
          profile_picture_url: string | null
          profile_type: string | null
          provider_type: string | null
          refresh_token: string | null
          rejection_reason: string | null
          role: string | null
          role_ids: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string
        }
        Insert: {
          bio?: string | null
          birth_date?: string | null
          company_crew_ids?: string | null
          company_crew_type?: string | null
          company_id?: string | null
          company_name?: string | null
          country_code: string
          created_at?: string
          email: string
          fcm_token?: string | null
          full_name?: string | null
          gender?: string | null
          hashed_password?: string | null
          hobby?: string | null
          id?: string
          is_approved?: boolean | null
          is_company_employee?: boolean | null
          is_crew_member?: boolean | null
          is_onboarded?: boolean | null
          is_otp_verified?: boolean | null
          jwt_token?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          nationality?: string | null
          otp?: string | null
          otp_created_at?: string | null
          phone_number: string
          profile_picture_url?: string | null
          profile_type?: string | null
          provider_type?: string | null
          refresh_token?: string | null
          rejection_reason?: string | null
          role?: string | null
          role_ids?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
          username: string
        }
        Update: {
          bio?: string | null
          birth_date?: string | null
          company_crew_ids?: string | null
          company_crew_type?: string | null
          company_id?: string | null
          company_name?: string | null
          country_code?: string
          created_at?: string
          email?: string
          fcm_token?: string | null
          full_name?: string | null
          gender?: string | null
          hashed_password?: string | null
          hobby?: string | null
          id?: string
          is_approved?: boolean | null
          is_company_employee?: boolean | null
          is_crew_member?: boolean | null
          is_onboarded?: boolean | null
          is_otp_verified?: boolean | null
          jwt_token?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          nationality?: string | null
          otp?: string | null
          otp_created_at?: string | null
          phone_number?: string
          profile_picture_url?: string | null
          profile_type?: string | null
          provider_type?: string | null
          refresh_token?: string | null
          rejection_reason?: string | null
          role?: string | null
          role_ids?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
          username?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          category_id: string | null
          category_names: string | null
          created_at: string
          documents: string | null
          full_description: string
          id: string
          link_to_dolks_profile: boolean
          rejection_reason: string | null
          short_description: string
          status: string
          tags: string[] | null
          tags_ids: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          visuals: string[] | null
          what_looking_for: string | null
        }
        Insert: {
          category_id?: string | null
          category_names?: string | null
          created_at?: string
          documents?: string | null
          full_description: string
          id?: string
          link_to_dolks_profile?: boolean
          rejection_reason?: string | null
          short_description: string
          status?: string
          tags?: string[] | null
          tags_ids?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          visuals?: string[] | null
          what_looking_for?: string | null
        }
        Update: {
          category_id?: string | null
          category_names?: string | null
          created_at?: string
          documents?: string | null
          full_description?: string
          id?: string
          link_to_dolks_profile?: boolean
          rejection_reason?: string | null
          short_description?: string
          status?: string
          tags?: string[] | null
          tags_ids?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          visuals?: string[] | null
          what_looking_for?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "user"
      user_type: "crew" | "service"
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
      app_role: ["admin", "user"],
      user_type: ["crew", "service"],
    },
  },
} as const
