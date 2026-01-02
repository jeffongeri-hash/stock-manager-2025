-- Create table for optimization results
CREATE TABLE public.optimization_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  strategy_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  parameters JSONB NOT NULL,
  best_combination JSONB NOT NULL,
  all_results JSONB NOT NULL,
  best_return NUMERIC NOT NULL,
  best_sharpe NUMERIC,
  best_max_drawdown NUMERIC,
  total_combinations INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own optimization results" 
ON public.optimization_results 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own optimization results" 
ON public.optimization_results 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own optimization results" 
ON public.optimization_results 
FOR DELETE 
USING (auth.uid() = user_id);