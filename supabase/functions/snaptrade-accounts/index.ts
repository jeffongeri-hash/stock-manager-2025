import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("SNAPTRADE_CLIENT_ID");
    const consumerKey = Deno.env.get("SNAPTRADE_CONSUMER_KEY");

    if (!clientId || !consumerKey) {
      throw new Error("Snaptrade credentials not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { action, userSecret } = await req.json();
    const userId = user.id;

    const baseUrl = "https://api.snaptrade.com/api/v1";

    // Generate signature for authentication
    const generateSignature = async (path: string, timestamp: string) => {
      const message = `${path}${timestamp}${consumerKey}`;
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(consumerKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
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
        const error = await response.json();
        throw new Error(error.message || `Request failed: ${response.status}`);
      }

      return response.json();
    };

    if (action === "getAccounts") {
      const accounts = await makeRequest("/accounts");
      return new Response(JSON.stringify(accounts), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getHoldings") {
      const holdings = await makeRequest("/holdings");
      return new Response(JSON.stringify(holdings), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getPositions") {
      const positions = await makeRequest("/positions");
      return new Response(JSON.stringify(positions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getTransactions") {
      const transactions = await makeRequest("/activities");
      return new Response(JSON.stringify(transactions), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("Snaptrade accounts error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
