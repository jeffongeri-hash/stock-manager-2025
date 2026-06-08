-- Re-grant EXECUTE on has_active_subscription to authenticated so edge functions
-- (running with the user's JWT) can call it to gate Gemini-powered endpoints.
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;