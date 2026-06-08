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
    const clientId = Deno.env.get("SNAPTRADE_CLIENT_ID");
    const consumerKey = Deno.env.get("SNAPTRADE_CONSUMER_KEY");
    if (!clientId || !consumerKey) {
      throw new Error("Snaptrade credentials not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }

    const supaAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supaAuth.auth.getUser();
    if (userError || !user) {
      return jsonResponse(req, { error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    // Server-side lookup of the encrypted Snaptrade user_secret.
    const supaAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: conn } = await supaAdmin
      .from("snaptrade_connections")
      .select("user_secret")
      .eq("user_id", userId)
      .maybeSingle();

    const userSecret = conn?.user_secret as string | undefined;
    if (!userSecret) {
      return jsonResponse(
        req,
        { error: "No Snaptrade connection found for this user" },
        { status: 404 },
      );
    }

    const { action } = await req.json();
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

    const makeRequest = async (path: string, method = "GET") => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signature = await generateSignature(path, timestamp);
      const url = new URL(`${baseUrl}${path}`);
      url.searchParams.set("userId", userId);
      url.searchParams.set("userSecret", userSecret);

      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
          "Timestamp": timestamp,
          "clientId": clientId,
          "Signature": signature,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Request failed: ${response.status}`);
      }
      return response.json();
    };

    const actionPath: Record<string, string> = {
      getAccounts: "/accounts",
      getHoldings: "/holdings",
      getPositions: "/positions",
      getTransactions: "/activities",
    };
    const path = actionPath[action];
    if (!path) throw new Error("Invalid action");

    const result = await makeRequest(path);
    return jsonResponse(req, result);
  } catch (error: unknown) {
    console.error("Snaptrade accounts error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse(req, { error: message }, { status: 500 });
  }
});
