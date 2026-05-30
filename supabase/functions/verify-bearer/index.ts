import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.8";

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth) return null;
  const [scheme, token] = auth.split(" ");
  if (!scheme || !token || scheme.toLowerCase() !== "bearer") return null;
  return token.trim();
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = getBearerToken(req);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Bearer token" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calls your DB verifier (hash comparison, last_used/use_count updates)
    const { data, error } = await supabase.rpc("verify_api_key", { p_key: token });

    if (error) {
      return new Response(
        JSON.stringify({ error: "Verification failed", details: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // verify_api_key returns rows; valid key => at least one row
    const row = Array.isArray(data) ? data[0] : null;
    if (!row?.api_key_id) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        api_key_id: row.api_key_id,
        domain_id: row.domain_id,
        key_name: row.key_name
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
