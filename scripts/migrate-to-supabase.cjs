const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

// This migration script bridges your local embedded SQLite Database directly to your Supabase PostgreSQL.
// Ensure your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.

console.log("=============================================");
console.log("   COMMANDNEXUS -> SUPABASE DATA EXODUS      ");
console.log("=============================================");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("CRITICAL ERR: Missing Core Credentials.");
  console.error("Please export SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your deployment environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const db = new Database('./data.db');

async function broadcastToSupabase(tableName, rows) {
    if (!rows || rows.length === 0) return;
    console.log(`[SYS] Initiating uplink for ${rows.length} records into [${tableName}]...`);
    const { error } = await supabase.from(tableName).upsert(rows);
    if (error) {
        console.error(`[ERR] Payload failure on table [${tableName}]:`, error.message);
    } else {
        console.log(`[OK] Successfully synchronized [${tableName}].`);
    }
}

async function startExodus() {
    try {
        console.log("[SYS] Beginning neural extraction from embedded SQLite core...");

        // 1. Domains
        const domains = db.prepare('SELECT * FROM domains').all();
        await broadcastToSupabase('domains', domains);

        // 2. Components (Map string JSON into Objects, booleans to true/false)
        const components = db.prepare('SELECT * FROM components').all().map(c => ({
            ...c, 
            visible: c.visible === 1,
            config: c.config ? JSON.parse(c.config) : {}
        }));
        await broadcastToSupabase('components', components);

        // 3. Admin Users
        const users = db.prepare('SELECT * FROM users').all().map(u => ({
            ...u, is_banned: u.is_banned === 1
        }));
        await broadcastToSupabase('users', users);

        // 4. API Keys
        const apiKeys = db.prepare('SELECT * FROM api_keys').all();
        await broadcastToSupabase('api_keys', apiKeys);

        // 5. Campaigns / Ads
        const ads = db.prepare('SELECT * FROM ads').all().map(a => ({
            ...a, active: a.active === 1, config: a.config ? JSON.parse(a.config) : {}
        }));
        await broadcastToSupabase('ads', ads);

        // 6. Network Telemetry
        const visits = db.prepare('SELECT * FROM visits LIMIT 1000').all(); // Cap migration to 1k for safety
        await broadcastToSupabase('visits', visits);

        console.log("=============================================");
        console.log(" EXODUS COMPLETE. SYSTEM READY FOR DEPLOYMENT");
        console.log("=============================================");

    } catch(e) {
        console.error("FATAL ERROR EXECUTING SYNC ROUTINE:", e);
    }
}

startExodus();
