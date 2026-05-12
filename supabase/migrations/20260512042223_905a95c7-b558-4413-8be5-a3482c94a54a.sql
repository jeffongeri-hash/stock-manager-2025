DROP TABLE IF EXISTS public.broker_connections CASCADE;
DROP FUNCTION IF EXISTS public.store_broker_tokens(uuid, text, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.get_broker_tokens(uuid, text);