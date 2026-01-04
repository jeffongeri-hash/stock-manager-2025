-- Create broker_connections table for storing OAuth tokens
CREATE TABLE public.broker_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_type TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  accounts JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker_type)
);

-- Create order_executions table for tracking order history
CREATE TABLE public.order_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_type TEXT NOT NULL,
  account_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  order_type TEXT NOT NULL,
  instruction TEXT NOT NULL,
  price DECIMAL,
  stop_price DECIMAL,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for broker_connections
CREATE POLICY "Users can view their own broker connections"
ON public.broker_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own broker connections"
ON public.broker_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own broker connections"
ON public.broker_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own broker connections"
ON public.broker_connections FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for order_executions
CREATE POLICY "Users can view their own order executions"
ON public.order_executions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own order executions"
ON public.order_executions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for broker_connections
CREATE TRIGGER update_broker_connections_updated_at
BEFORE UPDATE ON public.broker_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();