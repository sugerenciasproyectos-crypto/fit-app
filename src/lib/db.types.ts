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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string
          id: string
          label: string
          last_used_at: string | null
          revoked_at: string | null
          scope: string
          token_hash: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
          scope?: string
          token_hash: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
          scope?: string
          token_hash?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          active_kcal: number | null
          day: string
          steps: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_kcal?: number | null
          day: string
          steps?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_kcal?: number | null
          day?: string
          steps?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      day_flags: {
        Row: {
          day: string
          incomplete: boolean
          user_id: string
        }
        Insert: {
          day: string
          incomplete?: boolean
          user_id: string
        }
        Update: {
          day?: string
          incomplete?: boolean
          user_id?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          carbs_g: number | null
          created_at: string
          day: string
          energy_kcal: number | null
          export_dirty: boolean
          exported_at: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          logged_at: string
          meal_slot_id: string
          per100: Json
          portion_count: number | null
          portion_id: string | null
          portion_name: string | null
          product_brand: string | null
          product_id: string | null
          product_name: string
          protein_g: number | null
          quantity: number
          salt_g: number | null
          saturated_fat_g: number | null
          saved_meal_id: string | null
          snapshot_at: string
          sugars_g: number | null
          unit: Database["public"]["Enums"]["base_unit"]
          updated_at: string
          user_id: string
        }
        Insert: {
          carbs_g?: number | null
          created_at?: string
          day: string
          energy_kcal?: number | null
          export_dirty?: boolean
          exported_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          logged_at?: string
          meal_slot_id: string
          per100: Json
          portion_count?: number | null
          portion_id?: string | null
          portion_name?: string | null
          product_brand?: string | null
          product_id?: string | null
          product_name: string
          protein_g?: number | null
          quantity: number
          salt_g?: number | null
          saturated_fat_g?: number | null
          saved_meal_id?: string | null
          snapshot_at?: string
          sugars_g?: number | null
          unit: Database["public"]["Enums"]["base_unit"]
          updated_at?: string
          user_id: string
        }
        Update: {
          carbs_g?: number | null
          created_at?: string
          day?: string
          energy_kcal?: number | null
          export_dirty?: boolean
          exported_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          logged_at?: string
          meal_slot_id?: string
          per100?: Json
          portion_count?: number | null
          portion_id?: string | null
          portion_name?: string | null
          product_brand?: string | null
          product_id?: string | null
          product_name?: string
          protein_g?: number | null
          quantity?: number
          salt_g?: number | null
          saturated_fat_g?: number | null
          saved_meal_id?: string | null
          snapshot_at?: string
          sugars_g?: number | null
          unit?: Database["public"]["Enums"]["base_unit"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_meal_slot_id_fkey"
            columns: ["meal_slot_id"]
            isOneToOne: false
            referencedRelation: "meal_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_portion_id_fkey"
            columns: ["portion_id"]
            isOneToOne: false
            referencedRelation: "portions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diary_entries_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_samples: {
        Row: {
          end_at: string | null
          external_id: string
          id: string
          received_at: string
          source_name: string | null
          start_at: string
          type: Database["public"]["Enums"]["health_type"]
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          end_at?: string | null
          external_id: string
          id?: string
          received_at?: string
          source_name?: string | null
          start_at: string
          type: Database["public"]["Enums"]["health_type"]
          unit: string
          user_id: string
          value: number
        }
        Update: {
          end_at?: string | null
          external_id?: string
          id?: string
          received_at?: string
          source_name?: string | null
          start_at?: string
          type?: Database["public"]["Enums"]["health_type"]
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      meal_slots: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          name: string
          position: number
          start_time: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          name: string
          position: number
          start_time?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          name?: string
          position?: number
          start_time?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      portions: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_estimated: boolean
          name: string
          product_id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          is_estimated?: boolean
          name: string
          product_id: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_estimated?: boolean
          name?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_supermarkets: {
        Row: {
          price_eur: number | null
          price_updated_at: string | null
          product_id: string
          supermarket_id: string
          user_id: string
        }
        Insert: {
          price_eur?: number | null
          price_updated_at?: string | null
          product_id: string
          supermarket_id: string
          user_id: string
        }
        Update: {
          price_eur?: number | null
          price_updated_at?: string | null
          product_id?: string
          supermarket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_supermarkets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_supermarkets_supermarket_id_fkey"
            columns: ["supermarket_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          base_unit: Database["public"]["Enums"]["base_unit"]
          brand: string | null
          carbs_g: number | null
          category: string | null
          confidence: Database["public"]["Enums"]["confidence_lvl"] | null
          created_at: string
          deleted_at: string | null
          density_g_ml: number | null
          energy_kcal: number | null
          fat_g: number | null
          favorite: boolean
          fiber_g: number | null
          id: string
          last_portion_id: string | null
          last_quantity: number | null
          last_used_at: string | null
          manually_edited: boolean
          name: string
          name_norm: string | null
          needs_review: boolean
          package_size: number | null
          protein_g: number | null
          remote_fetched_at: string | null
          remote_snapshot: Json | null
          salt_g: number | null
          saturated_fat_g: number | null
          source: Database["public"]["Enums"]["product_source"]
          source_id: string | null
          sugars_g: number | null
          suggested_stores: string[]
          updated_at: string
          user_id: string
          warnings: string[]
        }
        Insert: {
          barcode?: string | null
          base_unit?: Database["public"]["Enums"]["base_unit"]
          brand?: string | null
          carbs_g?: number | null
          category?: string | null
          confidence?: Database["public"]["Enums"]["confidence_lvl"] | null
          created_at?: string
          deleted_at?: string | null
          density_g_ml?: number | null
          energy_kcal?: number | null
          fat_g?: number | null
          favorite?: boolean
          fiber_g?: number | null
          id?: string
          last_portion_id?: string | null
          last_quantity?: number | null
          last_used_at?: string | null
          manually_edited?: boolean
          name: string
          name_norm?: string | null
          needs_review?: boolean
          package_size?: number | null
          protein_g?: number | null
          remote_fetched_at?: string | null
          remote_snapshot?: Json | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          source?: Database["public"]["Enums"]["product_source"]
          source_id?: string | null
          sugars_g?: number | null
          suggested_stores?: string[]
          updated_at?: string
          user_id: string
          warnings?: string[]
        }
        Update: {
          barcode?: string | null
          base_unit?: Database["public"]["Enums"]["base_unit"]
          brand?: string | null
          carbs_g?: number | null
          category?: string | null
          confidence?: Database["public"]["Enums"]["confidence_lvl"] | null
          created_at?: string
          deleted_at?: string | null
          density_g_ml?: number | null
          energy_kcal?: number | null
          fat_g?: number | null
          favorite?: boolean
          fiber_g?: number | null
          id?: string
          last_portion_id?: string | null
          last_quantity?: number | null
          last_used_at?: string | null
          manually_edited?: boolean
          name?: string
          name_norm?: string | null
          needs_review?: boolean
          package_size?: number | null
          protein_g?: number | null
          remote_fetched_at?: string | null
          remote_snapshot?: Json | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          source?: Database["public"]["Enums"]["product_source"]
          source_id?: string | null
          sugars_g?: number | null
          suggested_stores?: string[]
          updated_at?: string
          user_id?: string
          warnings?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_last_portion_fk"
            columns: ["last_portion_id"]
            isOneToOne: false
            referencedRelation: "portions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity: Database["public"]["Enums"]["activity_level"]
          birth_date: string
          body_fat_pct: number | null
          created_at: string
          fat_pct: number
          goal: Database["public"]["Enums"]["goal_type"]
          height_cm: number
          kcal_adjust: number
          last_backup_at: string | null
          protein_g_per_kg: number
          sex: Database["public"]["Enums"]["sex"]
          tdee_current: number
          tdee_initial: number
          theme: string
          tracking_start: string
          updated_at: string
          use_katch: boolean
          user_id: string
        }
        Insert: {
          activity?: Database["public"]["Enums"]["activity_level"]
          birth_date: string
          body_fat_pct?: number | null
          created_at?: string
          fat_pct?: number
          goal?: Database["public"]["Enums"]["goal_type"]
          height_cm: number
          kcal_adjust?: number
          last_backup_at?: string | null
          protein_g_per_kg?: number
          sex: Database["public"]["Enums"]["sex"]
          tdee_current: number
          tdee_initial: number
          theme?: string
          tracking_start?: string
          updated_at?: string
          use_katch?: boolean
          user_id: string
        }
        Update: {
          activity?: Database["public"]["Enums"]["activity_level"]
          birth_date?: string
          body_fat_pct?: number | null
          created_at?: string
          fat_pct?: number
          goal?: Database["public"]["Enums"]["goal_type"]
          height_cm?: number
          kcal_adjust?: number
          last_backup_at?: string | null
          protein_g_per_kg?: number
          sex?: Database["public"]["Enums"]["sex"]
          tdee_current?: number
          tdee_initial?: number
          theme?: string
          tracking_start?: string
          updated_at?: string
          use_katch?: boolean
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          position: number
          product_id: string
          quantity: number
          recipe_id: string
          user_id: string
        }
        Insert: {
          id?: string
          position?: number
          product_id: string
          quantity: number
          recipe_id: string
          user_id: string
        }
        Update: {
          id?: string
          position?: number
          product_id?: string
          quantity?: number
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          cooked_weight_g: number | null
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          product_id: string
          servings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cooked_weight_g?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          product_id: string
          servings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cooked_weight_g?: number | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string
          servings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meal_items: {
        Row: {
          id: string
          portion_count: number | null
          portion_id: string | null
          position: number
          product_id: string
          quantity: number
          saved_meal_id: string
          user_id: string
        }
        Insert: {
          id?: string
          portion_count?: number | null
          portion_id?: string | null
          position?: number
          product_id: string
          quantity: number
          saved_meal_id: string
          user_id: string
        }
        Update: {
          id?: string
          portion_count?: number | null
          portion_id?: string | null
          position?: number
          product_id?: string
          quantity?: number
          saved_meal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_meal_items_portion_id_fkey"
            columns: ["portion_id"]
            isOneToOne: false
            referencedRelation: "portions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_meal_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_meal_items_saved_meal_id_fkey"
            columns: ["saved_meal_id"]
            isOneToOne: false
            referencedRelation: "saved_meals"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_meals: {
        Row: {
          created_at: string
          deleted_at: string | null
          favorite: boolean
          id: string
          last_used_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          favorite?: boolean
          id?: string
          last_used_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          favorite?: boolean
          id?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seed_products: {
        Row: {
          base_unit: Database["public"]["Enums"]["base_unit"]
          carbs_g: number | null
          category: string | null
          energy_kcal: number | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          name: string
          origin: string
          portions: Json
          protein_g: number | null
          salt_g: number | null
          saturated_fat_g: number | null
          sugars_g: number | null
        }
        Insert: {
          base_unit?: Database["public"]["Enums"]["base_unit"]
          carbs_g?: number | null
          category?: string | null
          energy_kcal?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          id: string
          name: string
          origin: string
          portions?: Json
          protein_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          sugars_g?: number | null
        }
        Update: {
          base_unit?: Database["public"]["Enums"]["base_unit"]
          carbs_g?: number | null
          category?: string | null
          energy_kcal?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          name?: string
          origin?: string
          portions?: Json
          protein_g?: number | null
          salt_g?: number | null
          saturated_fat_g?: number | null
          sugars_g?: number | null
        }
        Relationships: []
      }
      supermarkets: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      tdee_proposals: {
        Row: {
          clamped: boolean
          created_at: string
          days_logged: number | null
          decided_at: string | null
          id: string
          kcal_avg: number | null
          skip_reason: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          target_kcal_proposed: number | null
          tdee_before: number
          tdee_obs: number | null
          tdee_proposed: number | null
          trend_delta_kg: number | null
          trend_end_kg: number | null
          trend_start_kg: number | null
          user_id: string
          week_start: string
        }
        Insert: {
          clamped?: boolean
          created_at?: string
          days_logged?: number | null
          decided_at?: string | null
          id?: string
          kcal_avg?: number | null
          skip_reason?: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          target_kcal_proposed?: number | null
          tdee_before: number
          tdee_obs?: number | null
          tdee_proposed?: number | null
          trend_delta_kg?: number | null
          trend_end_kg?: number | null
          trend_start_kg?: number | null
          user_id: string
          week_start: string
        }
        Update: {
          clamped?: boolean
          created_at?: string
          days_logged?: number | null
          decided_at?: string | null
          id?: string
          kcal_avg?: number | null
          skip_reason?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          target_kcal_proposed?: number | null
          tdee_before?: number
          tdee_obs?: number | null
          tdee_proposed?: number | null
          trend_delta_kg?: number | null
          trend_end_kg?: number | null
          trend_start_kg?: number | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weights: {
        Row: {
          created_at: string
          day: string
          id: string
          measured_at: string
          sample_id: string | null
          source: Database["public"]["Enums"]["weight_source"]
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          measured_at: string
          sample_id?: string | null
          source: Database["public"]["Enums"]["weight_source"]
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          measured_at?: string
          sample_id?: string | null
          source?: Database["public"]["Enums"]["weight_source"]
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weights_sample_fk"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "health_samples"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_product_correction: {
        Args: {
          p_dry?: boolean
          p_from?: string
          p_product: string
          p_to?: string
        }
        Returns: Json
      }
      copy_seed_to: { Args: { p_user: string }; Returns: number }
      create_api_token: { Args: never; Returns: string }
      f_norm: { Args: { t: string }; Returns: string }
      import_products: {
        Args: { decisions: Json; payload: Json }
        Returns: Json
      }
      revoke_api_token: { Args: never; Returns: undefined }
      search_products: {
        Args: {
          lim?: number
          only_fav?: boolean
          q: string
          supermarket?: string
        }
        Returns: {
          barcode: string | null
          base_unit: Database["public"]["Enums"]["base_unit"]
          brand: string | null
          carbs_g: number | null
          category: string | null
          confidence: Database["public"]["Enums"]["confidence_lvl"] | null
          created_at: string
          deleted_at: string | null
          density_g_ml: number | null
          energy_kcal: number | null
          fat_g: number | null
          favorite: boolean
          fiber_g: number | null
          id: string
          last_portion_id: string | null
          last_quantity: number | null
          last_used_at: string | null
          manually_edited: boolean
          name: string
          name_norm: string | null
          needs_review: boolean
          package_size: number | null
          protein_g: number | null
          remote_fetched_at: string | null
          remote_snapshot: Json | null
          salt_g: number | null
          saturated_fat_g: number | null
          source: Database["public"]["Enums"]["product_source"]
          source_id: string | null
          sugars_g: number | null
          suggested_stores: string[]
          updated_at: string
          user_id: string
          warnings: string[]
        }[]
        SetofOptions: {
          from: "*"
          to: "products"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      base_unit: "g" | "ml"
      confidence_lvl: "alta" | "media" | "baja"
      goal_type: "lose" | "maintain" | "gain"
      health_type: "weight" | "steps" | "active_kcal"
      product_source:
        | "etiqueta"
        | "web"
        | "estimado"
        | "openfoodfacts"
        | "usda"
        | "manual"
        | "receta"
        | "aesan"
        | "seed"
      proposal_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "skipped"
      sex: "male" | "female"
      weight_source: "manual" | "health"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      base_unit: ["g", "ml"],
      confidence_lvl: ["alta", "media", "baja"],
      goal_type: ["lose", "maintain", "gain"],
      health_type: ["weight", "steps", "active_kcal"],
      product_source: [
        "etiqueta",
        "web",
        "estimado",
        "openfoodfacts",
        "usda",
        "manual",
        "receta",
        "aesan",
        "seed",
      ],
      proposal_status: [
        "pending",
        "accepted",
        "rejected",
        "expired",
        "skipped",
      ],
      sex: ["male", "female"],
      weight_source: ["manual", "health"],
    },
  },
} as const
