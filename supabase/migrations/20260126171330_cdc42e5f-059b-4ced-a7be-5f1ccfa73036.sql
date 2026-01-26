-- Create table for saved paycheck configurations
CREATE TABLE public.paycheck_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  gross_pay NUMERIC NOT NULL,
  pay_frequency TEXT NOT NULL DEFAULT 'biweekly',
  zip_code TEXT NOT NULL,
  filing_status TEXT NOT NULL DEFAULT 'single',
  allowances INTEGER NOT NULL DEFAULT 0,
  pre_tax_deductions JSONB NOT NULL DEFAULT '[]'::jsonb,
  post_tax_deductions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.paycheck_configurations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own paycheck configurations"
ON public.paycheck_configurations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own paycheck configurations"
ON public.paycheck_configurations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paycheck configurations"
ON public.paycheck_configurations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paycheck configurations"
ON public.paycheck_configurations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_paycheck_configurations_updated_at
BEFORE UPDATE ON public.paycheck_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();