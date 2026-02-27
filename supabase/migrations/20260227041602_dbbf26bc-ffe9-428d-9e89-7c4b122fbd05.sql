
CREATE TABLE public.snaptrade_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_secret TEXT NOT NULL,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  accounts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.snaptrade_connections ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX snaptrade_connections_user_id_idx ON public.snaptrade_connections (user_id);

CREATE POLICY "Users can view their own snaptrade connection"
  ON public.snaptrade_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own snaptrade connection"
  ON public.snaptrade_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snaptrade connection"
  ON public.snaptrade_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snaptrade connection"
  ON public.snaptrade_connections FOR DELETE
  USING (auth.uid() = user_id);
