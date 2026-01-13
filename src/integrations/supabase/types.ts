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
      automated_trade_performance: {
        Row: {
          created_at: string
          entry_price: number
          entry_time: string
          execution_strategy: string | null
          exit_price: number | null
          exit_time: string | null
          fees: number | null
          id: string
          instruction: string
          notes: string | null
          quantity: number
          realized_pnl: number | null
          rule_id: string | null
          slippage: number | null
          status: string
          symbol: string
          unrealized_pnl: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_price: number
          entry_time?: string
          execution_strategy?: string | null
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          id?: string
          instruction: string
          notes?: string | null
          quantity: number
          realized_pnl?: number | null
          rule_id?: string | null
          slippage?: number | null
          status?: string
          symbol: string
          unrealized_pnl?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          entry_price?: number
          entry_time?: string
          execution_strategy?: string | null
          exit_price?: number | null
          exit_time?: string | null
          fees?: number | null
          id?: string
          instruction?: string
          notes?: string | null
          quantity?: number
          realized_pnl?: number | null
          rule_id?: string | null
          slippage?: number | null
          status?: string
          symbol?: string
          unrealized_pnl?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automated_trade_performance_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "trading_rules"
            referencedColumns: ["id"]
          },
        ]
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
      broker_connections: {
        Row: {
          access_token: string | null
          access_token_encrypted: string | null
          accounts: Json | null
          broker_type: string
          created_at: string
          id: string
          refresh_token: string | null
          refresh_token_encrypted: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          access_token_encrypted?: string | null
          accounts?: Json | null
          broker_type: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          access_token_encrypted?: string | null
          accounts?: Json | null
          broker_type?: string
          created_at?: string
          id?: string
          refresh_token?: string | null
          refresh_token_encrypted?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      optimization_results: {
        Row: {
          all_results: Json
          best_combination: Json
          best_max_drawdown: number | null
          best_return: number
          best_sharpe: number | null
          created_at: string
          id: string
          parameters: Json
          strategy_name: string
          symbol: string
          timeframe: string
          total_combinations: number
          user_id: string
        }
        Insert: {
          all_results: Json
          best_combination: Json
          best_max_drawdown?: number | null
          best_return: number
          best_sharpe?: number | null
          created_at?: string
          id?: string
          parameters: Json
          strategy_name: string
          symbol: string
          timeframe: string
          total_combinations: number
          user_id: string
        }
        Update: {
          all_results?: Json
          best_combination?: Json
          best_max_drawdown?: number | null
          best_return?: number
          best_sharpe?: number | null
          created_at?: string
          id?: string
          parameters?: Json
          strategy_name?: string
          symbol?: string
          timeframe?: string
          total_combinations?: number
          user_id?: string
        }
        Relationships: []
      }
      order_executions: {
        Row: {
          account_id: string
          broker_type: string
          created_at: string
          error_message: string | null
          executed_at: string | null
          id: string
          instruction: string
          order_id: string | null
          order_type: string
          price: number | null
          quantity: number
          status: string
          stop_price: number | null
          symbol: string
          user_id: string
        }
        Insert: {
          account_id: string
          broker_type: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          instruction: string
          order_id?: string | null
          order_type: string
          price?: number | null
          quantity: number
          status?: string
          stop_price?: number | null
          symbol: string
          user_id: string
        }
        Update: {
          account_id?: string
          broker_type?: string
          created_at?: string
          error_message?: string | null
          executed_at?: string | null
          id?: string
          instruction?: string
          order_id?: string | null
          order_type?: string
          price?: number | null
          quantity?: number
          status?: string
          stop_price?: number | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_trading_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          final_balance: number
          id: string
          initial_balance: number
          max_drawdown: number | null
          session_data: Json | null
          strategy: string
          symbol: string
          total_pnl: number
          total_trades: number
          user_id: string
          win_rate: number | null
          winning_trades: number
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          final_balance: number
          id?: string
          initial_balance?: number
          max_drawdown?: number | null
          session_data?: Json | null
          strategy: string
          symbol: string
          total_pnl?: number
          total_trades?: number
          user_id: string
          win_rate?: number | null
          winning_trades?: number
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          final_balance?: number
          id?: string
          initial_balance?: number
          max_drawdown?: number | null
          session_data?: Json | null
          strategy?: string
          symbol?: string
          total_pnl?: number
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
      risk_settings: {
        Row: {
          created_at: string
          current_daily_pnl: number | null
          current_weekly_pnl: number | null
          halt_reason: string | null
          id: string
          is_trading_halted: boolean | null
          max_daily_loss: number | null
          max_open_positions: number | null
          max_position_percent: number | null
          max_position_size: number | null
          max_weekly_loss: number | null
          pnl_reset_date: string | null
          stop_loss_percent: number | null
          take_profit_percent: number | null
          trailing_stop_enabled: boolean | null
          trailing_stop_percent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_daily_pnl?: number | null
          current_weekly_pnl?: number | null
          halt_reason?: string | null
          id?: string
          is_trading_halted?: boolean | null
          max_daily_loss?: number | null
          max_open_positions?: number | null
          max_position_percent?: number | null
          max_position_size?: number | null
          max_weekly_loss?: number | null
          pnl_reset_date?: string | null
          stop_loss_percent?: number | null
          take_profit_percent?: number | null
          trailing_stop_enabled?: boolean | null
          trailing_stop_percent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_daily_pnl?: number | null
          current_weekly_pnl?: number | null
          halt_reason?: string | null
          id?: string
          is_trading_halted?: boolean | null
          max_daily_loss?: number | null
          max_open_positions?: number | null
          max_position_percent?: number | null
          max_position_size?: number | null
          max_weekly_loss?: number | null
          pnl_reset_date?: string | null
          stop_loss_percent?: number | null
          take_profit_percent?: number | null
          trailing_stop_enabled?: boolean | null
          trailing_stop_percent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rule_execution_logs: {
        Row: {
          action_taken: Json
          conditions_met: Json
          created_at: string
          error_message: string | null
          execution_result: Json | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          rule_id: string | null
          rule_name: string
          symbol: string | null
          triggered_at: string
          user_id: string
        }
        Insert: {
          action_taken: Json
          conditions_met?: Json
          created_at?: string
          error_message?: string | null
          execution_result?: Json | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          rule_id?: string | null
          rule_name: string
          symbol?: string | null
          triggered_at?: string
          user_id: string
        }
        Update: {
          action_taken?: Json
          conditions_met?: Json
          created_at?: string
          error_message?: string | null
          execution_result?: Json | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          rule_id?: string | null
          rule_name?: string
          symbol?: string | null
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_execution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "trading_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_schedules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string | null
          rule_id: string | null
          schedule_config: Json
          schedule_type: string
          timezone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          rule_id?: string | null
          schedule_config?: Json
          schedule_type: string
          timezone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string | null
          rule_id?: string | null
          schedule_config?: Json
          schedule_type?: string
          timezone?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_schedules_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "trading_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_dividend_stocks: {
        Row: {
          annual_dividend: number
          cost_basis: number
          created_at: string
          dividend_yield: number
          drip_enabled: boolean
          frequency: string
          id: string
          next_ex_date: string | null
          payment_date: string | null
          shares: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annual_dividend?: number
          cost_basis?: number
          created_at?: string
          dividend_yield?: number
          drip_enabled?: boolean
          frequency?: string
          id?: string
          next_ex_date?: string | null
          payment_date?: string | null
          shares?: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annual_dividend?: number
          cost_basis?: number
          created_at?: string
          dividend_yield?: number
          drip_enabled?: boolean
          frequency?: string
          id?: string
          next_ex_date?: string | null
          payment_date?: string | null
          shares?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_etf_comparisons: {
        Row: {
          created_at: string
          id: string
          name: string
          symbols: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          symbols: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          symbols?: string[]
          updated_at?: string
          user_id?: string
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
          is_public: boolean | null
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
          is_public?: boolean | null
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
          is_public?: boolean | null
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
      trading_rules: {
        Row: {
          action: Json
          conditions: Json
          created_at: string
          description: string | null
          execution_params: Json | null
          execution_strategy: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          logic_operator: string
          name: string
          trigger_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          action: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          execution_params?: Json | null
          execution_strategy?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          logic_operator?: string
          name: string
          trigger_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          execution_params?: Json | null
          execution_strategy?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          logic_operator?: string
          name?: string
          trigger_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      two_factor_settings: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean
          secret_encrypted: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret_encrypted?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean
          secret_encrypted?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
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
      user_settings: {
        Row: {
          created_at: string
          id: string
          page_name: string
          settings_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_name: string
          settings_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_name?: string
          settings_data?: Json
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
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      decrypt_broker_token: {
        Args: { encrypted_token: string; user_id_param: string }
        Returns: string
      }
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
