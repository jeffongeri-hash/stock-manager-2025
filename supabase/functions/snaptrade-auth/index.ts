import { createClient } from "npm:@supabase/supabase-js@2";
import { corsFor, handlePreflight, jsonResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;
  if (!corsFor(req)) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Verify caller identity (JWT)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }
    const supaAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supaAuth.auth.getUser();
    if (userErr || !user) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }

    // Service-role client for reading/writing the encrypted secret server-side only.
    const supaAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const clientId = Deno.env.get("SNAPTRADE_CLIENT_ID");
    const consumerKey = Deno.env.get("SNAPTRADE_CONSUMER_KEY");
    if (!clientId || !consumerKey) {
      throw new Error("Snaptrade credentials not configured");
    }

    const { action, redirectUri } = await req.json();
    const userId = user.id; // forced to authenticated user — prevent impersonation

    const baseUrl = "https://api.snaptrade.com/api/v1";

    const generateSignature = async (path: string, timestamp: string) => {
      const message = `${path}${timestamp}${consumerKey}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(consumerKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
      return btoa(String.fromCharCode(...new Uint8Array(sig)));
    };

    // Lookup the stored Snaptrade user_secret for this authenticated user.
    const loadUserSecret = async (): Promise<string | null> => {
      const { data } = await supaAdmin
        .from("snaptrade_connections")
        .select("user_secret")
        .eq("user_id", userId)
        .maybeSingle();
      return (data?.user_secret as string | undefined) ?? null;
    };

    if (action === "register") {
      // If we already have a stored secret, reuse it (Snaptrade is idempotent per user).
      const existing = await loadUserSecret();
      if (existing) {
        return jsonResponse(req, { userId, registered: true });
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const path = "/snapTrade/registerUser";
      const signature = await generateSignature(path, timestamp);

      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Timestamp": timestamp,
          "clientId": clientId,
          "Signature": signature,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to register user");
      }

      const userSecret: string | undefined = data.userSecret;
      if (!userSecret) throw new Error("No userSecret returned by Snaptrade");

      // Persist server-side. RLS is bypassed via service role.
      const { error: upsertErr } = await supaAdmin
        .from("snaptrade_connections")
        .upsert(
          {
            user_id: userId,
            user_secret: userSecret,
            is_connected: false,
            accounts: [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      if (upsertErr) throw new Error(`Failed to store credentials: ${upsertErr.message}`);

      // Do NOT return the secret to the client.
      return jsonResponse(req, { userId, registered: true });
    }

    if (action === "getLoginLink") {
      const userSecret = await loadUserSecret();
      if (!userSecret) {
        return jsonResponse(
          req,
          { error: "Not registered with Snaptrade" },
          { status: 400 },
        );
      }

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const path = "/snapTrade/login";
      const signature = await generateSignature(path, timestamp);

      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Timestamp": timestamp,
          "clientId": clientId,
          "Signature": signature,
        },
        body: JSON.stringify({
          userId,
          userSecret,
          broker: "ALL",
          immediateRedirect: true,
          customRedirect: redirectUri,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to get login link");
      }
      return jsonResponse(req, data);
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("Snaptrade auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(req, { error: message }, { status: 500 });
  }
});
