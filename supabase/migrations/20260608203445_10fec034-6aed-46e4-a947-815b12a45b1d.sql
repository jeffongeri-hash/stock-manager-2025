
REVOKE EXECUTE ON FUNCTION public.check_and_increment_ai_usage(UUID, TEXT, INTEGER) FROM authenticated, anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_ai_usage(UUID, TEXT, INTEGER) TO service_role;
