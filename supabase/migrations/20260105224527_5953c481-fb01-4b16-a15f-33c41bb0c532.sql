-- Create table for 2FA settings
CREATE TABLE public.two_factor_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  secret_encrypted TEXT,
  backup_codes TEXT[],
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.two_factor_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own 2FA settings"
ON public.two_factor_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
ON public.two_factor_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
ON public.two_factor_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_two_factor_settings_updated_at
BEFORE UPDATE ON public.two_factor_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();