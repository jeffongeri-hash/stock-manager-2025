
-- Lock down user_secret column: only service_role may read or write it.
REVOKE ALL ON public.snaptrade_connections FROM authenticated;
REVOKE ALL ON public.snaptrade_connections FROM anon;

GRANT SELECT (id, user_id, is_connected, accounts, created_at, updated_at)
  ON public.snaptrade_connections TO authenticated;
GRANT INSERT (id, user_id, is_connected, accounts)
  ON public.snaptrade_connections TO authenticated;
GRANT UPDATE (is_connected, accounts, updated_at)
  ON public.snaptrade_connections TO authenticated;
GRANT DELETE ON public.snaptrade_connections TO authenticated;
GRANT ALL ON public.snaptrade_connections TO service_role;

-- Allow user_secret to be NULL so client-side INSERTs (without the column) work;
-- backend writes the secret immediately after Snaptrade registration.
ALTER TABLE public.snaptrade_connections ALTER COLUMN user_secret DROP NOT NULL;
