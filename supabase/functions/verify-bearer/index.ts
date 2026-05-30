import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    })
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: "Missing or invalid Authorization header" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Extract the raw token
    const token = authHeader.split('Bearer ')[1];

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration (Missing Supabase Credentials)" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase admin client to call the RPC securely bypassing RLS 
    // (since the verify_api_key RPC uses security definer)
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the RPC function we added to the schema.
    // The RPC will securely hash the key, verify it, increment use_count, and update last_used.
    const { data, error } = await supabase.rpc('verify_api_key', { p_key: token });

    if (error || !data || data.length === 0) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid or revoked API key" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    const keyRecord = data[0];

    // If valid, return success. The downstream app can use these details.
    return new Response(JSON.stringify({
      valid: true,
      key_details: {
        id: keyRecord.api_key_id,
        name: keyRecord.key_name,
        domain_id: keyRecord.domain_id
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
