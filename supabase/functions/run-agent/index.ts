import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
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
    if (!authHeader) return new Response("Missing auth", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Check caller is admin
    const { data: isAdmin, error: adminErr } = await supabase.rpc("is_admin");
    if (adminErr || !isAdmin) return new Response("Forbidden", { status: 403 });

    const { agent_id, input } = await req.json();

    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .select("id,name,model,system_instruction")
      .eq("id", agent_id)
      .single();

    if (agentErr || !agent) return new Response("Agent not found", { status: 404 });

    // placeholder: call LLM provider here
    const output = {
      message: `Agent ${agent.name} executed`,
      model: agent.model,
      received_input: input
    };

    return new Response(JSON.stringify(output), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
