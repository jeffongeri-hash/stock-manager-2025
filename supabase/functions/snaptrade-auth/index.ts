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

    const { action, userId, userSecret, redirectUri } = await req.json();

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

    if (action === "register") {
      // Register a new user with Snaptrade
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

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "getLoginLink") {
      // Get the login link for the user to connect their brokerage
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
          broker: "ALL", // Allow connecting to any supported broker
          immediateRedirect: true,
          customRedirect: redirectUri,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to get login link");
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (error: unknown) {
    console.error("Snaptrade auth error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
