
-- 1. Drop the trigger that depends on the plaintext columns
DROP TRIGGER IF EXISTS encrypt_broker_tokens_trigger ON public.broker_connections;
DROP FUNCTION IF EXISTS public.encrypt_broker_tokens();

-- 2. Drop the plaintext token columns
ALTER TABLE public.broker_connections DROP COLUMN IF EXISTS access_token;
ALTER TABLE public.broker_connections DROP COLUMN IF EXISTS refresh_token;

-- 3. RPC: store/upsert encrypted broker tokens for the calling user
CREATE OR REPLACE FUNCTION public.store_broker_tokens(
  broker_type_param text,
  access_token_param text,
  refresh_token_param text,
  expires_at_param timestamptz,
  accounts_param jsonb DEFAULT NULL,
  status_param text DEFAULT 'connected'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  encryption_key bytea;
  enc_access bytea;
  enc_refresh bytea;
  conn_id uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF broker_type_param IS NULL OR broker_type_param NOT IN ('schwab','ibkr','snaptrade') THEN
    RAISE EXCEPTION 'Invalid broker_type';
  END IF;

  encryption_key := digest(uid::text || 'broker_token_salt_v1', 'sha256');

  IF access_token_param IS NOT NULL AND access_token_param <> '' THEN
    enc_access := pgp_sym_encrypt(access_token_param, encode(encryption_key, 'hex'));
  END IF;
  IF refresh_token_param IS NOT NULL AND refresh_token_param <> '' THEN
    enc_refresh := pgp_sym_encrypt(refresh_token_param, encode(encryption_key, 'hex'));
  END IF;

  INSERT INTO public.broker_connections AS bc (
    user_id, broker_type, access_token_encrypted, refresh_token_encrypted,
    token_expires_at, accounts, status
  ) VALUES (
    uid, broker_type_param, enc_access, enc_refresh,
    expires_at_param, COALESCE(accounts_param, '[]'::jsonb), status_param
  )
  ON CONFLICT (user_id, broker_type) DO UPDATE
    SET access_token_encrypted  = COALESCE(EXCLUDED.access_token_encrypted,  bc.access_token_encrypted),
        refresh_token_encrypted = COALESCE(EXCLUDED.refresh_token_encrypted, bc.refresh_token_encrypted),
        token_expires_at        = COALESCE(EXCLUDED.token_expires_at,        bc.token_expires_at),
        accounts                = COALESCE(EXCLUDED.accounts,                bc.accounts),
        status                  = COALESCE(EXCLUDED.status,                  bc.status),
        updated_at              = now()
  RETURNING bc.id INTO conn_id;

  RETURN conn_id;
END;
$$;

REVOKE ALL ON FUNCTION public.store_broker_tokens(text,text,text,timestamptz,jsonb,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.store_broker_tokens(text,text,text,timestamptz,jsonb,text) TO authenticated, service_role;

-- 4. RPC: read decrypted broker tokens for the calling user
CREATE OR REPLACE FUNCTION public.get_broker_tokens(broker_type_param text)
RETURNS TABLE (
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  status text,
  accounts jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  encryption_key bytea;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  encryption_key := digest(uid::text || 'broker_token_salt_v1', 'sha256');

  RETURN QUERY
  SELECT
    CASE WHEN bc.access_token_encrypted IS NOT NULL
         THEN pgp_sym_decrypt(bc.access_token_encrypted, encode(encryption_key, 'hex'))
         ELSE NULL END,
    CASE WHEN bc.refresh_token_encrypted IS NOT NULL
         THEN pgp_sym_decrypt(bc.refresh_token_encrypted, encode(encryption_key, 'hex'))
         ELSE NULL END,
    bc.token_expires_at,
    bc.status,
    bc.accounts
  FROM public.broker_connections bc
  WHERE bc.user_id = uid AND bc.broker_type = broker_type_param;
END;
$$;

REVOKE ALL ON FUNCTION public.get_broker_tokens(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_broker_tokens(text) TO authenticated, service_role;
