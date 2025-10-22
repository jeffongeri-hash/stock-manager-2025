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
      alerts: {
        Row: {
          alert_type: string
          condition: string
          created_at: string
          id: string
          is_active: boolean | null
          symbol: string
          target_value: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          alert_type: string
          condition: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          symbol: string
          target_value: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string
          condition?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          symbol?: string
          target_value?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      backtest_results: {
        Row: {
          created_at: string
          end_date: string
          final_capital: number
          id: string
          initial_capital: number
          parameters: Json | null
          results_data: Json | null
          start_date: string
          strategy_name: string
          symbol: string
          total_trades: number
          user_id: string
          win_rate: number | null
          winning_trades: number
        }
        Insert: {
          created_at?: string
          end_date: string
          final_capital: number
          id?: string
          initial_capital: number
          parameters?: Json | null
          results_data?: Json | null
          start_date: string
          strategy_name: string
          symbol: string
          total_trades: number
          user_id: string
          win_rate?: number | null
          winning_trades: number
        }
        Update: {
          created_at?: string
          end_date?: string
          final_capital?: number
          id?: string
          initial_capital?: number
          parameters?: Json | null
          results_data?: Json | null
          start_date?: string
          strategy_name?: string
          symbol?: string
          total_trades?: number
          user_id?: string
          win_rate?: number | null
          winning_trades?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      report_settings: {
        Row: {
          created_at: string
          daily_report: boolean | null
          email_address: string | null
          id: string
          monthly_report: boolean | null
          updated_at: string
          user_id: string
          weekly_report: boolean | null
          zapier_webhook: string | null
        }
        Insert: {
          created_at?: string
          daily_report?: boolean | null
          email_address?: string | null
          id?: string
          monthly_report?: boolean | null
          updated_at?: string
          user_id: string
          weekly_report?: boolean | null
          zapier_webhook?: string | null
        }
        Update: {
          created_at?: string
          daily_report?: boolean | null
          email_address?: string | null
          id?: string
          monthly_report?: boolean | null
          updated_at?: string
          user_id?: string
          weekly_report?: boolean | null
          zapier_webhook?: string | null
        }
        Relationships: []
      }
      stock_trades: {
        Row: {
          created_at: string
          entry_date: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          id: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          quantity: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_idea_likes: {
        Row: {
          created_at: string
          id: string
          trade_idea_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trade_idea_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trade_idea_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_idea_likes_trade_idea_id_fkey"
            columns: ["trade_idea_id"]
            isOneToOne: false
            referencedRelation: "trade_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ideas: {
        Row: {
          created_at: string
          description: string
          entry_price: number | null
          id: string
          idea_type: string
          likes_count: number | null
          stop_loss: number | null
          symbol: string
          tags: string[] | null
          target_price: number | null
          timeframe: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          entry_price?: number | null
          id?: string
          idea_type: string
          likes_count?: number | null
          stop_loss?: number | null
          symbol: string
          tags?: string[] | null
          target_price?: number | null
          timeframe?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          entry_price?: number | null
          id?: string
          idea_type?: string
          likes_count?: number | null
          stop_loss?: number | null
          symbol?: string
          tags?: string[] | null
          target_price?: number | null
          timeframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          created_at: string
          emotions: string | null
          entry_date: string
          exit_date: string | null
          id: string
          lessons_learned: string | null
          notes: string | null
          profit_loss: number | null
          screenshot_url: string | null
          strategy: string | null
          symbol: string
          tags: string[] | null
          trade_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotions?: string | null
          entry_date: string
          exit_date?: string | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          profit_loss?: number | null
          screenshot_url?: string | null
          strategy?: string | null
          symbol: string
          tags?: string[] | null
          trade_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotions?: string | null
          entry_date?: string
          exit_date?: string | null
          id?: string
          lessons_learned?: string | null
          notes?: string | null
          profit_loss?: number | null
          screenshot_url?: string | null
          strategy?: string | null
          symbol?: string
          tags?: string[] | null
          trade_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trades: {
        Row: {
          action: string
          created_at: string
          date: string
          expiration: string
          id: string
          premium: number
          quantity: number
          strategy: string | null
          strike: number
          symbol: string
          total_value: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          date: string
          expiration: string
          id?: string
          premium: number
          quantity: number
          strategy?: string | null
          strike: number
          symbol: string
          total_value: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          date?: string
          expiration?: string
          id?: string
          premium?: number
          quantity?: number
          strategy?: string | null
          strike?: number
          symbol?: string
          total_value?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
