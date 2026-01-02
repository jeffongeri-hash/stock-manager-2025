-- Create paper trading sessions table
CREATE TABLE public.paper_trading_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  strategy TEXT NOT NULL,
  initial_balance NUMERIC NOT NULL DEFAULT 100000,
  final_balance NUMERIC NOT NULL,
  total_trades INTEGER NOT NULL DEFAULT 0,
  winning_trades INTEGER NOT NULL DEFAULT 0,
  total_pnl NUMERIC NOT NULL DEFAULT 0,
  win_rate NUMERIC,
  max_drawdown NUMERIC,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.paper_trading_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own paper trading sessions"
ON public.paper_trading_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paper trading sessions"
ON public.paper_trading_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own paper trading sessions"
ON public.paper_trading_sessions
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own paper trading sessions"
ON public.paper_trading_sessions
FOR DELETE
USING (auth.uid() = user_id);