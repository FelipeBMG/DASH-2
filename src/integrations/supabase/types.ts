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
      app_settings: {
        Row: {
          company_name: string
          currency: string
          id: string
          signup_enabled: boolean
          tax_rate: number
          updated_at: string
        }
        Insert: {
          company_name?: string
          currency?: string
          id?: string
          signup_enabled?: boolean
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          company_name?: string
          currency?: string
          id?: string
          signup_enabled?: boolean
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          after: Json | null
          before: Json | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          meta: Json | null
          module: string
          user_id: string
        }
        Insert: {
          action: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
          module: string
          user_id: string
        }
        Update: {
          action?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          meta?: Json | null
          module?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          all_day: boolean
          created_at: string
          description: string | null
          end_at: string
          id: string
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          start_at: string
          title?: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      collaborator_settings: {
        Row: {
          commission_fixed: number | null
          commission_percent: number | null
          created_at: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          commission_fixed?: number | null
          commission_percent?: number | null
          created_at?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          commission_fixed?: number | null
          commission_percent?: number | null
          created_at?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_name: string
          created_at: string
          end_date: string | null
          id: string
          notes: string | null
          start_date: string | null
          status: string
          total_value: number
          updated_at: string
        }
        Insert: {
          client_name?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          start_date?: string | null
          status?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      crm_clients: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          phone: string
          updated_at: string
        }
        Insert: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          notes: string | null
          owner_user_id: string | null
          phone: string
          source: string
          stage: string
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string
          source?: string
          stage?: string
          updated_at?: string
          value?: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string
          source?: string
          stage?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          category: string
          cost_center: string
          created_at: string
          date: string
          description: string
          id: string
          pending_value: number
          received_value: number
          type: string
          updated_at: string
          value: number
        }
        Insert: {
          category?: string
          cost_center?: string
          created_at?: string
          date: string
          description?: string
          id?: string
          pending_value?: number
          received_value?: number
          type: string
          updated_at?: string
          value?: number
        }
        Update: {
          category?: string
          cost_center?: string
          created_at?: string
          date?: string
          description?: string
          id?: string
          pending_value?: number
          received_value?: number
          type?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      flow_card_attachments: {
        Row: {
          bucket_id: string
          created_at: string
          file_name: string
          flow_card_id: string
          id: string
          mime_type: string
          object_path: string
          public_url: string
          uploaded_by_id: string | null
        }
        Insert: {
          bucket_id?: string
          created_at?: string
          file_name: string
          flow_card_id: string
          id?: string
          mime_type: string
          object_path: string
          public_url: string
          uploaded_by_id?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string
          file_name?: string
          flow_card_id?: string
          id?: string
          mime_type?: string
          object_path?: string
          public_url?: string
          uploaded_by_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_card_attachments_flow_card_id_fkey"
            columns: ["flow_card_id"]
            isOneToOne: false
            referencedRelation: "flow_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_cards: {
        Row: {
          attendant_id: string | null
          attendant_name: string | null
          category: string
          client_name: string
          created_at: string
          created_by_id: string | null
          created_by_name: string | null
          date: string
          deadline: string | null
          entry_value: number
          id: string
          leads_count: number
          notes: string | null
          payment_method: string
          product_id: string | null
          production_responsible_id: string | null
          production_responsible_name: string | null
          quantity: number
          received_value: number
          status: string
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          attendant_id?: string | null
          attendant_name?: string | null
          category?: string
          client_name?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          date?: string
          deadline?: string | null
          entry_value?: number
          id?: string
          leads_count?: number
          notes?: string | null
          payment_method?: string
          product_id?: string | null
          production_responsible_id?: string | null
          production_responsible_name?: string | null
          quantity?: number
          received_value?: number
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          attendant_id?: string | null
          attendant_name?: string | null
          category?: string
          client_name?: string
          created_at?: string
          created_by_id?: string | null
          created_by_name?: string | null
          date?: string
          deadline?: string | null
          entry_value?: number
          id?: string
          leads_count?: number
          notes?: string | null
          payment_method?: string
          product_id?: string | null
          production_responsible_id?: string | null
          production_responsible_name?: string | null
          quantity?: number
          received_value?: number
          status?: string
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flow_cards_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          fixed_cost: number
          id: string
          name: string
          phone: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          fixed_cost?: number
          id?: string
          name?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          fixed_cost?: number
          id?: string
          name?: string
          phone?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          email: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "seller" | "production"
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
      app_role: ["admin", "seller", "production"],
    },
  },
} as const
