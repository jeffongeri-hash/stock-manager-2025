-- Create table for saved dividend stocks
CREATE TABLE public.saved_dividend_stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  shares NUMERIC NOT NULL DEFAULT 0,
  cost_basis NUMERIC NOT NULL DEFAULT 0,
  annual_dividend NUMERIC NOT NULL DEFAULT 0,
  dividend_yield NUMERIC NOT NULL DEFAULT 0,
  frequency TEXT NOT NULL DEFAULT 'quarterly',
  next_ex_date DATE,
  payment_date DATE,
  drip_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Enable Row Level Security
ALTER TABLE public.saved_dividend_stocks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own dividend stocks" 
ON public.saved_dividend_stocks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own dividend stocks" 
ON public.saved_dividend_stocks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own dividend stocks" 
ON public.saved_dividend_stocks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own dividend stocks" 
ON public.saved_dividend_stocks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_dividend_stocks_updated_at
BEFORE UPDATE ON public.saved_dividend_stocks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();