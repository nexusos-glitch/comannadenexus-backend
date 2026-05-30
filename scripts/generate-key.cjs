const Database = require('better-sqlite3');
const crypto = require('crypto');

const db = new Database('./data.db');

const args = process.argv.slice(2);
const name = args[0] || 'CLI Generated Key';

const rawKey = crypto.randomBytes(32).toString('hex');
const prefix = rawKey.substring(0, 8);
const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
const id = 'key_' + crypto.randomBytes(8).toString('hex');

db.prepare(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    domain_id TEXT,
    last_used DATETIME,
    use_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (domain_id) REFERENCES domains (id) ON DELETE CASCADE
  );
`).run();

db.prepare('INSERT INTO api_keys (id, name, key_hash, prefix) VALUES (?, ?, ?, ?)').run(id, name, hash, prefix);

console.log('=============================================');
console.log('                 SUCCESS                     ');
console.log('=============================================');
console.log(`Key Name: ${name}`);
console.log(`Key ID:   ${id}`);
console.log(`\nYOUR API KEY ->   ${rawKey}   <-`);
console.log('\nWARNING: Store this key safely. You cannot view the raw key again!');
console.log('=============================================');
