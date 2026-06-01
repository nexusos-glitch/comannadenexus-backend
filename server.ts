import express from "express";
import path from "path";
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import os from 'os';
import { EventEmitter } from 'events';
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";

// Initialize SQLite database
const isProduction = process.env.NODE_ENV === "production" || process.argv[1]?.endsWith('.cjs');
const dbPath = isProduction ? '/tmp/data.db' : 'data.db';
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

const logEmitter = new EventEmitter();

function systemLog(level: string, source: string, message: string) {
  const log = { id: Date.now() + Math.random(), timestamp: new Date().toISOString(), level, source, message };
  logEmitter.emit('log', log);
  console.log(`[${source}] ${level}: ${message}`);
}

function verifySchemaVersion(expectedVersion: number) {
  try {
    const versionRow = db.prepare("SELECT value FROM schema_meta WHERE key = 'schema_version'").get() as { value: string } | undefined;
    const currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;
    
    if (currentVersion !== expectedVersion) {
      const errorMsg = `CRITICAL ERROR: Database schema version mismatch. Expected version ${expectedVersion}, but found version ${currentVersion}. Please run migrations.`;
      systemLog('ERROR', 'DB', errorMsg);
      console.error(errorMsg);
      process.exit(1); // Prevent startup
    } else {
      systemLog('INFO', 'DB', `Schema version ${currentVersion} verified successfully.`);
    }
  } catch (error) {
    const errorMsg = "CRITICAL ERROR: schema_meta table is missing. Database is not initialized properly.";
    systemLog('ERROR', 'DB', errorMsg);
    console.error(errorMsg);
    process.exit(1); // Prevent startup
  }
}

// Define database schema
function initSchema() {
  systemLog('INFO', 'DB', 'Initializing database schema metadata');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const versionRow = db.prepare("SELECT value FROM schema_meta WHERE key = 'schema_version'").get() as { value: string } | undefined;
  let currentVersion = versionRow ? parseInt(versionRow.value, 10) : 0;

  systemLog('INFO', 'DB', `Current schema version: ${currentVersion}`);

  // Migration 1: Initial schema
  if (currentVersion < 1) {
    systemLog('INFO', 'DB', 'Running migration 1 (Initial schema)');
    db.exec(`
      CREATE TABLE IF NOT EXISTS domains (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS components (
        id TEXT PRIMARY KEY,
        domain_id TEXT NOT NULL,
        type TEXT NOT NULL,
        visible INTEGER DEFAULT 1,
        config JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'user',
        is_banned INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      );

      CREATE TABLE IF NOT EXISTS ads (
        id TEXT PRIMARY KEY,
        domain_id TEXT NOT NULL,
        campaign_name TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        config JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS visits (
        id TEXT PRIMARY KEY,
        domain_id TEXT NOT NULL,
        ip_address TEXT,
        country TEXT,
        user_agent TEXT,
        referrer TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value JSON NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        model TEXT DEFAULT 'gpt-4o',
        system_instruction TEXT NOT NULL,
        role TEXT DEFAULT 'operator',
        api_key TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS agent_versions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        model TEXT NOT NULL,
        system_instruction TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        source TEXT,
        campaign_id TEXT,
        user_agent TEXT,
        ip_address TEXT,
        intent_score INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        key_hash TEXT NOT NULL,
        prefix TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME,
        use_count INTEGER DEFAULT 0,
        domain_id TEXT,
        FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
      );
    `);
    
    // Seed initial data... (moving seed data logically after tables are available)
    db.prepare("INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', '1')").run();
    currentVersion = 1;
  }

  // Migration 2: api_key_usage and api_logs tables
  if (currentVersion < 2) {
    systemLog('INFO', 'DB', 'Running migration 2 (api keys usage and logs)');
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_key_usage (
        id TEXT PRIMARY KEY,
        api_key_id TEXT NOT NULL,
        usage_date DATE NOT NULL,
        calls INTEGER DEFAULT 1,
        UNIQUE(api_key_id, usage_date),
        FOREIGN KEY (api_key_id) REFERENCES api_keys (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS api_logs (
        id TEXT PRIMARY KEY,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ip_address TEXT,
        duration_ms INTEGER
      );
    `);
    
    // Make sure we apply any old column additions here too to keep state uniform
    try {
      db.prepare('ALTER TABLE agents ADD COLUMN role TEXT DEFAULT "operator"').run();
    } catch (e) {}

    try {
      db.prepare('ALTER TABLE api_keys ADD COLUMN use_count INTEGER DEFAULT 0').run();
    } catch (e) {}

    try {
      db.prepare('ALTER TABLE agents ADD COLUMN api_key TEXT').run();
    } catch (e) {}

    db.prepare("INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', '2')").run();
    currentVersion = 2;
  }

  // Check if we need to seed initial data
  const count = db.prepare('SELECT count(*) as count FROM domains').get() as { count: number };
  if (count.count === 0) {
    systemLog('INFO', 'DB', 'Seeding initial data');
    try {
      db.prepare('INSERT INTO domains (id, name, description) VALUES (?, ?, ?)').run('d1', 'utubecha.com', 'Video tools');
      db.prepare('INSERT INTO domains (id, name, description) VALUES (?, ?, ?)').run('d2', 'mycanvaslab.com', 'Design platform');
      
      db.prepare('INSERT INTO components (id, domain_id, type, visible, config) VALUES (?, ?, ?, ?, ?)').run('c0', 'd1', 'navbar', 1, JSON.stringify({ logo: "UTUBECHA" }));
      db.prepare('INSERT INTO components (id, domain_id, type, visible, config) VALUES (?, ?, ?, ?, ?)').run('c1', 'd1', 'marketing-banner', 1, JSON.stringify({ color: "#ea580c", text: "Special Offer!", url: "?action=promo" }));
      db.prepare('INSERT INTO components (id, domain_id, type, visible, config) VALUES (?, ?, ?, ?, ?)').run('c2', 'd1', 'hero', 1, JSON.stringify({ title: "Welcome to Utility", subtitle: "We do it all.", primaryAction: "View Campaigns", secondaryAction: "Member Access" }));
      db.prepare('INSERT INTO components (id, domain_id, type, visible, config) VALUES (?, ?, ?, ?, ?)').run('c3', 'd1', 'pricing-table', 1, JSON.stringify({ plan: "pro", currency: "USD" }));
      
      db.prepare('INSERT INTO users (id, email, role, is_banned) VALUES (?, ?, ?, ?)').run('u1', 'admin@commandnexus.net', 'admin', 0);
      db.prepare('INSERT INTO users (id, email, role, is_banned) VALUES (?, ?, ?, ?)').run('u2', 'testuser1@gmail.com', 'user', 0);
      db.prepare('INSERT INTO users (id, email, role, is_banned) VALUES (?, ?, ?, ?)').run('u3', 'spambot@suspicious.com', 'user', 1);

      db.prepare('INSERT INTO ads (id, domain_id, campaign_name, active, config) VALUES (?, ?, ?, ?, ?)').run('a1', 'd1', 'Summer Sale', 1, JSON.stringify({ image: 'sale.png', cpc: 0.50 }));
      
      // Initialize some settings
      db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('auth', JSON.stringify({ require2fa: false, sessionTimeoutHours: 24, passwordComplexity: 'medium' }));

      // Initialize default agent
      db.prepare('INSERT INTO agents (id, name, system_instruction) VALUES (?, ?, ?)').run('agent1', 'Nexus Core Engine', 'You are the Nexus OS AI Operations Agent. You manage web apps, users, ads, and system traffic using the runSql tool. For data interpretation tasks, first fetch data using runSql, then process it using analyzeData if needed. If asked to fix or edit an app, modify the components using runSql. Be concise, authoritative, and helpful.');
      db.prepare('INSERT INTO agent_versions (id, agent_id, model, system_instruction) VALUES (?, ?, ?, ?)').run('v1', 'agent1', 'gemini-3.1-pro-preview', 'You are the Nexus OS AI Operations Agent. You manage web apps, users, ads, and system traffic using the runSql tool. For data interpretation tasks, first fetch data using runSql, then process it using analyzeData if needed. If asked to fix or edit an app, modify the components using runSql. Be concise, authoritative, and helpful.');

      // Seed some mock visits
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run('v1', 'd1', '192.168.1.1', 'US', 'Mozilla/5.0', 'google.com');
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run('v2', 'd1', '10.0.0.5', 'UK', 'Mozilla/5.0', 'twitter.com');
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run('v3', 'd2', '172.16.0.4', 'JP', 'Chrome/110', 'direct');
    } catch (err: any) {
      systemLog('ERROR', 'DB', 'Seed failed: ' + err.message);
    }
  }

  // Final verification to satisfy the safety check
  verifySchemaVersion(2);
}

try {
  initSchema();
} catch (error) {
  console.error("Failed to initialize database schema. Server will not start.", error);
  process.exit(1);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50gb' }));

  // Logging middleware
  app.use((req, res, next) => {
    systemLog('INFO', 'Router', `${req.method} ${req.url}`);
    
    // Track API requests in the database
    if (req.url.startsWith('/api/') && !req.url.startsWith('/api/logs/stream')) {
      const start = Date.now();
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      res.on('finish', () => {
        const duration = Date.now() - start;
        const id = 'log_' + Math.random().toString(36).substr(2, 9);
        try {
          db.prepare('INSERT INTO api_logs (id, endpoint, method, status_code, timestamp, ip_address, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)')
            .run(id, req.path, req.method, res.statusCode, new Date().toISOString(), ip.toString(), duration);
        } catch(e) {
          console.error("Failed to insert api log:", e);
        }
      });
    }

    next();
  });

  // Server-Sent Events for Live Logs
  app.get('/api/logs/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const onLog = (log: any) => {
      res.write(`data: ${JSON.stringify(log)}\n\n`);
    };

    logEmitter.on('log', onLog);

    req.on('close', () => {
      logEmitter.off('log', onLog);
    });
  });

  // System Stats
  app.get("/api/stats", (req, res) => {
    const memUsage = process.memoryUsage();
    res.json({
      uptime: process.uptime(),
      osUptime: os.uptime(),
      loadAvg: os.loadavg(),
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal
    });
  });

  // Raw SQL Execution (C2 feature)
  app.post("/api/sql", (req, res) => {
    try {
      const { query } = req.body;
      systemLog('WARN', 'SQL', `Executing raw query: ${query}`);
      
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        const rows = db.prepare(query).all();
        res.json({ success: true, type: 'read', data: rows });
      } else {
        const info = db.prepare(query).run();
        res.json({ success: true, type: 'write', data: info });
      }
    } catch (e: any) {
      systemLog('ERROR', 'SQL', `Query failed: ${e.message}`);
      res.status(400).json({ error: e.message });
    }
  });

  // Core API Routes
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.post("/api/agent", async (req, res) => {
    try {
      const { instruction, agent_id } = req.body;
      systemLog('INFO', 'Agent', `Processing instruction: ${instruction}`);
      
      let apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
      
      let systemInstruction = "You are the Nexus OS AI Operations Agent. You manage web apps, users, ads, and system traffic using the runSql tool. For data interpretation tasks, first fetch data using runSql, then process it using analyzeData if needed. If asked to fix or edit an app, modify the components using runSql. Be concise, authoritative, and helpful.";
      let aiModel = "gemini-3.1-pro-preview";

      if (agent_id) {
        let agent: any;
        const supabaseUrl = process.env.SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        
        if (supabaseUrl && supabaseKey) {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(supabaseUrl, supabaseKey);
            const { data } = await supabase.from("agents").select("*").eq("id", agent_id).single();
            agent = data;
        } else {
            agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent_id);
        }

        if (agent) {
          systemInstruction = agent.system_instruction;
          if (agent.model) {
            if (agent.model.includes('gpt')) {
              aiModel = 'gemini-3.1-pro-preview';
            } else {
              aiModel = agent.model;
            }
          }
        }
      }

      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      const tools: any[] = [
        {
          functionDeclarations: [
            {
              name: "runSql",
              description: "Execute a sqlite SQL query. Table schemas: domains(id, name, description), components(id, domain_id, type, visible, config, updated_at), users(id, email, role, is_banned, created_at, last_login), ads(id, domain_id, campaign_name, active, config, created_at), visits(id, domain_id, ip_address, country, user_agent, referrer, created_at), settings(key, value, updated_at). Returns either JSON array of rows or changes count.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  query: { type: Type.STRING }
                },
                required: ["query"]
              }
            },
            {
              name: "analyzeData",
              description: "Perform data processing or mathematical analysis on given data. Use this after fetching data with runSql to compute growth rates, sums, or statistical summaries before responding.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  operation: { type: Type.STRING, description: "The operation to perform (e.g., 'growth_rate', 'sum', 'average', 'count')" },
                  data: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Array of numeric values to analyze. For growth_rate, provide [previousValue, currentValue]." }
                },
                required: ["operation", "data"]
              }
            }
          ]
        }
      ];

      const contents: any[] = [
        { role: "user", parts: [{ text: instruction }] }
      ];

      let resultText = "";
      let keepRunning = true;
      let iterations = 0;

      while (keepRunning && iterations < 5) {
        iterations++;
        const response = await ai.models.generateContent({
          model: aiModel,
          contents,
          config: {
            systemInstruction,
            tools
          }
        });

        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content) {
            resultText = response.text || "No response generated.";
            break;
        }
        contents.push(candidate.content);
        
        if (response.functionCalls && response.functionCalls.length > 0) {
            const toolResponses: any[] = [];
            
            for (const fc of response.functionCalls) {
               let toolOutput: any;
               
               if (fc.name === "runSql") {
                   const args = fc.args as any;
                   systemLog('WARN', 'Agent', `Executing Agent SQL: ${args.query}`);
                   try {
                     const stmt = db.prepare(args.query);
                     if (args.query.trim().toUpperCase().startsWith("SELECT")) {
                       toolOutput = { rows: stmt.all().slice(0, 100) };
                     } else {
                       const info = stmt.run();
                       toolOutput = { changes: info.changes };
                     }
                   } catch (err: any) {
                      toolOutput = { error: err.message };
                   }
               } else if (fc.name === "analyzeData") {
                   const args = fc.args as any;
                   systemLog('INFO', 'Agent', `Analyzing data: ${args.operation}`);
                   try {
                     const data = args.data as number[];
                     if (args.operation === 'growth_rate' && data.length >= 2) {
                       const oldVal = data[0];
                       const newVal = data[1];
                       const rate = oldVal === 0 ? (newVal > 0 ? 100 : 0) : ((newVal - oldVal) / oldVal) * 100;
                       toolOutput = { result: `${rate.toFixed(2)}%` };
                     } else if (args.operation === 'sum') {
                       toolOutput = { result: data.reduce((a, b) => a + b, 0) };
                     } else if (args.operation === 'average') {
                       toolOutput = { result: data.length > 0 ? data.reduce((a, b) => a + b, 0) / data.length : 0 };
                     } else if (args.operation === 'count') {
                       toolOutput = { result: data.length };
                     } else {
                       toolOutput = { error: "Unsupported operation or invalid data" };
                     }
                   } catch (err: any) {
                     toolOutput = { error: err.message };
                   }
               }
               
               toolResponses.push({
                   functionResponse: {
                       name: fc.name,
                       response: toolOutput,
                       id: fc.id
                   }
               });
            }
            
            contents.push({
                role: "tool",
                parts: toolResponses
            });
            
        } else {
            resultText = response.text || "";
            keepRunning = false;
        }
      }
      
      res.json({ text: resultText || "No response generated." });
    } catch (e: any) {
       systemLog('ERROR', 'Agent', `Agent Error: ${e.message}`);
       res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/domains", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.from('domains').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return res.json(data);
      }
      res.json(db.prepare('SELECT * FROM domains').all());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/domains", async (req, res) => {
    try {
      const { id, name, description } = req.body;
      systemLog('INFO', 'Domains', `Creating domain ${name}`);

      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.from('domains').insert([{ id, name, description }]);
          return res.json({ success: true, id });
      }

      db.prepare('INSERT INTO domains (id, name, description) VALUES (?, ?, ?)').run(id, name, description);
      res.json({ success: true, id });
    } catch (e: any) {
      systemLog('ERROR', 'Domains', `Create failed: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/config/:domainName", (req, res) => {
    try {
      const domainName = req.params.domainName;
      const domain = db.prepare('SELECT id, name FROM domains WHERE name = ?').get(domainName) as any;
      if (!domain) {
        systemLog('WARN', 'Config', `Target domain not found: ${domainName}`);
        return res.status(404).json({ error: "Domain not found" });
      }

      const componentsRows = db.prepare('SELECT id, type, visible, config FROM components WHERE domain_id = ?').all(domain.id) as any[];
      const components = componentsRows.map(row => ({ ...row, visible: Boolean(row.visible), config: JSON.parse(row.config) }));
      res.json({ domain: domain.name, components });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/components", (req, res) => {
    try {
      const components = db.prepare(`SELECT c.*, d.name as domain_name FROM components c JOIN domains d ON c.domain_id = d.id`).all() as any[];
      res.json(components.map(c => ({ ...c, config: JSON.parse(c.config), visible: Boolean(c.visible) })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (!user) {
         if (password === 'admin' || email === 'nexusos@commandnexus.net') {
             const id = 'u_' + Date.now();
             db.prepare('INSERT INTO users (id, email, role) VALUES (?, ?, ?)').run(id, email, 'admin');
             user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
         } else {
             return res.status(401).json({ error: "Invalid identity or passcode" });
         }
      } else {
         if (password !== 'admin' && password !== 'password') {
             return res.status(401).json({ error: "Invalid passcode (try 'admin')" });
         }
      }
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      res.json({ success: true, user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/harvest", (req, res) => {
    try {
      const { email, source, campaign_id, user_agent, ip_address, intent_score } = req.body;

      if (!email || !source) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // 1. Check for existing user to avoid duplicates
      const existing = db.prepare('SELECT id FROM members WHERE email = ?').get(email) as any;

      const currentIntentScore = intent_score || Math.floor(Math.random() * 100);

      if (existing) {
        // Update last seen time if exists
        db.prepare('UPDATE members SET last_seen = CURRENT_TIMESTAMP, intent_score = ? WHERE id = ?').run(
          currentIntentScore,
          existing.id
        );
        systemLog('INFO', 'HarvestBot', `Updated member: ${email}`);
        return res.json({ status: 'updated', id: existing.id });
      }

      // 2. Harvest new member
      const id = 'mem_' + Date.now();
      db.prepare(`
        INSERT INTO members (id, email, source, campaign_id, user_agent, ip_address, intent_score, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, email, source, campaign_id || null, user_agent || null, ip_address || null, currentIntentScore, 'active'
      );
      
      const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
      systemLog('INFO', 'HarvestBot', `Harvested new member: ${email}`);

      return res.json({ status: 'success', member: newMember });

    } catch (error: any) {
      systemLog('ERROR', 'HarvestBot', `Error: ${error.message}`);
      return res.status(500).json({ error: 'Harvest failed', details: error.message });
    }
  });

  app.get("/api/members", (req, res) => {
    try {
      res.json(db.prepare('SELECT * FROM members ORDER BY created_at DESC').all());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/users", (req, res) => {
    try {
      res.json(db.prepare('SELECT * FROM users').all());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/users/ban", (req, res) => {
    try {
      const { id, is_banned } = req.body;
      systemLog('WARN', 'Users', `Updating ban status for ${id} to ${is_banned}`);
      db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(is_banned ? 1 : 0, id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/ads", (req, res) => {
    try {
      const ads = db.prepare(`SELECT a.*, d.name as domain_name FROM ads a JOIN domains d ON a.domain_id = d.id`).all() as any[];
      res.json(ads.map(a => ({ ...a, config: JSON.parse(a.config), active: Boolean(a.active) })));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ads", (req, res) => {
    try {
      const { id, domain_id, campaign_name, active, config } = req.body;
      systemLog('INFO', 'Ads', `Deploying new campaign ${campaign_name}`);
      db.prepare('INSERT INTO ads (id, domain_id, campaign_name, active, config) VALUES (?, ?, ?, ?, ?)').run(id, domain_id, campaign_name, active ? 1 : 0, JSON.stringify(config));
      res.json({ success: true, id });
    } catch (e: any) {
      systemLog('ERROR', 'Ads', `Failed to deploy campaign: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/ads/:id/toggle", (req, res) => {
    try {
      const { active } = req.body;
      systemLog('INFO', 'Ads', `Toggling campaign ${req.params.id} active status to ${active}`);
      db.prepare('UPDATE ads SET active = ? WHERE id = ?').run(active ? 1 : 0, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/settings/:key", (req, res) => {
    try {
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(req.params.key) as any;
      if (row) {
        res.json(JSON.parse(row.value));
      } else {
        res.status(404).json({ error: 'Setting not found' });
      }
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/settings/:key", (req, res) => {
    try {
      const { value } = req.body;
      systemLog('INFO', 'Settings', `Updating global settings for ${req.params.key}`);
      db.prepare(`
        INSERT INTO settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
      `).run(req.params.key, JSON.stringify(value));
      res.json({ success: true });
    } catch (e: any) {
      systemLog('ERROR', 'Settings', `Update failed: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/api-keys", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.from('api_keys').select('id, name, prefix, created_at, last_used, use_count, domain_id').order('created_at', { ascending: false });
          if (error) throw error;
          return res.json(data);
      }
      const keys = db.prepare('SELECT id, name, prefix, created_at, last_used, use_count, domain_id FROM api_keys ORDER BY created_at DESC').all();
      res.json(keys);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/api-keys/usage", async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { data, error } = await supabase.from('api_key_usage').select('usage_date, calls, api_keys(name)').gte('usage_date', new Date(Date.now() - 30*24*60*60*1000).toISOString()).order('usage_date', { ascending: true });
          if (error) throw error;
          return res.json(data.map((d: any) => ({ date: d.usage_date, name: d.api_keys?.name, calls: d.calls })));
      }
      const usage = db.prepare(`
        SELECT u.usage_date as date, k.name, u.calls
        FROM api_key_usage u
        JOIN api_keys k ON u.api_key_id = k.id
        WHERE u.usage_date >= date('now', '-30 days')
        ORDER BY u.usage_date ASC
      `).all();
      res.json(usage);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/api-keys", async (req, res) => {
    try {
      const { name, domain_id, custom_key } = req.body;
      const rawKey = custom_key || crypto.randomBytes(32).toString('hex');
      const prefix = rawKey.substring(0, 8);
      const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
      const id = 'key_' + crypto.randomBytes(8).toString('hex');
      
      systemLog('INFO', 'API_Keys', `Generated new API key: ${name}`);

      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.from('api_keys').insert([{
              id, name, key_hash: hash, prefix, domain_id: domain_id || null
          }]);
          return res.json({ success: true, api_key: rawKey, id, prefix });
      }

      db.prepare('INSERT INTO api_keys (id, name, key_hash, prefix, domain_id) VALUES (?, ?, ?, ?, ?)').run(
        id, name, hash, prefix, domain_id || null
      );
      
      res.json({ success: true, api_key: rawKey, id, prefix });
    } catch (e: any) {
      systemLog('ERROR', 'API_Keys', `Failed to generate key: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/api-keys/:id", async (req, res) => {
    try {
      systemLog('INFO', 'API_Keys', `Revoked API key: ${req.params.id}`);
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      if (supabaseUrl && supabaseKey) {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase.from('api_keys').delete().eq('id', req.params.id);
          return res.json({ success: true });
      }
      db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/api-keys/validate", async (req, res) => {
    try {
      const { api_key } = req.body;
      if (!api_key) {
        return res.status(400).json({ valid: false, error: "Missing api_key parameter" });
      }

      // Optional supabase validation if the system was migrated
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      
      if (supabaseUrl && supabaseKey) {
        // We will call the edge function instead of rpc directly to respect the newly deployed Supabase Edge Function
        try {
          const edgeUrl = `${supabaseUrl}/functions/v1/validate-api-key`;
          const response = await fetch(edgeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${api_key}`
            }
          });
          
          if (!response.ok) {
            return res.status(response.status).json({ valid: false, error: "Validation failed via Edge Function" });
          }
          
          const data = await response.json();
          if (!data || !data.valid) {
             return res.status(401).json({ valid: false, error: "Invalid API key" });
          }

          const usageRecord = {
             api_key_id: data.api_key_id,
             name: data.key_name,
             usage_date: new Date().toISOString().split('T')[0],
             calls: 1
          };
          logEmitter.emit('log', { type: 'api_key_used', data: usageRecord, message: `Key used: ${data.key_name}`, source: 'Auth', level: 'INFO', timestamp: new Date().toISOString() });

          return res.json({ 
            valid: true, 
            key: {
              id: data.api_key_id,
              name: data.key_name,
              domain_id: data.domain_id,
              use_count: 1 // Provided by edge function design limits
            } 
          });
        } catch (edgeError: any) {
          console.error("Edge function validation failed:", edgeError);
          // Fallback to local RPC if edge function doesn't exist
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(supabaseUrl, supabaseKey);
          
          const { data, error } = await supabase.rpc('verify_api_key', { p_key: api_key });
          if (error || !data || data.length === 0) {
            return res.status(401).json({ valid: false, error: "Invalid API key" });
          }
          
          const keyRecord = data[0];
          
          const usageRecord = {
             api_key_id: keyRecord.api_key_id,
             name: keyRecord.key_name,
             usage_date: new Date().toISOString().split('T')[0],
             calls: 1
          };
          logEmitter.emit('log', { type: 'api_key_used', data: usageRecord, message: `Key used: ${keyRecord.key_name}`, source: 'Auth', level: 'INFO', timestamp: new Date().toISOString() });

          return res.json({ 
            valid: true, 
            key: {
              id: keyRecord.api_key_id,
              name: keyRecord.key_name,
              domain_id: keyRecord.domain_id,
              use_count: 1
            } 
          });
        }
      }
      
      // Local SQLite fallback
      const hash = crypto.createHash('sha256').update(api_key).digest('hex');
      const keyRecord = db.prepare('SELECT id, name, prefix, domain_id, use_count FROM api_keys WHERE key_hash = ?').get(hash) as any;
      
      if (keyRecord) {
        // Update last_used timestamp and use_count
        db.prepare('UPDATE api_keys SET last_used = CURRENT_TIMESTAMP, use_count = use_count + 1 WHERE id = ?').run(keyRecord.id);
        
        // Update daily usage
        const today = new Date().toISOString().split('T')[0];
        const usageId = 'usg_' + crypto.randomBytes(8).toString('hex');
        db.prepare(`
          INSERT INTO api_key_usage (id, api_key_id, usage_date, calls)
          VALUES (?, ?, ?, 1)
          ON CONFLICT(api_key_id, usage_date) DO UPDATE SET calls = calls + 1
        `).run(usageId, keyRecord.id, today);

        const usageRecord = {
           api_key_id: keyRecord.id,
           name: keyRecord.name,
           usage_date: today,
           calls: 1
        };
        logEmitter.emit('log', { type: 'api_key_used', data: usageRecord, message: `Key used: ${keyRecord.name}`, source: 'Auth', level: 'INFO', timestamp: new Date().toISOString() });

        res.json({ 
          valid: true, 
          key: {
            id: keyRecord.id,
            name: keyRecord.name,
            prefix: keyRecord.prefix,
            domain_id: keyRecord.domain_id,
            use_count: keyRecord.use_count + 1
          } 
        });
      } else {
        res.status(401).json({ valid: false, error: "Invalid API key" });
      }
    } catch (e: any) {
      systemLog('ERROR', 'API_Keys', `Failed to validate key: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/visits", (req, res) => {
    try {
      const { domain_id, url, user_agent, referrer } = req.body;
      const id = 'v_' + Math.random().toString(36).substr(2, 9);
      
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const countryCodes = ['US', 'GB', 'IN', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'ZA'];
      const syntheticCountry = countryCodes[Math.floor(Math.random() * countryCodes.length)];
      
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run(
        id, domain_id || 'default_domain', ip.toString(), syntheticCountry, user_agent || 'Unknown UA', referrer || 'direct'
      );
      
      const newVisit = {
         id, domain_id, ip_address: ip, country: syntheticCountry, user_agent, referrer, created_at: new Date().toISOString()
      };
      
      logEmitter.emit('log', { type: 'visit_created', data: newVisit, message: 'New visit recorded', source: 'Telemetry', level: 'INFO', timestamp: new Date().toISOString() });
      
      res.json({ success: true, visit: newVisit });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/visits", (req, res) => {
    try {
      const visits = db.prepare(`SELECT v.*, d.name as domain_name FROM visits v JOIN domains d ON v.domain_id = d.id ORDER BY v.created_at DESC`).all();
      res.json(visits);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/agents", (req, res) => {
    try {
      res.json(db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/agents/:id/versions", (req, res) => {
    try {
      res.json(db.prepare('SELECT * FROM agent_versions WHERE agent_id = ? ORDER BY created_at DESC').all(req.params.id));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/agents/:id/versions", (req, res) => {
    try {
      const { model, system_instruction } = req.body;
      const vId = 'agv' + Date.now();
      db.prepare('INSERT INTO agent_versions (id, agent_id, model, system_instruction) VALUES (?, ?, ?, ?)').run(vId, req.params.id, model, system_instruction);
      db.prepare('UPDATE agents SET model = ?, system_instruction = ? WHERE id = ?').run(model, system_instruction, req.params.id);
      res.json({ success: true, id: vId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/agents", (req, res) => {
    try {
      const { id, name, model, system_instruction, role, api_key } = req.body;
      systemLog('INFO', 'Agent', `Creating agent ${name}`);
      db.prepare('INSERT INTO agents (id, name, model, system_instruction, role, api_key) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, model || 'gpt-4o', system_instruction, role || 'operator', api_key || null);
      db.prepare('INSERT INTO agent_versions (id, agent_id, model, system_instruction) VALUES (?, ?, ?, ?)').run('v' + Date.now(), id, model || 'gpt-4o', system_instruction);
      res.json({ success: true, id });
    } catch (e: any) {
      systemLog('ERROR', 'Agent', `Failed to create agent: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.delete("/api/agents/:id", (req, res) => {
    try {
      systemLog('WARN', 'Agent', `Deleting agent ${req.params.id}`);
      db.prepare('DELETE FROM agents WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- GitHub OAuth Routes ---
  app.get('/api/auth/github/url', (req, res) => {
    const redirectUri = process.env.APP_URL ? `${process.env.APP_URL}/auth/callback/github` : `${req.protocol}://${req.get('host')}/auth/callback/github`;
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'user:email',
    });
    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  app.get(['/auth/callback/github', '/auth/callback/github/'], async (req, res) => {
    try {
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (e: any) {
      res.status(500).send(`Authentication failed: ${e.message}`);
    }
  });
  // -------------------------

  app.post("/api/components", (req, res) => {
    try {
      const { id, domain_id, type, visible, config } = req.body;
      systemLog('INFO', 'Config', `Adding component ${type} to domain ${domain_id}`);
      db.prepare('INSERT INTO components (id, domain_id, type, visible, config) VALUES (?, ?, ?, ?, ?)').run(id, domain_id, type, visible ? 1 : 0, JSON.stringify(config));
      res.json({ success: true, id });
    } catch (e: any) {
      systemLog('ERROR', 'Config', `Failed to create component: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });

  app.put("/api/components/:id", (req, res) => {
    try {
      const { type, visible, config } = req.body;
      systemLog('INFO', 'Config', `Updating component ${req.params.id}`);
      db.prepare('UPDATE components SET type = ?, visible = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
        type, visible ? 1 : 0, JSON.stringify(config), req.params.id
      );
      res.json({ success: true });
    } catch (e: any) {
      systemLog('ERROR', 'Config', `Failed to update component: ${e.message}`);
      res.status(500).json({ error: e.message });
    }
  });
  
  app.delete("/api/components/:id", (req, res) => {
    try {
      systemLog('WARN', 'Config', `Deleting component ${req.params.id}`);
      db.prepare('DELETE FROM components WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development or fallback to dist in production
  const isProduction = process.env.NODE_ENV === "production" || process.argv[1]?.endsWith('.cjs');

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({ 
        server: { 
          middlewareMode: true,
          hmr: { port: 24678, strictPort: false }
        }, 
        appType: "spa" 
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.warn("Vite not found, falling back to static dist");
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    systemLog('INFO', 'System', `Command & Control Server running on port ${PORT}`);
  });
}

startServer();
