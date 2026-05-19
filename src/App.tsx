/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  Server, Settings, Layout, Layers, Plus, ExternalLink, 
  Trash2, Edit3, Save, X, Activity, Database, Terminal, ShieldAlert,
  Users, UserX, UserCheck, Megaphone, LineChart, Globe, Lock, ShieldBan, LockKeyhole
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- DYNAMIC RENDERER ---

const ComponentMap: Record<string, React.FC<any>> = {
  'marketing-banner': ({ config }) => (
    <Link to={config.url || '?page=home'} style={{ backgroundColor: config.color || '#ea580c' }} className="w-full text-white p-4 text-center font-bold flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
      <span>{config.text || 'Announcement Banner!'}</span>
    </Link>
  ),
  'navbar': ({ config }) => (
    <nav className="bg-black border-b border-orange-900 p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="text-orange-500 font-bold text-xl uppercase tracking-widest">{config.logo || 'BRAND'}</div>
        <div className="flex items-center gap-6">
          <Link to="?page=home" className="text-white hover:text-orange-500 font-medium">Home</Link>
          <Link to="?page=campaign" className="text-white hover:text-orange-500 font-medium">Campaigns</Link>
          <Link to="?page=pricing" className="text-white hover:text-orange-500 font-medium">Pricing</Link>
          <Link to="?page=members" className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded font-bold uppercase text-sm tracking-wide">Member Portal</Link>
        </div>
      </div>
    </nav>
  ),
  'pricing-table': ({ config }) => (
    <div className="py-12 bg-white text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-4xl font-extrabold sm:text-center tracking-tight">Access Tiers</h1>
          <p className="mt-5 text-xl text-orange-800 sm:text-center">Select your membership level.</p>
        </div>
        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          <div className={cn("border border-orange-200 rounded-lg shadow-xl divide-y divide-orange-200 transform transition-transform hover:scale-105", config.plan === 'basic' && "border-orange-500 ring-2 ring-orange-500")}>
            <div className="p-6"><h2 className="text-xl leading-6 font-bold text-black uppercase">Basic Member</h2>
              <p className="mt-4 text-sm text-orange-900 font-medium">Standard community access.</p>
              <p className="mt-8"><span className="text-5xl font-black text-black">19</span><span className="text-base font-medium text-orange-900">/mo {config.currency}</span></p>
              <Link to="?page=members" className="mt-8 flex justify-center w-full bg-orange-100 text-orange-800 border border-transparent rounded-md py-3 text-sm font-bold uppercase tracking-wider hover:bg-orange-200 transition-colors">Join Basic</Link>
            </div>
          </div>
          <div className={cn("border border-orange-200 rounded-lg shadow-xl divide-y divide-orange-200 transform transition-transform hover:scale-105", config.plan === 'pro' && "border-orange-500 ring-2 ring-orange-500")}>
            <div className="p-6"><h2 className="text-xl leading-6 font-bold text-black uppercase">Pro Member</h2>
              <p className="mt-4 text-sm text-orange-900 font-medium">Full AI agent integration & API.</p>
              <p className="mt-8"><span className="text-5xl font-black text-black">49</span><span className="text-base font-medium text-orange-900">/mo {config.currency}</span></p>
              <Link to="?page=members" className="mt-8 flex justify-center w-full bg-orange-600 border border-transparent rounded-md py-3 text-sm font-bold shadow shadow-orange-900/50 text-white uppercase tracking-wider hover:bg-orange-500 transition-colors">Join Pro</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  'hero': ({ config }) => (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 py-24 px-4 sm:px-6 lg:px-8 text-center flex flex-col justify-center items-center min-h-[600px] border-b border-orange-200">
      <h1 className="text-5xl tracking-tighter font-black text-black sm:text-6xl md:text-7xl uppercase">
        <span className="block">{config.title || "Hero Title"}</span>
      </h1>
      <p className="mt-6 max-w-lg mx-auto text-lg text-orange-900 sm:text-xl md:mt-8 md:text-2xl md:max-w-3xl font-medium leading-relaxed">
        {config.subtitle || "Your subtitle here"}
      </p>
      <div className="mt-10 max-w-md mx-auto sm:flex sm:justify-center md:mt-12 gap-4">
        <div className="rounded-md shadow-2xl">
          <Link to="?page=campaign" className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-700 transition-colors">
            {config.primaryAction || 'View Campaign'}
          </Link>
        </div>
        <div className="rounded-md shadow-2xl mt-3 sm:mt-0">
          <Link to="?page=members" className="w-full flex items-center justify-center px-8 py-4 border-2 border-red-600 text-lg font-bold uppercase tracking-widest text-red-600 bg-transparent hover:bg-red-50 transition-colors">
            {config.secondaryAction || 'Member Login'}
          </Link>
        </div>
      </div>
    </div>
  )
};

function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*'.split('');
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array.from({ length: columns }).fill(1) as number[];

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#dc2626'; // red-600
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" />;
}

function DynamicFrontend() {
  const { domainName } = useParams();
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') || searchParams.get('action') || 'home';

  const [data, setData] = useState<{domain: string, id: string, components: any[]} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Member/Campaign specific states
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/config/${domainName}`)
      .then(res => {
        if (!res.ok) throw new Error('Domain not found');
        return res.json();
      })
      .then(d => {
        setData(d);
        if (page === 'campaign') {
           fetch('/api/ads').then(r => r.json()).then(allAds => {
               setAds(allAds.filter((a: any) => a.domain_name === d.domain && a.active));
           });
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [domainName, page]);

  if (loading) return <div className="p-8 text-center animate-pulse text-orange-500">Loading {domainName}...</div>;
  if (error) return <div className="p-8 pb-32 text-center text-red-500"><div className="text-3xl font-bold mb-4">404</div>Domain '{domainName}' not configured.</div>;
  if (!data) return null;

  const navComponent = data.components.find(c => c.type === 'navbar' && c.visible);

  return (
    <div className="min-h-screen bg-orange-50 font-sans">
      <div className="bg-orange-950 text-white px-4 py-1 flex items-center justify-between text-xs font-mono">
        <div>LIVE PREVIEW: {data.domain}</div>
        <Link to="/" className="text-orange-400 hover:underline flex items-center gap-1"><Server className="w-3 h-3"/> Dashboard</Link>
      </div>
      
      {navComponent && ComponentMap['navbar'] && React.createElement(ComponentMap['navbar'], { config: navComponent.config })}

      {page === 'home' && (
        <>
          {data.components.filter(c => c.visible && c.type !== 'navbar').map((comp: any) => {
            const Component = ComponentMap[comp.type];
            if (!Component) return <div key={comp.id} className="p-4 border border-dashed border-red-300 text-red-500 font-bold">Unknown component type: {comp.type}</div>;
            return <Component key={comp.id} config={comp.config} />;
          })}
        </>
      )}

      {page === 'campaign' && (
        <div className="max-w-7xl mx-auto px-4 py-12">
           <h2 className="text-3xl font-bold text-black uppercase tracking-tight mb-8 border-b-4 border-orange-500 pb-2 inline-block">Active Campaigns</h2>
           {ads.length === 0 ? (
             <div className="text-orange-800 text-lg">No active campaigns for {data.domain} currently broadcasted from the Command Center.</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {ads.map(ad => (
                 <div key={ad.id} className="bg-white p-6 rounded-xl shadow-2xl border-2 border-orange-200 hover:border-orange-500 transition-colors">
                    <div className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-2">Campaign ID: {ad.campaign_name}</div>
                    <img src={ad.config.image || "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80"} alt="Ad creative" className="w-full h-48 object-cover rounded mb-4" />
                    <div className="text-lg font-bold">Promotional Offer</div>
                    <button 
                      onClick={(e) => {
                        const btn = e.currentTarget;
                        btn.textContent = 'Offer Redeemed!';
                        btn.className = "mt-4 w-full bg-green-600 text-white font-bold uppercase py-3 rounded cursor-not-allowed";
                      }}
                      className="mt-4 w-full bg-red-600 hover:bg-red-500 text-white font-bold uppercase py-3 rounded transition-colors"
                    >
                      Redeem Offer (CPC: ${ad.config.cpc})
                    </button>
                 </div>
               ))}
             </div>
           )}
        </div>
      )}

      {page === 'members' && (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white border-2 border-orange-200 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-black text-center uppercase tracking-widest mb-6">Member Access</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const btn = document.getElementById('auth-btn');
            if (btn) {
              btn.textContent = 'Authenticating...';
              btn.className = "w-full bg-orange-600 text-white font-bold uppercase tracking-widest py-4 rounded mt-4 cursor-wait";
              setTimeout(() => {
                btn.textContent = 'Access Denied: Sector Locked';
                btn.className = "w-full bg-red-600 text-white font-bold uppercase tracking-widest py-4 rounded mt-4 cursor-not-allowed";
              }, 1500);
            }
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Identity</label>
                <input required type="text" className="w-full border-2 border-orange-200 p-3 outline-none focus:border-orange-500 rounded bg-orange-50" placeholder="Email or UID" />
              </div>
              <div>
                <label className="block text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Passphrase</label>
                <input required type="password" className="w-full border-2 border-orange-200 p-3 outline-none focus:border-orange-500 rounded bg-orange-50" placeholder="••••••••" />
              </div>
              <button id="auth-btn" type="submit" className="w-full bg-black text-white font-bold uppercase tracking-widest py-4 rounded mt-4 hover:bg-orange-600 transition-colors">
                Authenticate
              </button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm text-orange-800">
             Security Note: The Command Center currently enforces strict rate-limits on authentication attempts.
          </div>
        </div>
      )}

      {page === 'pricing' && (
         <>
           {data.components.filter(c => c.type === 'pricing-table').map((comp: any) => {
              const Component = ComponentMap[comp.type];
              return <Component key={comp.id} config={comp.config} />;
            })}
         </>
      )}

    </div>
  );
}


// --- ADMIN DASHBOARD ---

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [domains, setDomains] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [viewingAgentVersionsId, setViewingAgentVersionsId] = useState<string | null>(null);
  const [agentVersions, setAgentVersions] = useState<any[]>([]);
  const [newAgentForm, setNewAgentForm] = useState({ name: '', model: 'gemini-3.1-pro-preview', instruction: '', role: 'operator', apiKey: '' });

  const fetchAgentVersions = async (id: string) => {
    const res = await fetch(`/api/agents/${id}/versions`);
    const data = await res.json();
    setAgentVersions(data);
  };


  const fetchAll = async () => {
    const [dRes, cRes, uRes, aRes, vRes, agRes] = await Promise.all([
      fetch('/api/domains').then(r => r.json()),
      fetch('/api/components').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/ads').then(r => r.json()),
      fetch('/api/visits').then(r => r.json()),
      fetch('/api/agents').then(r => r.json())
    ]);
    setDomains(dRes);
    setComponents(cRes);
    setUsers(uRes);
    setAds(aRes);
    setVisits(vRes);
    setAgents(agRes);
    if (!selectedAgentId && agRes.length > 0) setSelectedAgentId(agRes[0].id);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // -- Component Edit State --
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  // -- Modals --
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authSettings, setAuthSettings] = useState({ require2fa: false, sessionTimeoutHours: 24, passwordComplexity: 'medium' });

  const [showAdModal, setShowAdModal] = useState(false);
  const [adForm, setAdForm] = useState({ domain_id: '', campaign_name: '', configStr: '{"cpc": 0.5}', active: true });

  const fetchAuthSettings = async () => {
    try {
      const res = await fetch('/api/settings/auth');
      if (res.ok) {
        setAuthSettings(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveAuthSettings = async () => {
    try {
      await fetch('/api/settings/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: authSettings })
      });
      setShowAuthModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const deployAd = async () => {
    try {
      const config = JSON.parse(adForm.configStr);
      await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'a' + Date.now(), ...adForm, config })
      });
      setShowAdModal(false);
      fetchAll();
    } catch (e) {
      alert("Invalid JSON for ad config");
    }
  };

  const startEdit = (comp: any) => {
    setEditingId(comp.id);
    setEditForm({
      configJson: JSON.stringify(comp.config, null, 2),
      visible: comp.visible
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const parsedConfig = JSON.parse(editForm.configJson);
      await fetch(`/api/components/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: components.find(c=>c.id===id).type, visible: editForm.visible, config: parsedConfig })
      });
      setEditingId(null);
      fetchAll();
    } catch (e) {
      alert("Invalid JSON format");
    }
  };

  // -- Ban Handling --
  const toggleBan = async (id: string, currentBanStatus: number) => {
    try {
      await fetch('/api/users/ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_banned: !currentBanStatus })
      });
      fetchAll();
    } catch (err) {
      console.error(err);
    }
  };

  // -- SQL Engine State --
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  
  const [agentInput, setAgentInput] = useState('');
  const [agentLogs, setAgentLogs] = useState<string[]>(['[SYSTEM] Agent initialized. Awaiting commands...', '[SYSTEM] Connected to primary database.', '[SYSTEM] Real-time neural network online.']);
  
  const submitAgentCommand = async (e: any) => {
    e.preventDefault();
    if (!agentInput.trim()) return;
    
    const input = agentInput.trim();
    setAgentLogs(prev => [...prev, `[USER] ${input}`]);
    setAgentInput('');
    
    setAgentLogs(prev => [...prev, `[AGENT] Analyzing instruction: "${input}"...`]);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: input, agent_id: selectedAgentId })
      });
      const data = await res.json();
      if (data.error) {
        setAgentLogs(prev => [...prev, `[AGENT-ERROR] ${data.error}`]);
      } else {
        const responseLines = data.text.split('\n').map((l: string) => `[AGENT] ${l}`);
        setAgentLogs(prev => [...prev, ...responseLines]);
      }
      fetchAll();
    } catch (e: any) {
      setAgentLogs(prev => [...prev, `[AGENT-ERROR] Failed to connect to AI Core: ${e.message}`]);
    }
  };

  const runSql = async () => {
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      setSqlResult(data);
    } catch (err: any) {
      setSqlResult({ error: err.message });
    }
  };

  // -- Live Logs State --
  const [logs, setLogs] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (activeTab === 'logs') {
      const sse = new EventSource('/api/logs/stream');
      sse.onmessage = (e) => {
        const log = JSON.parse(e.data);
        setLogs(prev => [...prev, log].slice(-100)); // Keep last 100
      };
      return () => sse.close();
    }
  }, [activeTab]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="min-h-screen flex bg-black text-white font-sans selection:bg-orange-500 selection:text-white">
      {/* Sidebar */}
      <div className="w-64 bg-orange-950 border-r border-orange-900 flex flex-col">
        <div className="p-4 border-b border-orange-900 font-bold flex items-center gap-2 tracking-widest text-orange-500">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          CMD_CTRL
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            <button 
              onClick={() => setActiveTab('overview')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'overview' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Server className="w-4 h-4"/> Overview
            </button>
            <button 
              onClick={() => setActiveTab('members')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'members' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Users className="w-4 h-4"/> Member Access
            </button>
            <button 
              onClick={() => setActiveTab('ads')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'ads' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Megaphone className="w-4 h-4"/> Advertising
            </button>
            <button 
              onClick={() => setActiveTab('traffic')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'traffic' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <LineChart className="w-4 h-4"/> Server Traffic
            </button>
            <button 
              onClick={() => setActiveTab('config')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'config' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Layers className="w-4 h-4"/> Interface Config
            </button>
            <button 
              onClick={() => setActiveTab('sql')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'sql' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Database className="w-4 h-4"/> SQL Engine
            </button>
            <button 
              onClick={() => setActiveTab('logs')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'logs' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Terminal className="w-4 h-4"/> System Events
            </button>
            <button 
              onClick={() => setActiveTab('agents_management')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === 'agents_management' ? "bg-orange-600 text-white font-bold" : "text-orange-200 hover:bg-orange-900 hover:text-white")}
            >
              <Settings className="w-4 h-4"/> Agents Matrix
            </button>
            <button 
              onClick={() => setActiveTab('agent')} 
              className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors border border-red-900 bg-red-950/30 mt-2", activeTab === 'agent' ? "bg-red-600 border-red-500 text-white font-bold shadow-lg shadow-red-900/50" : "text-red-400 hover:bg-red-900 hover:text-white")}
            >
              <ShieldAlert className="w-4 h-4"/> AI Operations Agent
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="border-b border-orange-900 px-6 py-4 flex items-center justify-between bg-black">
          <h1 className="text-xl font-bold text-orange-500 uppercase tracking-wider">
            {activeTab === 'overview' && 'System Overview'}
            {activeTab === 'config' && 'Dynamic Configurations Engine'}
            {activeTab === 'sql' && 'Database Direct Access'}
            {activeTab === 'logs' && 'Real-time Event Stream'}
          </h1>
          <div className="flex items-center gap-2 text-sm text-red-500 font-mono animate-pulse font-bold">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> CONNECTION SECURE
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               {/* TOP KPIS */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                   <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Systems Online</div>
                   <div className="text-4xl text-white font-mono">{domains.length}</div>
                 </div>
                 <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                   <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Total Access Tokens</div>
                   <div className="text-4xl text-white font-mono">{users.length}</div>
                 </div>
                 <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                   <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Active Campaigns</div>
                   <div className="text-4xl text-white font-mono">{ads.filter(a => a.active).length}</div>
                 </div>
                 <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                   <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Network Stress</div>
                   <div className="text-4xl text-red-500 font-mono animate-pulse">{(visits.length * 2.4).toFixed(1)}%</div>
                 </div>
               </div>

               {/* TRAFFIC CHART */}
               <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg shadow-lg shadow-orange-900/20">
                 <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1 inline-block flex items-center gap-2">
                     <Activity className="w-5 h-5 text-red-500"/>
                     Global Telemetry Stream
                   </h2>
                 </div>
                 <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={[
                        { time: '00:00', load: 120, agents: 40 },
                        { time: '04:00', load: 300, agents: 80 },
                        { time: '08:00', load: 1800, agents: 300 },
                        { time: '12:00', load: 2200, agents: 450 },
                        { time: '16:00', load: 1950, agents: 320 },
                        { time: '20:00', load: 800, agents: 150 },
                        { time: '23:59', load: 400, agents: 70 },
                     ]}>
                       <defs>
                         <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                         </linearGradient>
                         <linearGradient id="colorAgents" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8}/>
                           <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="#9a3412" vertical={false} />
                       <XAxis dataKey="time" stroke="#fdba74" tick={{ fill: '#fdba74', fontSize: 12 }} />
                       <YAxis stroke="#fdba74" tick={{ fill: '#fdba74', fontSize: 12 }} />
                       <Tooltip
                         contentStyle={{ backgroundColor: '#000', borderColor: '#ea580c', color: '#fff' }}
                         itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                       />
                       <Area type="monotone" dataKey="load" stroke="#ea580c" fillOpacity={1} fill="url(#colorLoad)" />
                       <Area type="monotone" dataKey="agents" stroke="#dc2626" fillOpacity={1} fill="url(#colorAgents)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div>
                 <div className="flex justify-between items-center mb-4 border-b-2 border-orange-600 pb-1">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                     <Server className="w-5 h-5"/>
                     Active Domain Controllers ({domains.length})
                   </h2>
                   <button onClick={() => {
                     const name = window.prompt("Enter App/Domain Name (e.g. app.myapp.com)");
                     if (!name) return;
                     const description = window.prompt("Enter Description");
                     const id = 'd' + Date.now();
                     fetch('/api/domains', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ id, name, description: description || '' })
                     }).then(fetchAll);
                   }} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1 uppercase tracking-wide transition-colors">
                     <Plus className="w-4 h-4"/> Add App
                   </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {domains.map(d => (
                     <div key={d.id} className="bg-orange-950 border border-orange-800 p-6 rounded-lg hover:border-orange-500 transition-colors shadow-lg shadow-orange-900/20">
                       <div className="font-bold text-xl text-white mb-1">{d.name}</div>
                       <div className="text-sm text-orange-300 mb-4">{d.description}</div>
                       <Link to={`/preview/${d.name}`} className="inline-flex items-center gap-2 text-sm bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded font-bold text-white transition">
                         <ExternalLink className="w-4 h-4"/> Connect Tunnel
                       </Link>
                     </div>
                   ))}
                   
                   <div className="border border-dashed border-orange-800 rounded-lg flex items-center justify-center p-6 hover:bg-orange-950/50 cursor-pointer transition-colors text-orange-500 hover:text-orange-400">
                     <div className="flex flex-col items-center gap-2">
                       <Plus className="w-8 h-8" />
                       <span className="font-bold uppercase text-sm">Provision New Target</span>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1">Access Control & Member Oversight</h2>
                 <button onClick={() => { setShowAuthModal(true); fetchAuthSettings(); }} className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 uppercase tracking-wide transition-colors">
                   <LockKeyhole className="w-4 h-4"/> Global Auth Settings
                 </button>
              </div>
              <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900">
                <table className="min-w-full divide-y divide-orange-900">
                  <thead className="bg-orange-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">User / Email</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Privilege Level</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Security Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-orange-200 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-900 text-sm">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-orange-950/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-white">{u.email}</div>
                          <div className="text-orange-500 text-xs font-mono">UID: {u.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn("px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase rounded-none border border-orange-800", u.role === 'admin' ? "bg-orange-900 text-orange-200" : "bg-black text-orange-500")}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-400 font-mono text-xs">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {u.is_banned ? (
                            <span className="text-red-500 font-bold flex items-center gap-1 uppercase text-xs"><ShieldBan className="w-4 h-4"/> Revoked</span>
                          ) : (
                            <span className="text-green-500 font-bold flex items-center gap-1 uppercase text-xs"><UserCheck className="w-4 h-4"/> Active</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          <button onClick={() => toggleBan(u.id, u.is_banned)} className={cn("px-4 py-2 font-bold uppercase text-xs rounded transition-colors border", u.is_banned ? "text-orange-300 border-orange-700 bg-black hover:bg-orange-900" : "text-black bg-red-600 border-red-500 hover:bg-red-500")}>
                            {u.is_banned ? 'Restore Access' : 'Ban Identity'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ADVERTISING TAB */}
          {activeTab === 'ads' && (
            <div className="animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1">Advertising Network</h2>
                 <button onClick={() => setShowAdModal(true)} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 uppercase tracking-wide transition-colors">
                   <Plus className="w-4 h-4"/> Deploy Campaign
                 </button>
              </div>
              <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900">
                <table className="min-w-full divide-y divide-orange-900">
                  <thead className="bg-orange-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Network / Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Payload Data</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-orange-200 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-900 text-sm">
                    {ads.map(a => (
                      <tr key={a.id} className="hover:bg-orange-950/30">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-white">{a.domain_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-400 font-bold">{a.campaign_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <pre className="text-xs font-mono bg-black border border-orange-900 p-2 rounded text-orange-300 inline-block">{JSON.stringify(a.config)}</pre>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={cn("px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase rounded-none border border-green-800 bg-green-900/20 text-green-500", !a.active && "border-red-800 bg-red-900/20 text-red-500")}>
                            {a.active ? 'Broadcasting' : 'Halted'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {ads.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-orange-600 font-bold uppercase tracking-widest">No active campaigns</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TRAFFIC TAB */}
          {activeTab === 'traffic' && (
            <div className="animate-in fade-in duration-300 space-y-6">
               <div className="flex justify-between items-center">
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1 inline-block">Server Traffic Analytics</h2>
                 <div className="flex items-center gap-2 text-sm text-green-500 font-bold uppercase animate-pulse">
                   <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Sentinel Active
                 </div>
               </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent group-hover:opacity-100 opacity-0 transition-opacity"></div>
                  <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Total Packets</div>
                  <div className="text-4xl text-white font-mono">{visits.length * 1042}</div>
                </div>
                <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-600/20 to-transparent group-hover:opacity-100 opacity-0 transition-opacity"></div>
                  <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Unique IPs Captured</div>
                  <div className="text-4xl text-white font-mono">{new Set(visits.map(v => v.ip_address)).size}</div>
                </div>
                <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent animate-pulse"></div>
                  <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Network Security</div>
                  <div className="text-4xl text-green-400 font-mono">SECURE</div>
                </div>
              </div>

              <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest mb-4">Request Origin Density</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { region: 'NA East', requests: 4000 },
                      { region: 'NA West', requests: 3000 },
                      { region: 'EU Central', requests: 2000 },
                      { region: 'AP South', requests: 2780 },
                      { region: 'SA East', requests: 1890 },
                      { region: 'Unknown', requests: 2390 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#9a3412" vertical={false} />
                      <XAxis dataKey="region" stroke="#fdba74" tick={{ fill: '#fdba74', fontSize: 12 }} />
                      <YAxis stroke="#fdba74" tick={{ fill: '#fdba74', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#431407' }} contentStyle={{ backgroundColor: '#000', borderColor: '#ea580c', color: '#fff' }} />
                      <Bar dataKey="requests" fill="#ea580c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900 shadow-xl">
                <table className="min-w-full divide-y divide-orange-900">
                  <thead className="bg-orange-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Source IP / Region</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Client Signature</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Referral Vector</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-900 text-sm">
                    {visits.map(v => (
                      <tr key={v.id} className="hover:bg-orange-950/30">
                        <td className="px-6 py-4 whitespace-nowrap text-orange-500 font-mono text-xs">{new Date(v.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-white">{v.domain_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-red-400 font-mono text-xs">{v.ip_address}</div>
                          <div className="text-orange-600 text-xs font-bold uppercase">{v.country}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-300 max-w-xs truncate" title={v.user_agent}>{v.user_agent}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-400 max-w-xs truncate">{v.referrer}</td>
                      </tr>
                    ))}
                    {visits.length === 0 && (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-orange-600 font-bold uppercase tracking-widest">No traffic intercepted</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONFIG TAB */}
          {activeTab === 'config' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white">Component Registry (JSONB store)</h2>
                 <button onClick={() => {
                   setEditingId('new');
                   setEditForm({
                     domain_id: domains[0]?.id || '',
                     type: 'marketing-banner',
                     visible: true,
                     configJson: '{\n  "text": "New Banner"\n}'
                   });
                 }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 uppercase tracking-wide">
                   <Plus className="w-4 h-4"/> Inject Payload
                 </button>
              </div>
              <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900">
                <table className="min-w-full divide-y divide-orange-900">
                  <thead className="bg-orange-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Target Domain</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Entity Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Configuration Matrix</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-orange-200 uppercase tracking-widest">Execute</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-900 text-sm">
                    {editingId === 'new' && (
                      <tr className="bg-orange-950/50">
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                           <select 
                             className="w-full bg-black border border-orange-600 text-white p-1 rounded"
                             value={editForm.domain_id}
                             onChange={e => setEditForm({...editForm, domain_id: e.target.value})}
                           >
                             <option value="">Select Domain...</option>
                             {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                           </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-white">
                           <input type="text" className="w-full bg-black border border-orange-600 text-white p-1 rounded" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})} placeholder="e.g. hero" />
                        </td>
                        <td className="px-6 py-4">
                           <textarea className="w-full bg-black border border-orange-600 text-orange-400 p-2 rounded font-mono text-xs focus:ring-2 focus:ring-red-500 focus:outline-none" rows={4} value={editForm.configJson} onChange={e => setEditForm({...editForm, configJson: e.target.value})} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                           <label className="flex items-center gap-2 cursor-pointer text-orange-400 font-bold">
                              <input type="checkbox" className="accent-red-500" checked={editForm.visible} onChange={e => setEditForm({...editForm, visible: e.target.checked})}/>
                              <span className="text-xs uppercase">Visible</span>
                           </label>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                           <div className="flex items-center justify-end gap-3">
                              <button onClick={() => setEditingId(null)} className="text-orange-500 hover:text-white bg-black border border-orange-800 px-3 py-1 rounded flex items-center gap-1 uppercase text-xs font-bold"><X className="w-3 h-3"/> Abort</button>
                              <button onClick={async () => {
                                try {
                                  if (!editForm.domain_id) return;
                                  const config = JSON.parse(editForm.configJson);
                                  await fetch('/api/components', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: 'c' + Date.now(), domain_id: editForm.domain_id, type: editForm.type, visible: editForm.visible, config })
                                  });
                                  setEditingId(null);
                                  fetchAll();
                                } catch (e) {
                                  console.error("Invalid JSON!");
                                }
                              }} className="text-white hover:bg-green-600 bg-green-700 px-3 py-1 rounded flex items-center gap-1 uppercase text-xs font-bold shadow-lg shadow-green-900/50"><Save className="w-3 h-3"/> Deploy</button>
                           </div>
                        </td>
                      </tr>
                    )}
                    {components.map(c => (
                      <tr key={c.id} className="hover:bg-orange-950/30">
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                          {c.domain_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-red-400 font-mono text-sm font-bold">{c.type}</div>
                          <div className="text-orange-500 text-xs font-mono">ID: {c.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          {editingId === c.id ? (
                             <textarea 
                               className="w-full bg-black border border-orange-500 text-orange-400 rounded p-3 font-mono text-xs focus:ring-2 focus:ring-red-500 focus:outline-none placeholder-orange-800"
                               rows={5}
                               value={editForm.configJson}
                               onChange={(e) => setEditForm({...editForm, configJson: e.target.value})}
                             />
                          ) : (
                            <pre className="text-xs font-mono bg-black border border-orange-900 p-3 rounded text-orange-400 max-h-32 overflow-y-auto">
                              {JSON.stringify(c.config, null, 2)}
                            </pre>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === c.id ? (
                            <label className="flex items-center gap-2 cursor-pointer text-orange-400 font-bold">
                              <input type="checkbox" className="accent-red-500" checked={editForm.visible} onChange={e => setEditForm({...editForm, visible: e.target.checked})}/>
                              <span className="text-xs uppercase">Visible</span>
                            </label>
                          ) : (
                            <span className={cn("px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase rounded-none border", c.visible ? "bg-red-900/30 text-red-400 border-red-500" : "bg-black text-orange-700 border-orange-900")}>
                              {c.visible ? 'Online' : 'Offline'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                          {editingId === c.id ? (
                            <div className="flex items-center justify-end gap-3">
                               <button onClick={() => setEditingId(null)} className="text-orange-500 hover:text-white bg-black border border-orange-800 px-3 py-1 rounded flex items-center gap-1 uppercase text-xs font-bold"><X className="w-3 h-3"/> Abort</button>
                               <button onClick={() => saveEdit(c.id)} className="text-white hover:bg-red-500 bg-red-600 px-3 py-1 rounded flex items-center gap-1 uppercase text-xs font-bold shadow-lg shadow-red-900/50"><Save className="w-3 h-3"/> Commit</button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button onClick={() => startEdit(c)} className="text-orange-400 hover:text-white transition-colors" title="Modify Payload"><Edit3 className="w-5 h-5"/></button>
                              <button onClick={async () => {
                                await fetch(`/api/components/${c.id}`, { method: 'DELETE' });
                                fetchAll();
                              }} className="text-red-600 hover:text-red-400 transition-colors" title="Destroy"><Trash2 className="w-5 h-5"/></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SQL TAB */}
          {activeTab === 'sql' && (
            <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-300">
               <h2 className="text-lg font-bold text-white border-b-2 border-orange-600 inline-block self-start pb-1">Raw Database Terminal</h2>
               
               <div className="flex flex-col gap-2">
                 <textarea 
                   className="w-full bg-black border border-orange-600 text-orange-400 font-mono p-4 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-y min-h-[120px]"
                   value={sqlQuery}
                   onChange={e => setSqlQuery(e.target.value)}
                   spellCheck={false}
                   placeholder="Enter SQL command (e.g. SELECT * FROM users;)"
                 />
                 <div className="flex justify-end pt-2">
                   <button 
                     onClick={runSql}
                     className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest px-6 py-3 rounded flex items-center gap-2 shadow-lg shadow-red-900"
                   >
                     Execute Query <Terminal className="w-4 h-4" />
                   </button>
                 </div>
               </div>

               <div className="flex-1 bg-black border border-orange-900 rounded overflow-auto mt-4 p-4 font-mono text-sm relative">
                  {sqlResult ? (
                    sqlResult.error ? (
                      <div className="text-red-500 font-bold whitespace-pre-wrap">ERR: {sqlResult.error}</div>
                    ) : sqlResult.success && sqlResult.type === 'read' ? (
                      <table className="min-w-full text-left text-orange-200">
                        <thead>
                          {sqlResult.data.length > 0 && (
                            <tr className="border-b border-orange-800">
                              {Object.keys(sqlResult.data[0]).map(k => (
                                <th key={k} className="p-2 text-orange-500 font-bold">{k}</th>
                              ))}
                            </tr>
                          )}
                        </thead>
                        <tbody>
                           {sqlResult.data.map((row: any, i: number) => (
                             <tr key={i} className="border-b border-orange-900 hover:bg-orange-950/50">
                               {Object.values(row).map((v: any, j: number) => (
                                 <td key={j} className="p-2 whitespace-nowrap">{String(v)}</td>
                               ))}
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    ) : (
                       <div className="text-orange-500 font-bold">Query executed successfully. Changes applied: {sqlResult.data?.changes}</div>
                    )
                  ) : (
                    <div className="text-orange-800 flex h-full items-center justify-center italic">Ready to receive queries...</div>
                  )}
               </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
              <h2 className="text-lg font-bold text-white border-b-2 border-orange-600 inline-block self-start pb-1 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 animate-pulse text-red-500" /> System Operations Log
              </h2>
              <div className="flex-1 bg-black border-2 border-orange-900 rounded font-mono p-4 overflow-y-auto text-sm space-y-2 shadow-[inset_0_0_20px_rgba(234,88,12,0.15)]">
                 {logs.length === 0 && <div className="text-orange-800">Awaiting incoming telemetry...</div>}
                 {logs.map(log => (
                   <div key={log.id} className="flex gap-4">
                     <span className="text-orange-600 w-48 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                     <span className={cn("w-16 shrink-0 font-bold", log.level === 'INFO' ? 'text-white' : log.level === 'WARN' ? 'text-yellow-500' : log.level === 'ERROR' ? 'text-red-500' : 'text-white')}>
                       {log.level}
                     </span>
                     <span className="text-orange-300 w-24 shrink-0">[{log.source}]</span>
                     <span className="text-white">{log.message}</span>
                   </div>
                 ))}
                 <div ref={logsEndRef} />
              </div>
            </div>
          )}

          {/* AGENTS MANAGEMENT TAB */}
          {activeTab === 'agents_management' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1">Agents Matrix</h2>
                 <button onClick={() => setEditingAgentId('new')} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 uppercase tracking-wide transition-colors">
                   <Plus className="w-4 h-4"/> Create Agent
                 </button>
              </div>

              {editingAgentId === 'new' && (
                 <div className="bg-orange-950 border-2 border-orange-600 p-6 rounded-lg mb-6 shadow-xl">
                   <h3 className="text-orange-400 font-bold uppercase tracking-widest mb-4">Initialize New Neural Network</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Agent Name</label>
                       <input value={newAgentForm.name} onChange={e => setNewAgentForm({...newAgentForm, name: e.target.value})} type="text" className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white" placeholder="E.g. Database Guardian" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Model Architecture</label>
                       <input value={newAgentForm.model} onChange={e => setNewAgentForm({...newAgentForm, model: e.target.value})} type="text" className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Agent Role</label>
                       <select value={newAgentForm.role} onChange={e => setNewAgentForm({...newAgentForm, role: e.target.value})} className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white">
                          <option value="operator">Operator</option>
                          <option value="admin">Administrator</option>
                          <option value="analyst">Data Analyst</option>
                       </select>
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">API Key (Leave blank to use base key)</label>
                       <input value={newAgentForm.apiKey} onChange={e => setNewAgentForm({...newAgentForm, apiKey: e.target.value})} type="password" placeholder="AI Studio Secret Key..." className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white font-mono text-xs" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">System Instruction (Core Directives)</label>
                       <textarea value={newAgentForm.instruction} onChange={e => setNewAgentForm({...newAgentForm, instruction: e.target.value})} className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white font-mono text-xs" rows={5} placeholder="Inject core directives and operational boundaries..."></textarea>
                     </div>
                   </div>
                   <div className="flex justify-end gap-3 mt-4">
                     <button onClick={() => setEditingAgentId(null)} className="px-4 py-2 border border-orange-800 text-orange-300 hover:text-white rounded uppercase text-sm font-bold transition-colors">Abort</button>
                     <button onClick={async () => {
                       const { name, model, instruction, role, apiKey } = newAgentForm;
                       if (!name || !instruction) return;
                       await fetch('/api/agents', {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ id: 'ag' + Date.now(), name, model, system_instruction: instruction, role, api_key: apiKey })
                       });
                       setEditingAgentId(null);
                       setNewAgentForm({ name: '', model: 'gemini-3.1-pro-preview', instruction: '', role: 'operator', apiKey: '' }); // reset form
                       fetchAll();
                     }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded uppercase text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900 transition-colors">
                        <Save className="w-4 h-4"/> Initialize Agent
                     </button>
                   </div>
                 </div>
              )}

              <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900">
                <table className="min-w-full divide-y divide-orange-900">
                  <thead className="bg-orange-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">ID / Name</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Model</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Created At</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-orange-200 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-900 text-sm">
                    {agents.map(ag => (
                      <tr key={ag.id} className="hover:bg-orange-950/30">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-bold text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-red-500" /> {ag.name}</div>
                          <div className="text-orange-500 text-xs font-mono">{ag.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-300 font-mono text-xs uppercase">{ag.role || 'operator'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-300 font-mono text-xs">{ag.model}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-300 text-xs">{new Date(ag.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium flex gap-3 justify-end items-center">
                          <button onClick={() => {
                            setViewingAgentVersionsId(ag.id);
                            fetchAgentVersions(ag.id);
                          }} className="text-orange-400 hover:text-white transition-colors uppercase text-xs font-bold border border-orange-800 rounded px-2 py-1 bg-black">Versioning</button>
                          <button onClick={async () => {
                            if (window.confirm('Eradicate neural network?')) {
                              await fetch(`/api/agents/${ag.id}`, { method: 'DELETE' });
                              fetchAll();
                            }
                          }} className="text-red-600 hover:text-red-400 transition-colors" title="Decommission Agent"><Trash2 className="w-5 h-5"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AGENT TAB */}
          {activeTab === 'agent' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300 relative z-0">
               <MatrixRain />
               <div className="flex items-center justify-between mb-4 z-10">
                 <h2 className="text-lg font-bold text-white uppercase tracking-widest text-red-500 border-b-2 border-red-600 pb-1 flex items-center gap-2 bg-black/50 px-2 rounded backdrop-blur">
                   <ShieldAlert className="w-5 h-5"/> AI Operations Agent
                 </h2>
                 <select 
                   value={selectedAgentId} 
                   onChange={(e) => setSelectedAgentId(e.target.value)} 
                   className="bg-black border border-red-900 text-white p-2 rounded text-sm font-bold shadow-[0_0_10px_rgba(220,38,38,0.3)] outline-none"
                 >
                   <option value="">-- Connect Neural Engine --</option>
                   {agents.map(ag => (
                     <option key={ag.id} value={ag.id}>{ag.name} ({ag.model})</option>
                   ))}
                 </select>
               </div>
               
               <div className="flex-1 bg-black/80 backdrop-blur z-10 border border-red-900 rounded font-mono p-4 overflow-y-auto text-sm space-y-3 mb-4 shadow-[inset_0_0_20px_rgba(220,38,38,0.3)] flex flex-col">
                  {agentLogs.map((log, i) => (
                    <div key={i} className={cn("leading-relaxed drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]", log.startsWith('[USER]') ? "text-red-300 font-bold" : log.startsWith('[AGENT-ERROR]') ? "text-yellow-500 font-black animate-pulse" : log.startsWith('[AGENT]') ? "text-red-500 font-bold" : "text-gray-500")}>
                      {log}
                    </div>
                  ))}
               </div>

               <div className="flex gap-2 z-10 mb-2">
                 <button onClick={() => setAgentInput("Repair utubecha.com by updating the hero subtitle to 'Fast and responsive video tooling'")} className="bg-black border border-orange-900 text-orange-400 hover:bg-orange-950 px-3 py-1 rounded text-xs font-bold transition-colors">Quick: Repair Component Data</button>
                 <button onClick={() => setAgentInput("Analyze user growth and visits across all domains")} className="bg-black border border-orange-900 text-orange-400 hover:bg-orange-950 px-3 py-1 rounded text-xs font-bold transition-colors">Quick: Analyze Traffic</button>
                 <button onClick={() => setAgentInput("Deploy a new marketing banner to mycanvaslab.com")} className="bg-black border border-orange-900 text-orange-400 hover:bg-orange-950 px-3 py-1 rounded text-xs font-bold transition-colors">Quick: Inject Campaign</button>
               </div>
               <form onSubmit={submitAgentCommand} className="flex gap-2 z-10">
                 <input 
                   type="text" 
                   value={agentInput}
                   onChange={e => setAgentInput(e.target.value)}
                   placeholder="Enter operation command (e.g. 'Fix hero title on utubecha' or 'Ban malicious IPs')..."
                   className="flex-1 bg-black/80 backdrop-blur border border-red-900 text-white font-mono p-3 rounded focus:ring-2 focus:ring-red-500 outline-none placeholder-red-900/50 shadow-inner"
                 />
                 <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest px-6 py-3 rounded flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.6)] transition-colors">
                   Execute <Terminal className="w-4 h-4"/>
                 </button>
               </form>
            </div>
          )}

        </main>
      </div>

      {/* Global Auth Settings Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-orange-950 border-2 border-orange-600 rounded-lg max-w-md w-full p-6 shadow-2xl shadow-orange-900/50">
            <div className="flex justify-between items-center mb-6 border-b border-orange-800 pb-2">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500"/>
                Security Protocols
              </h3>
              <button onClick={() => setShowAuthModal(false)} className="text-orange-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-orange-900 rounded bg-black hover:bg-orange-950 transition-colors">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-red-500" 
                  checked={authSettings.require2fa} 
                  onChange={e => setAuthSettings({...authSettings, require2fa: e.target.checked})}
                />
                <div>
                  <div className="text-sm font-bold text-white uppercase">Enforce 2FA System-wide</div>
                  <div className="text-xs text-orange-400">Mandatory hardware key validation</div>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Session Timeout (Hours)</label>
                <input 
                  type="number" 
                  min="1" max="720"
                  className="w-full bg-black border border-orange-600 text-white p-2 rounded focus:ring-2 focus:ring-red-500 outline-none font-mono"
                  value={authSettings.sessionTimeoutHours}
                  onChange={e => setAuthSettings({...authSettings, sessionTimeoutHours: parseInt(e.target.value) || 1})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Password Complexity</label>
                <select 
                  className="w-full bg-black border border-orange-600 text-white p-2 rounded focus:ring-2 focus:ring-red-500 outline-none font-bold uppercase text-sm"
                  value={authSettings.passwordComplexity}
                  onChange={e => setAuthSettings({...authSettings, passwordComplexity: e.target.value})}
                >
                  <option value="low">Standard (8+ chars)</option>
                  <option value="medium">Elevated (12+ chars, special)</option>
                  <option value="high">Maximum (16+ chars, rotation)</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAuthModal(false)} className="px-4 py-2 border border-orange-800 text-orange-300 hover:text-white rounded uppercase text-sm font-bold transition-colors">Cancel</button>
              <button onClick={saveAuthSettings} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded uppercase text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900 transition-colors">
                <Save className="w-4 h-4"/> Enforce Policy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Campaign Modal */}
      {showAdModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-orange-950 border-2 border-red-600 rounded-lg max-w-lg w-full p-6 shadow-2xl shadow-red-900/50">
            <div className="flex justify-between items-center mb-6 border-b border-orange-800 pb-2">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-red-500"/>
                Deploy Advertising Payload
              </h3>
              <button onClick={() => setShowAdModal(false)} className="text-orange-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Target Network (Domain)</label>
                <select 
                  className="w-full bg-black border border-orange-600 text-white p-2 rounded focus:ring-2 focus:ring-red-500 outline-none font-bold text-sm"
                  value={adForm.domain_id}
                  onChange={e => setAdForm({...adForm, domain_id: e.target.value})}
                >
                  <option value="">Select Target...</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Campaign Identifier</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-orange-600 text-white p-2 rounded focus:ring-2 focus:ring-red-500 outline-none font-mono"
                  placeholder="e.g. Q4_PROMO_50"
                  value={adForm.campaign_name}
                  onChange={e => setAdForm({...adForm, campaign_name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Payload Configuration (JSON)</label>
                <textarea 
                  className="w-full bg-black border border-orange-600 text-orange-300 font-mono text-sm p-3 rounded focus:ring-2 focus:ring-red-500 outline-none h-32 resize-y"
                  value={adForm.configStr}
                  onChange={e => setAdForm({...adForm, configStr: e.target.value})}
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 accent-red-500" 
                  checked={adForm.active} 
                  onChange={e => setAdForm({...adForm, active: e.target.checked})}
                />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Activate Immediately</span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAdModal(false)} className="px-4 py-2 border border-orange-800 text-orange-300 hover:text-white rounded uppercase text-sm font-bold transition-colors">Abort</button>
              <button onClick={deployAd} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded uppercase text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900 transition-colors">
                <Plus className="w-4 h-4"/> Execute Deployment
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingAgentVersionsId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-orange-950 border-2 border-orange-600 rounded-xl max-w-4xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6 border-b border-orange-800 pb-2 shrink-0">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500"/>
                Version History Explorer
              </h3>
              <button onClick={() => {
                setViewingAgentVersionsId(null);
                setAgentVersions([]);
              }} className="text-orange-500 hover:text-white transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="overflow-y-auto w-full pr-2 space-y-4 font-mono">
              {agentVersions.length === 0 ? (
                <div className="text-orange-400 text-center py-10 uppercase font-bold text-sm tracking-widest">No previous versions retrieved.</div>
              ) : (
                agentVersions.map(av => (
                  <div key={av.id} className="bg-black border border-orange-800 rounded p-4 relative group">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-white font-bold text-sm uppercase tracking-widest">Version: {new Date(av.created_at).toLocaleString()}</div>
                      <div className="text-orange-500 text-xs">ID: {av.id}</div>
                    </div>
                    <div className="text-xs text-orange-300 font-bold mb-1">Model Architecture:</div>
                    <div className="bg-orange-950/50 p-2 rounded border border-orange-900 text-orange-400 mb-3">{av.model}</div>
                    <div className="text-xs text-orange-300 font-bold mb-1">Core Directives:</div>
                    <div className="bg-orange-950/50 p-2 rounded border border-orange-900 text-orange-400 whitespace-pre-wrap">{av.system_instruction}</div>
                    <div className="mt-4 flex justify-end">
                      <button onClick={async () => {
                        if (window.confirm("Rollback strictly overrides current logic matrix. Proceed?")) {
                          await fetch(`/api/agents/${viewingAgentVersionsId}/versions`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ model: av.model, system_instruction: av.system_instruction })
                          });
                          fetchAgentVersions(viewingAgentVersionsId);
                          fetchAll();
                        }
                      }} className="bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded-sm uppercase tracking-widest text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-[0_0_10px_rgba(234,88,12,0.5)]"><Save className="w-3 h-3"/> Revert Core To This Build</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3 shrink-0">
              <button onClick={() => {
                setViewingAgentVersionsId(null);
                setAgentVersions([]);
              }} className="px-4 py-2 border border-orange-800 text-orange-300 hover:text-white rounded uppercase text-sm font-bold transition-colors">
                Close Explorer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/preview/:domainName" element={<DynamicFrontend />} />
      </Routes>
    </BrowserRouter>
  );
}

