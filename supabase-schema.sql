-- ==============================================
-- COMMANDNEXUS OS - SUPABASE POSTGRES SCHEMA
-- Execute this directly in your Supabase SQL Editor
-- ==============================================

-- DOMAINS (Access Points)
CREATE TABLE domains (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPONENTS (Dynamic React Registry)
CREATE TABLE components (
    id TEXT PRIMARY KEY,
    domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    type TEXT NOT NULL,
    visible BOOLEAN DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USERS (Admin / Operator Access)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT DEFAULT 'operator',
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- AGENTS (AI Core Matrix)
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT DEFAULT 'gemini-3.1-pro-preview',
    system_instruction TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT VERSIONS (Configuration Rollbacks)
CREATE TABLE agent_versions (
    id TEXT PRIMARY KEY,
    agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    system_instruction TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MEMBERS (Harvested Neural Leads)
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    source TEXT DEFAULT 'organic',
    campaign_id TEXT,
    intent_score INTEGER DEFAULT 0,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS (Global Configuration Flags)
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ADS (Advertising Payloads)
CREATE TABLE ads (
    id TEXT PRIMARY KEY,
    domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    campaign_name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VISITS (Global Telemetry / Traffic)
CREATE TABLE visits (
    id TEXT PRIMARY KEY,
    domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
    domain_name TEXT NOT NULL,
    ip_address TEXT,
    country TEXT,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API KEYS (Bearer Authorization)
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    prefix TEXT NOT NULL,
    domain_id TEXT REFERENCES domains(id) ON DELETE CASCADE,
    last_used TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API KEY USAGE (Volume Tracking)
CREATE TABLE api_key_usage (
    id TEXT PRIMARY KEY,
    api_key_id TEXT REFERENCES api_keys(id) ON DELETE CASCADE,
    name TEXT,
    usage_date DATE NOT NULL,
    calls INTEGER DEFAULT 1,
    UNIQUE(api_key_id, usage_date)
);

-- LOGS (System Event Logs)
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    level TEXT NOT NULL,
    source TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create secure Role Level Security (RLS) policies 
-- Automatically reject all public anonymous access
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
-- Keep telemetry open for inserts
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public telemetry creation" ON visits FOR INSERT TO anon WITH CHECK (true);

-- ==============================================
-- UPDATE: Admin-only control + API key generator
-- ==============================================

create extension if not exists pgcrypto with schema extensions;

-- Admin allowlist
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admins can read admin_users" on public.admin_users;
create policy "admins can read admin_users"
on public.admin_users for select
to authenticated
using (exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid())
));

-- Helper: check admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Add ownership if not present
alter table public.agents
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table public.api_keys
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- Admin-only RLS
drop policy if exists "admins manage agents" on public.agents;
create policy "admins manage agents"
on public.agents
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins manage api_keys" on public.api_keys;
create policy "admins manage api_keys"
on public.api_keys
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());


-- 4) Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_agents_updated_at on public.agents;
create trigger trg_agents_updated_at
before update on public.agents
for each row execute function public.set_updated_at();

drop trigger if exists trg_domains_updated_at on public.domains;
create trigger trg_domains_updated_at
before update on public.domains
for each row execute function public.set_updated_at();

-- Issue API key (returns raw key ONCE, stores hash)
create or replace function public.issue_api_key(
  p_name text,
  p_domain_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_raw text;
  v_prefix text;
  v_hash text;
  v_id text;
begin
  if not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  v_raw := 'cnx_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_prefix := left(v_raw, 12);
  v_hash := encode(digest(v_raw, 'sha256'), 'hex');
  v_id := encode(extensions.gen_random_bytes(12), 'hex');

  insert into public.api_keys (id, name, key_hash, prefix, domain_id, owner_user_id)
  values (v_id, p_name, v_hash, v_prefix, p_domain_id, (select auth.uid()));

  return jsonb_build_object(
    'id', v_id,
    'name', p_name,
    'prefix', v_prefix,
    'api_key', v_raw
  );
end;
$$;

revoke all on function public.issue_api_key(text, text) from public;
grant execute on function public.issue_api_key(text, text) to authenticated;

-- API key verify + usage counter (for backend/edge function use)
create or replace function public.verify_api_key(p_key text)
returns table(api_key_id text, domain_id text, key_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text;
begin
  v_hash := encode(digest(p_key, 'sha256'), 'hex');

  update public.api_keys
  set last_used = now(),
      use_count = coalesce(use_count, 0) + 1
  where key_hash = v_hash
  returning id, api_keys.domain_id, api_keys.name
  into api_key_id, domain_id, key_name;

  if api_key_id is not null then
    return next;
  end if;
end;
$$;

revoke all on function public.verify_api_key(text) from public;
grant execute on function public.verify_api_key(text) to service_role;
