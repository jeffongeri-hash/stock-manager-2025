-- Trade Journal table with detailed notes
CREATE TABLE public.trade_journal (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trade_id uuid,
  symbol text NOT NULL,
  entry_date date NOT NULL,
  exit_date date,
  strategy text,
  notes text,
  emotions text,
  lessons_learned text,
  tags text[],
  screenshot_url text,
  profit_loss numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Alerts table
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  alert_type text NOT NULL, -- 'price', 'volatility', 'volume'
  condition text NOT NULL, -- 'above', 'below'
  target_value numeric NOT NULL,
  is_active boolean DEFAULT true,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trade Ideas Feed
CREATE TABLE public.trade_ideas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  idea_type text NOT NULL, -- 'bullish', 'bearish', 'neutral'
  description text NOT NULL,
  entry_price numeric,
  target_price numeric,
  stop_loss numeric,
  timeframe text,
  tags text[],
  likes_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trade Ideas Likes
CREATE TABLE public.trade_idea_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  trade_idea_id uuid REFERENCES public.trade_ideas(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, trade_idea_id)
);

-- Backtesting Results
CREATE TABLE public.backtest_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  strategy_name text NOT NULL,
  symbol text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  initial_capital numeric NOT NULL,
  final_capital numeric NOT NULL,
  total_trades integer NOT NULL,
  winning_trades integer NOT NULL,
  win_rate numeric,
  parameters jsonb,
  results_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Automated Reports Settings
CREATE TABLE public.report_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  daily_report boolean DEFAULT false,
  weekly_report boolean DEFAULT false,
  monthly_report boolean DEFAULT false,
  email_address text,
  zapier_webhook text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_idea_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for trade_journal
CREATE POLICY "Users can view own journal entries" ON public.trade_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal entries" ON public.trade_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON public.trade_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON public.trade_journal FOR DELETE USING (auth.uid() = user_id);

-- Create policies for alerts
CREATE POLICY "Users can view own alerts" ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- Create policies for trade_ideas
CREATE POLICY "Users can view all trade ideas" ON public.trade_ideas FOR SELECT USING (true);
CREATE POLICY "Users can insert own trade ideas" ON public.trade_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trade ideas" ON public.trade_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trade ideas" ON public.trade_ideas FOR DELETE USING (auth.uid() = user_id);

-- Create policies for trade_idea_likes
CREATE POLICY "Users can view all likes" ON public.trade_idea_likes FOR SELECT USING (true);
CREATE POLICY "Users can insert own likes" ON public.trade_idea_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.trade_idea_likes FOR DELETE USING (auth.uid() = user_id);

-- Create policies for backtest_results
CREATE POLICY "Users can view own backtest results" ON public.backtest_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backtest results" ON public.backtest_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own backtest results" ON public.backtest_results FOR DELETE USING (auth.uid() = user_id);

-- Create policies for report_settings
CREATE POLICY "Users can view own report settings" ON public.report_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own report settings" ON public.report_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own report settings" ON public.report_settings FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_trade_journal_updated_at
BEFORE UPDATE ON public.trade_journal
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_settings_updated_at
BEFORE UPDATE ON public.report_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();