// Shared helper: require an authenticated user with an active Pro subscription,
// AND enforce a per-user-per-day AI request cap to protect the Gemini bill.
import { createClient } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DAILY_AI_LIMIT = 200;

export interface SubscriptionGuardResult {
  ok: true;
  userId: string;
  supabase: ReturnType<typeof createClient>;
  usage: { count: number; limit: number };
}

export interface SubscriptionGuardError {
  ok: false;
  response: Response;
}

/**
 * Verifies the JWT, an active subscription, and that the user is under their
 * daily AI request cap. Caller passes a stable function name for usage tracking.
 */
export async function requireProSubscription(
  req: Request,
  functionName = "unknown",
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

  // User-scoped client (for identity)
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: userData, error: userErr } = await userClient.auth.getUser();
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

  // Subscription check
  const { data: hasSub, error: subErr } = await userClient.rpc(
    "has_active_subscription",
    { user_uuid: userId, check_env: "live" },
  );
  if (subErr) {
    console.error("Subscription check failed:", subErr);
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Subscription check failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }
  if (!hasSub) {
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: "Pro subscription required", code: "subscription_required" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      ),
    };
  }

  // Service-role client for atomic rate-limit increment
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: usage, error: usageErr } = await adminClient.rpc(
    "check_and_increment_ai_usage",
    { _user_id: userId, _function_name: functionName, _daily_limit: DAILY_AI_LIMIT },
  );
  if (usageErr) {
    console.error("Rate limit check failed:", usageErr);
    // Fail open on tracking errors (don't block paying customers on infra blips)
  } else {
    const row = Array.isArray(usage) ? usage[0] : usage;
    if (row && row.allowed === false) {
      return {
        ok: false,
        response: new Response(
          JSON.stringify({
            error: `Daily AI request limit reached (${row.daily_limit}/day). Try again tomorrow.`,
            code: "rate_limit_exceeded",
            current_count: row.current_count,
            daily_limit: row.daily_limit,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        ),
      };
    }
  }

  const row = Array.isArray(usage) ? usage[0] : usage;
  return {
    ok: true,
    userId,
    supabase: userClient,
    usage: {
      count: row?.current_count ?? 0,
      limit: row?.daily_limit ?? DAILY_AI_LIMIT,
    },
  };
}
