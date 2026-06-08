
-- 1. Allow users to delete their own report settings
CREATE POLICY "Users can delete own report settings"
ON public.report_settings FOR DELETE
USING (auth.uid() = user_id);

-- 2. Restrict trade_idea_likes visibility: own likes or likes on public ideas
DROP POLICY IF EXISTS "Users can view all likes" ON public.trade_idea_likes;
CREATE POLICY "Users can view relevant likes"
ON public.trade_idea_likes FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.trade_ideas ti
    WHERE ti.id = trade_idea_likes.trade_idea_id AND ti.is_public = true
  )
);

-- 3. Lock down SECURITY DEFINER helpers from anon/authenticated direct EXECUTE.
--    These should only be called by triggers, RLS, or service_role.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_broker_token(uuid, bytea) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon;
-- current_user_has_role is used by RLS; keep authenticated execute but revoke anon
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(app_role) FROM PUBLIC, anon;
-- get_broker_tokens and store_broker_tokens are called by signed-in users (auth.uid() inside)
REVOKE EXECUTE ON FUNCTION public.get_broker_tokens(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.store_broker_tokens(text, text, text, timestamptz, jsonb, text) FROM PUBLIC, anon;
