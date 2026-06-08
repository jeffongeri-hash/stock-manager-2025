
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  function_name TEXT NOT NULL,
  usage_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, usage_date)
);

GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
  ON public.ai_usage_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_ai_usage_user_date ON public.ai_usage_log(user_id, usage_date);

CREATE OR REPLACE FUNCTION public.check_and_increment_ai_usage(
  _user_id UUID,
  _function_name TEXT,
  _daily_limit INTEGER DEFAULT 200
)
RETURNS TABLE(allowed BOOLEAN, current_count INTEGER, daily_limit INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today DATE := (now() AT TIME ZONE 'utc')::date;
  new_count INTEGER;
BEGIN
  INSERT INTO public.ai_usage_log (user_id, function_name, usage_date, request_count)
  VALUES (_user_id, _function_name, today, 1)
  ON CONFLICT (user_id, usage_date)
  DO UPDATE SET request_count = ai_usage_log.request_count + 1,
                updated_at = now(),
                function_name = EXCLUDED.function_name
  RETURNING request_count INTO new_count;

  RETURN QUERY SELECT (new_count <= _daily_limit), new_count, _daily_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(UUID, TEXT, INTEGER) TO authenticated, service_role;
