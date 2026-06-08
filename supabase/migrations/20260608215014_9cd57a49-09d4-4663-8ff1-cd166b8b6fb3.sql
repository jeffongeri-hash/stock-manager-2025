-- ============================================================
-- Lock down sensitive columns from the `authenticated` role.
-- RLS scopes rows to the owner, but column-level SELECT still
-- leaks secret data (TOTP seeds, backup codes, Stripe IDs).
-- ============================================================

-- two_factor_settings: revoke ALL from authenticated, then re-grant
-- only the safe columns. Inserts/updates go through edge functions.
REVOKE ALL ON public.two_factor_settings FROM authenticated;
GRANT SELECT (id, user_id, is_enabled, verified_at, created_at, updated_at)
  ON public.two_factor_settings TO authenticated;
GRANT INSERT (user_id, is_enabled, secret_encrypted, backup_codes)
  ON public.two_factor_settings TO authenticated;
GRANT UPDATE (is_enabled, secret_encrypted, backup_codes, verified_at)
  ON public.two_factor_settings TO authenticated;
GRANT DELETE ON public.two_factor_settings TO authenticated;

-- subscriptions: hide Stripe IDs from the client. Only show fields
-- the UI actually needs (status, period, environment, etc).
REVOKE ALL ON public.subscriptions FROM authenticated;
GRANT SELECT (
  id, user_id, product_id, price_id, status,
  current_period_start, current_period_end, cancel_at_period_end,
  environment, created_at, updated_at
) ON public.subscriptions TO authenticated;
-- No INSERT/UPDATE/DELETE for authenticated; service_role only.

-- ============================================================
-- Revoke EXECUTE on internal SECURITY DEFINER functions from
-- the `authenticated` role. These should only be called by
-- triggers or service_role contexts.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_broker_token(uuid, bytea) FROM authenticated, anon, PUBLIC;
-- get_broker_tokens / store_broker_tokens are intentionally callable
-- by authenticated (they internally check auth.uid()), but the
-- broker_connections table no longer exists. Revoke to remove dead surface.
REVOKE EXECUTE ON FUNCTION public.get_broker_tokens(text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.store_broker_tokens(text, text, text, timestamptz, jsonb, text) FROM authenticated, anon, PUBLIC;

-- has_role, current_user_has_role, has_active_subscription remain
-- executable by authenticated because they enforce auth.uid()
-- internally and are used by RLS / app logic.

-- ============================================================
-- Realtime: rule_execution_logs is published to realtime, but
-- there is no policy on realtime.messages, so any authenticated
-- user can subscribe to anyone's channel. Remove from publication
-- (clients can poll via standard SELECT which is RLS-protected).
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'rule_execution_logs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.rule_execution_logs';
  END IF;
END $$;
