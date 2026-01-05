-- Create rule execution logs table
CREATE TABLE public.rule_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID REFERENCES public.trading_rules(id) ON DELETE SET NULL,
  rule_name TEXT NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  conditions_met JSONB NOT NULL DEFAULT '[]',
  action_taken JSONB NOT NULL,
  execution_status TEXT NOT NULL DEFAULT 'pending',
  execution_result JSONB,
  symbol TEXT,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rule_execution_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own execution logs"
ON public.rule_execution_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own execution logs"
ON public.rule_execution_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own execution logs"
ON public.rule_execution_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_rule_execution_logs_user_triggered ON public.rule_execution_logs(user_id, triggered_at DESC);
CREATE INDEX idx_rule_execution_logs_rule_id ON public.rule_execution_logs(rule_id);