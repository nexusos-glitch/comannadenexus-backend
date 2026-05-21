import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import os from 'os';
import { EventEmitter } from 'events';
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const db = new Database('data.db', { verbose: console.log });
db.pragma('journal_mode = WAL');

const logEmitter = new EventEmitter();

function systemLog(level: string, source: string, message: string) {
  const log = { id: Date.now() + Math.random(), timestamp: new Date().toISOString(), level, source, message };
  logEmitter.emit('log', log);
  console.log(`[${source}] ${level}: ${message}`);
}

// Define database schema
function initSchema() {
  systemLog('INFO', 'DB', 'Initializing database schema');
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
  `);

  try {
    db.prepare('ALTER TABLE agents ADD COLUMN role TEXT DEFAULT "operator"').run();
  } catch (e) {
    // Column might already exist
  }

  try {
    db.prepare('ALTER TABLE agents ADD COLUMN api_key TEXT').run();
  } catch (e) {
    // Column might already exist
  }

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
      db.prepare('INSERT INTO agent_versions (id, agent_id, model, system_instruction) VALUES (?, ?, ?, ?)').run('v1', 'agent1', 'gpt-4o', 'You are the Nexus OS AI Operations Agent. You manage web apps, users, ads, and system traffic using the runSql tool. For data interpretation tasks, first fetch data using runSql, then process it using analyzeData if needed. If asked to fix or edit an app, modify the components using runSql. Be concise, authoritative, and helpful.');

      // Seed some mock visits
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run('v1', 'd1', '192.168.1.1', 'US', 'Mozilla/5.0', 'google.com');
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run('v2', 'd1', '10.0.0.5', 'UK', 'Mozilla/5.0', 'twitter.com');
      db.prepare('INSERT INTO visits (id, domain_id, ip_address, country, user_agent, referrer) VALUES (?, ?, ?, ?, ?, ?)').run('v3', 'd2', '172.16.0.4', 'JP', 'Chrome/110', 'direct');
    } catch (err: any) {
      systemLog('ERROR', 'DB', 'Seed failed: ' + err.message);
    }
  }
}

initSchema();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50gb' }));

  // Logging middleware
  app.use((req, res, next) => {
    systemLog('INFO', 'Router', `${req.method} ${req.url}`);
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
      
      let apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");
      
      let systemInstruction = "You are the Nexus OS AI Operations Agent. You manage web apps, users, ads, and system traffic using the runSql tool. For data interpretation tasks, first fetch data using runSql, then process it using analyzeData if needed. If asked to fix or edit an app, modify the components using runSql. Be concise, authoritative, and helpful.";
      let aiModel = "gpt-4o";

      if (agent_id) {
        const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent_id) as any;
        if (agent) {
          systemInstruction = agent.system_instruction;
          if (agent.model && agent.model.includes('gpt')) {
            aiModel = agent.model;
          } else {
             // Default if they had gemini set before
             aiModel = 'gpt-4o';
          }
          if (agent.api_key) {
            apiKey = agent.api_key;
          }
        }
      }

      const openai = new OpenAI({ apiKey });

      const tools: any[] = [
        {
          type: "function",
          function: {
            name: "runSql",
            description: "Execute a sqlite SQL query. Table schemas: domains(id, name, description), components(id, domain_id, type, visible, config, updated_at), users(id, email, role, is_banned, created_at, last_login), ads(id, domain_id, campaign_name, active, config, created_at), visits(id, domain_id, ip_address, country, user_agent, referrer, created_at), settings(key, value, updated_at). Returns either JSON array of rows or changes count.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" }
              },
              required: ["query"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "analyzeData",
            description: "Perform data processing or mathematical analysis on given data. Use this after fetching data with runSql to compute growth rates, sums, or statistical summaries before responding.",
            parameters: {
              type: "object",
              properties: {
                operation: { type: "string", description: "The operation to perform (e.g., 'growth_rate', 'sum', 'average', 'count')" },
                data: { type: "array", items: { type: "number" }, description: "Array of numeric values to analyze. For growth_rate, provide [previousValue, currentValue]." }
              },
              required: ["operation", "data"]
            }
          }
        }
      ];

      const messages: any[] = [
        { role: "system", content: systemInstruction },
        { role: "user", content: instruction }
      ];

      let resultText = "";
      let keepRunning = true;
      let iterations = 0;

      while (keepRunning && iterations < 5) {
        iterations++;
        const response = await openai.chat.completions.create({
          model: aiModel,
          messages,
          tools
        });

        const message = response.choices[0].message;
        messages.push(message);

        if (message.tool_calls && message.tool_calls.length > 0) {
          for (const rawTc of message.tool_calls) {
            const tc = rawTc as any;
            let toolOutput: any;
            
            if (tc.function.name === "runSql") {
              const args = JSON.parse(tc.function.arguments);
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
            } else if (tc.function.name === "analyzeData") {
              const args = JSON.parse(tc.function.arguments);
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
            
            messages.push({
              role: "tool",
              tool_call_id: tc.id,
              name: tc.function.name,
              content: JSON.stringify(toolOutput)
            });
          }
        } else {
          resultText = message.content || "";
          keepRunning = false;
        }
      }
      
      res.json({ text: resultText || "No response generated." });
    } catch (e: any) {
       systemLog('ERROR', 'Agent', `Agent Error: ${e.message}`);
       res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/domains", (req, res) => {
    try {
      res.json(db.prepare('SELECT * FROM domains').all());
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/domains", (req, res) => {
    try {
      const { id, name, description } = req.body;
      systemLog('INFO', 'Domains', `Creating domain ${name}`);
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
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
