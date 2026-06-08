// Shared helper: require an authenticated user with an active Pro subscription.
// Use this to gate any edge function that consumes the Lovable AI gateway (Gemini),
// so an authenticated free-tier user cannot directly hit the function and run up the bill.
import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

export interface SubscriptionGuardResult {
  ok: true;
  userId: string;
  supabase: ReturnType<typeof createClient>;
}

export interface SubscriptionGuardError {
  ok: false;
  response: Response;
}

/**
 * Verifies the JWT and that the user has an active subscription.
 * Returns either { ok: true, ... } or { ok: false, response } — caller should return the response.
 */
export async function requireProSubscription(
  req: Request,
): Promise<SubscriptionGuardResult | SubscriptionGuardError> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const userId = userData.user.id;

  // Server-side subscription check via SECURITY DEFINER function.
  const { data: hasSub, error: subErr } = await supabase.rpc(
    "has_active_subscription",
    { user_uuid: userId, check_env: "live" },
  );

  if (subErr) {
    console.error("Subscription check failed:", subErr);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Subscription check failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }

  if (!hasSub) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({
          error: "Pro subscription required",
          code: "subscription_required",
        }),
        {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      ),
    };
  }

  return { ok: true, userId, supabase };
}
