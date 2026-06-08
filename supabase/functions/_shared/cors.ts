// Origin-aware CORS for sensitive edge functions.
// Replaces "Access-Control-Allow-Origin: *" with a strict allowlist.

const ALLOWED_ORIGINS = new Set<string>([
  "https://profitpathfinder.online",
  "https://www.profitpathfinder.online",
  "https://stock-manager-2025.lovable.app",
]);

// Lovable preview/sandbox subdomains are dynamic — match by suffix.
const ALLOWED_SUFFIXES = [".lovable.app", ".lovableproject.com"];

// Localhost / 127.0.0.1 on any port for local dev.
const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowed(origin: string): boolean {
  if (ALLOWED_ORIGINS.has(origin)) return true;
  if (LOCALHOST_RE.test(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return ALLOWED_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}

const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

/** Returns CORS headers if the request origin is allowed, otherwise null. */
export function corsFor(req: Request): Record<string, string> | null {
  const origin = req.headers.get("Origin");
  if (!origin) return null; // reject missing origin on sensitive endpoints
  if (!isAllowed(origin)) return null;
  return { ...BASE_HEADERS, "Access-Control-Allow-Origin": origin };
}

/** Handle OPTIONS preflight. Returns a Response if handled, otherwise null. */
export function handlePreflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  const headers = corsFor(req);
  if (!headers) {
    return new Response("Forbidden origin", { status: 403 });
  }
  return new Response("ok", { headers });
}

/** Build a JSON response with CORS headers (or a 403 if origin disallowed). */
export function jsonResponse(
  req: Request,
  body: unknown,
  init: ResponseInit = {},
): Response {
  const cors = corsFor(req);
  if (!cors) {
    return new Response(JSON.stringify({ error: "Forbidden origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}
