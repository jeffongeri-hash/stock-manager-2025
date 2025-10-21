-- Create table for stock trades
CREATE TABLE public.stock_trades (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  symbol text NOT NULL,
  entry_price numeric NOT NULL,
  exit_price numeric,
  quantity integer NOT NULL,
  entry_date date NOT NULL,
  exit_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_trades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own stock trades" 
ON public.stock_trades 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stock trades" 
ON public.stock_trades 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stock trades" 
ON public.stock_trades 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stock trades" 
ON public.stock_trades 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_stock_trades_updated_at
BEFORE UPDATE ON public.stock_trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();