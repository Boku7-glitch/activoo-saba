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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      classes: {
        Row: {
          age_max: number
          age_min: number
          benefits: string[] | null
          category: Database["public"]["Enums"]["class_category"]
          category_ids: string[]
          created_at: string
          description: string | null
          format: Database["public"]["Enums"]["class_format"]
          formats: string[]
          gallery: string[] | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_new: boolean | null
          is_visible: boolean
          language: string | null
          price_from: number
          schedule: string | null
          schedule_days: Json
          school_id: string
          subcategory_id: string | null
          subcategory_ids: string[]
          title: string
          updated_at: string
          view_count: number | null
          view_id: string | null
        }
        Insert: {
          age_max?: number
          age_min?: number
          benefits?: string[] | null
          category: Database["public"]["Enums"]["class_category"]
          category_ids?: string[]
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["class_format"]
          formats?: string[]
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_visible?: boolean
          language?: string | null
          price_from?: number
          schedule?: string | null
          schedule_days?: Json
          school_id: string
          subcategory_id?: string | null
          subcategory_ids?: string[]
          title: string
          updated_at?: string
          view_count?: number | null
          view_id?: string | null
        }
        Update: {
          age_max?: number
          age_min?: number
          benefits?: string[] | null
          category?: Database["public"]["Enums"]["class_category"]
          category_ids?: string[]
          created_at?: string
          description?: string | null
          format?: Database["public"]["Enums"]["class_format"]
          formats?: string[]
          gallery?: string[] | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_new?: boolean | null
          is_visible?: boolean
          language?: string | null
          price_from?: number
          schedule?: string | null
          schedule_days?: Json
          school_id?: string
          subcategory_id?: string | null
          subcategory_ids?: string[]
          title?: string
          updated_at?: string
          view_count?: number | null
          view_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "view_subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_view_id_fkey"
            columns: ["view_id"]
            isOneToOne: false
            referencedRelation: "views"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          child_age: number | null
          class_id: string
          created_at: string
          id: string
          message: string | null
          parent_name: string
          parent_phone: string
          parent_user_id: string | null
          school_id: string
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          child_age?: number | null
          class_id: string
          created_at?: string
          id?: string
          message?: string | null
          parent_name: string
          parent_phone: string
          parent_user_id?: string | null
          school_id: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          child_age?: number | null
          class_id?: string
          created_at?: string
          id?: string
          message?: string | null
          parent_name?: string
          parent_phone?: string
          parent_user_id?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: [
          {
            foreignKeyName: "leads_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_classes: {
        Row: {
          class_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          district: string
          email: string | null
          id: string
          image_url: string | null
          lat: number | null
          lng: number | null
          name: string
          owner_id: string | null
          phone: string | null
          rating: number | null
          review_count: number | null
          updated_at: string
          website: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          district: string
          email?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          name: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          district?: string
          email?: string | null
          id?: string
          image_url?: string | null
          lat?: number | null
          lng?: number | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      translations_cache: {
        Row: {
          created_at: string
          id: string
          source_hash: string
          source_lang: string
          source_text: string
          target_lang: string
          translated_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_hash: string
          source_lang?: string
          source_text: string
          target_lang: string
          translated_text: string
        }
        Update: {
          created_at?: string
          id?: string
          source_hash?: string
          source_lang?: string
          source_text?: string
          target_lang?: string
          translated_text?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      view_categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
          view_id: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
          view_id: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          view_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_categories_view_id_fkey"
            columns: ["view_id"]
            isOneToOne: false
            referencedRelation: "views"
            referencedColumns: ["id"]
          },
        ]
      }
      view_filters: {
        Row: {
          filter_type: string
          id: string
          is_enabled: boolean
          sort_order: number
          view_id: string
        }
        Insert: {
          filter_type: string
          id?: string
          is_enabled?: boolean
          sort_order?: number
          view_id: string
        }
        Update: {
          filter_type?: string
          id?: string
          is_enabled?: boolean
          sort_order?: number
          view_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "view_filters_view_id_fkey"
            columns: ["view_id"]
            isOneToOne: false
            referencedRelation: "views"
            referencedColumns: ["id"]
          },
        ]
      }
      view_subcategories: {
        Row: {
          category_id: string
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "view_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "view_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      viewed_classes: {
        Row: {
          class_id: string
          id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          class_id: string
          id?: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          class_id?: string
          id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "viewed_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      views: {
        Row: {
          accent_hex: string
          accent_secondary_hex: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          accent_hex?: string
          accent_secondary_hex?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          accent_hex?: string
          accent_secondary_hex?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
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
      app_role: "parent" | "school" | "admin"
      class_category:
        | "creativity"
        | "it"
        | "sports"
        | "development"
        | "languages"
      class_format: "group" | "individual"
      lead_status: "new" | "contacted" | "closed"
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
      app_role: ["parent", "school", "admin"],
      class_category: [
        "creativity",
        "it",
        "sports",
        "development",
        "languages",
      ],
      class_format: ["group", "individual"],
      lead_status: ["new", "contacted", "closed"],
    },
  },
} as const
