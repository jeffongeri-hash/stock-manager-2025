-- Trading rules with multi-condition support
CREATE TABLE public.trading_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  logic_operator TEXT NOT NULL DEFAULT 'AND' CHECK (logic_operator IN ('AND', 'OR')),
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  action JSONB NOT NULL,
  execution_strategy TEXT DEFAULT 'market' CHECK (execution_strategy IN ('market', 'limit', 'twap', 'vwap', 'iceberg')),
  execution_params JSONB DEFAULT '{}'::jsonb,
  trigger_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Rule schedules for time-based execution
CREATE TABLE public.rule_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.trading_rules(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('time', 'market_open', 'market_close', 'interval', 'volatility')),
  schedule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  timezone TEXT DEFAULT 'America/New_York',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Risk management settings
CREATE TABLE public.risk_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  max_position_size NUMERIC DEFAULT 10000,
  max_position_percent NUMERIC DEFAULT 5,
  max_daily_loss NUMERIC DEFAULT 1000,
  max_weekly_loss NUMERIC DEFAULT 5000,
  max_open_positions INTEGER DEFAULT 10,
  stop_loss_percent NUMERIC DEFAULT 2,
  take_profit_percent NUMERIC DEFAULT 5,
  trailing_stop_enabled BOOLEAN DEFAULT false,
  trailing_stop_percent NUMERIC DEFAULT 1,
  current_daily_pnl NUMERIC DEFAULT 0,
  current_weekly_pnl NUMERIC DEFAULT 0,
  pnl_reset_date DATE DEFAULT CURRENT_DATE,
  is_trading_halted BOOLEAN DEFAULT false,
  halt_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Performance tracking for automated trades
CREATE TABLE public.automated_trade_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.trading_rules(id) ON DELETE SET NULL,
  symbol TEXT NOT NULL,
  instruction TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_time TIMESTAMP WITH TIME ZONE,
  realized_pnl NUMERIC,
  unrealized_pnl NUMERIC,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  execution_strategy TEXT,
  slippage NUMERIC,
  fees NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trading_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automated_trade_performance ENABLE ROW LEVEL SECURITY;

-- Trading rules policies
CREATE POLICY "Users can view their own trading rules" ON public.trading_rules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trading rules" ON public.trading_rules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trading rules" ON public.trading_rules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trading rules" ON public.trading_rules FOR DELETE USING (auth.uid() = user_id);

-- Rule schedules policies
CREATE POLICY "Users can view their own rule schedules" ON public.rule_schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own rule schedules" ON public.rule_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own rule schedules" ON public.rule_schedules FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own rule schedules" ON public.rule_schedules FOR DELETE USING (auth.uid() = user_id);

-- Risk settings policies
CREATE POLICY "Users can view their own risk settings" ON public.risk_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own risk settings" ON public.risk_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own risk settings" ON public.risk_settings FOR UPDATE USING (auth.uid() = user_id);

-- Performance tracking policies
CREATE POLICY "Users can view their own trade performance" ON public.automated_trade_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own trade performance" ON public.automated_trade_performance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trade performance" ON public.automated_trade_performance FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_trading_rules_updated_at BEFORE UPDATE ON public.trading_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_risk_settings_updated_at BEFORE UPDATE ON public.risk_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();