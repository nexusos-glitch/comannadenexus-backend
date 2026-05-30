/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Server, Settings, Layout, Layers, Plus, ExternalLink, 
  Trash2, Edit3, Save, X, Activity, Database, Terminal, ShieldAlert,
  Users, UserX, UserCheck, Megaphone, LineChart, Globe, Lock, ShieldBan, LockKeyhole, Menu, Download, Search, Github, Key, AlertTriangle, TrendingUp, ChevronRight, Sun, Moon
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import cnLogo from './assets/images/command_nexus_logo_1779369627626.png';

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
  const [memberLoggedIn, setMemberLoggedIn] = useState(false);

  const handleGithubLogin = async () => {
    try {
      const response = await fetch('/api/auth/github/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate login.');
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setMemberLoggedIn(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
          {memberLoggedIn ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Access Granted</h3>
              <p className="text-orange-800">You have been successfully authenticated via GitHub. Connection to secure sector established.</p>
              <button onClick={() => setMemberLoggedIn(false)} className="mt-6 uppercase text-xs font-bold tracking-widest text-orange-600 hover:text-orange-800">Sign Out</button>
            </div>
          ) : (
            <>
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

              <div className="my-6 flex items-center">
                <div className="flex-1 border-b border-orange-200"></div>
                <div className="px-3 text-xs font-bold text-orange-400 uppercase tracking-widest">Or Access Via</div>
                <div className="flex-1 border-b border-orange-200"></div>
              </div>

              <button 
                type="button"
                onClick={handleGithubLogin}
                className="w-full bg-white border-2 border-black text-black font-bold uppercase tracking-widest py-4 rounded hover:bg-gray-100 transition-colors flex justify-center items-center gap-3"
              >
                <Github className="w-5 h-5" /> Authenticate via GitHub
              </button>

              <div className="mt-6 text-center text-sm text-orange-800">
                 Security Note: The Command Center currently enforces strict rate-limits on authentication attempts.
              </div>
            </>
          )}
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


function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('nexus_auth', 'true');
        onLogin();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch(err) {
      setError('System unavailable');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="bg-orange-950 border border-orange-800 p-8 rounded-lg shadow-2xl max-w-md w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
        <div className="flex justify-center mb-6 text-orange-500">
           <LockKeyhole className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest text-center mb-6">Nexus OS Login</h2>
        {error && <div className="bg-red-900 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm font-bold uppercase tracking-wide text-center">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
             <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Passcode / Email</label>
             <input type="text" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black border border-orange-700 focus:border-red-500 rounded p-3 text-white font-mono text-sm outline-none" placeholder="nexusos@commandnexus.net" />
          </div>
          <div>
             <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Clearance Code</label>
             <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black border border-orange-700 focus:border-red-500 rounded p-3 text-white font-mono text-sm outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 uppercase tracking-widest rounded mt-4 transition-colors hover:shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            Authorize Access
          </button>
        </form>
      </div>
    </div>
  );
}

// --- ADMIN DASHBOARD ---

function TrendIndicator({ data, activeOnly = false }: { data: any[], activeOnly?: boolean }) {
  const now = Date.now();
  const validData = activeOnly ? data.filter(d => d.active) : data;
  const currentTotal = validData.length;
  
  if (currentTotal === 0) return null;
  
  const previousTotal = validData.filter(d => (now - new Date(d.created_at).getTime()) > 24 * 3600 * 1000).length;
  
  if (previousTotal === 0) {
    return (
      <div className="text-xs mt-3 text-green-400 font-bold tracking-widest bg-green-950/30 inline-block px-2 py-0.5 rounded border border-green-900/50">
        +100.0% (24H)
      </div>
    );
  }
  
  const percentage = ((currentTotal - previousTotal) / previousTotal) * 100;
  
  if (percentage === 0) {
    return (
      <div className="text-xs mt-3 text-orange-400/50 font-bold tracking-widest inline-block px-2 py-0.5">
        0.0% (24H)
      </div>
    );
  }
  
  return (
    <div className={`text-xs mt-3 font-bold tracking-widest inline-block px-2 py-0.5 rounded border ${percentage > 0 ? 'text-green-400 bg-green-950/30 border-green-900/50' : 'text-red-400 bg-red-950/30 border-red-900/50'}`}>
      {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}% (24H)
    </div>
  );
}



function TrafficVolumeAlerts({ alerts }: { alerts: any[] }) {
  const volumeAlerts = alerts.filter(a => a.type === 'Volume Threshold Exceeded');
  
  if (volumeAlerts.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex border-b-2 border-red-800 pb-1 mb-4 items-center gap-2">
        <Activity className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-white uppercase tracking-widest text-red-500">
          Traffic Volume Threshold Triggers
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volumeAlerts.map(alert => (
          <div key={alert.id} className="bg-red-950/20 border border-red-900/50 p-4 rounded-lg shadow-lg shadow-red-900/5 hover:border-red-500/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="text-red-400 font-mono text-sm">{new Date(alert.timestamp).toLocaleString()}</div>
              <span className="bg-red-900 text-red-100 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                Exceeded
              </span>
            </div>
            
            <div className="space-y-3 mt-4 text-sm">
              <div className="flex justify-between border-b border-red-900/30 pb-1">
                <span className="text-red-200/60 uppercase tracking-widest text-xs font-bold">Limit</span>
                <span className="font-mono text-red-200">{alert.threshold || alert.id.split('-')[2] || 'N/A'} req/hr</span>
              </div>
              <div className="flex justify-between border-b border-red-900/30 pb-1">
                <span className="text-red-200/60 uppercase tracking-widest text-xs font-bold">Actual</span>
                <span className="font-mono text-red-500 font-bold">{alert.visitCount || alert.message.match(/reached (\d+) visits/)?.[1] || 'N/A'} req/hr</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const visitesToChart = (visits: any[]) => {
  const buckets: Record<string, number> = {};
  const now = Date.now();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now - i * (7200 * 1000));
    buckets[d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] = 0;
  }
  
  const sortedKeys = Object.keys(buckets);
  visits.forEach(v => {
    const vTime = new Date(v.created_at).getTime();
    let bestKey = sortedKeys[0];
    let minDiff = Infinity;
    sortedKeys.forEach((key, idx) => {
      const d = new Date(now - (11 - idx) * (7200 * 1000)).getTime();
      const diff = Math.abs(d - vTime);
      if (diff < minDiff) {
        minDiff = diff;
        bestKey = key;
      }
    });
    buckets[bestKey] += 1;
  });
  
  return sortedKeys.map(time => ({
    time,
    load: buckets[time],
    agents: Math.floor(buckets[time] * 0.3)
  }));
};

function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('nexus_auth') === 'true');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [theme, setTheme] = useState(() => {
    try {
      const storedTheme = localStorage.getItem('nexus_theme');
      return storedTheme || 'default';
    } catch (error) {
      console.error('Error accessing local storage for theme:', error);
      return 'default';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('nexus_theme', theme);
    } catch (error) {
      console.error('Error saving theme to local storage:', error);
    }
    
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-solarized');
    if (theme === 'high-contrast') {
      root.classList.add('theme-light');
    } else if (theme === 'solarized') {
      root.classList.add('theme-solarized');
    }
  }, [theme]);

  const [showWidgetConfig, setShowWidgetConfig] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState({
    systemsOnline: true,
    accessTokens: true,
    activeCampaigns: true,
    networkStress: true
  });
  
  const [domains, setDomains] = useState<any[]>([]);
  const [components, setComponents] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [ads, setAds] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [trafficSearch, setTrafficSearch] = useState('');
  const [domainSearch, setDomainSearch] = useState('');
  const [alertSearch, setAlertSearch] = useState('');
  const [selectedAlertDetails, setSelectedAlertDetails] = useState<any>(null);
  const [trafficThreshold, setTrafficThreshold] = useState<number>(500);
  
  const [alertsLog, setAlertsLog] = useState<any[]>(() => {
    const saved = localStorage.getItem('nexus_alerts_log');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('nexus_alerts_log', JSON.stringify(alertsLog));
  }, [alertsLog]);

  useEffect(() => {
    if (!visits || visits.length === 0) return;
    
    setAlertsLog(prevLogs => {
      let newAlerts: any[] = [];
      const now = Date.now();
      
      const buckets: Record<string, number> = {};
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now - i * 3600 * 1000);
        buckets[d.toISOString().slice(0, 13)] = 0;
      }
      visits.forEach(v => {
        const k = new Date(v.created_at).toISOString().slice(0, 13);
        if (buckets[k] !== undefined) buckets[k]++;
      });
      
      Object.entries(buckets).forEach(([hour, count]) => {
        if (count > trafficThreshold) {
          const alertId = `vol-${hour}-${trafficThreshold}`;
          if (!prevLogs.some((a: any) => a.id === alertId) && !newAlerts.some(a => a.id === alertId)) {
            newAlerts.push({
              id: alertId,
              timestamp: new Date(hour + ':00:00Z').getTime(),
              type: 'Volume Threshold Exceeded',
              message: `High traffic volume detected. Traffic reached ${count} visits in a single hour.`,
              severity: 'high',
              visitCount: count,
              threshold: trafficThreshold
            });
          }
        }
      });

      const last24 = visits.filter(v => now - new Date(v.created_at).getTime() <= 24 * 3600 * 1000).length;
      const prev24 = visits.filter(v => {
        const diff = now - new Date(v.created_at).getTime();
        return diff > 24 * 3600 * 1000 && diff <= 48 * 3600 * 1000;
      }).length;
      const growthRate = prev24 > 0 ? (last24 - prev24) / prev24 : 0;
      
      if (growthRate > 0.25) {
        const today = new Date().toISOString().slice(0, 10);
        const alertId = `growth-${today}`;
        if (!prevLogs.some((a: any) => a.id === alertId) && !newAlerts.some(a => a.id === alertId)) {
           newAlerts.push({
             id: alertId,
             timestamp: now,
             type: 'Traffic Growth Alert',
             message: `Traffic increased by ${(growthRate * 100).toFixed(1)}% compared to the previous 24 hours (${last24} vs ${prev24} visits).`,
             severity: 'medium'
           });
        }
      }

      if (newAlerts.length > 0) {
        return [...newAlerts, ...prevLogs].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
      }
      return prevLogs;
    });
  }, [visits, trafficThreshold]);

  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);
  const [viewingAgentVersionsId, setViewingAgentVersionsId] = useState<string | null>(null);
  const [agentVersions, setAgentVersions] = useState<any[]>([]);
  const [heatmapLayer, setHeatmapLayer] = useState<'traffic' | 'agents'>('traffic');
  const [heatmapTrafficThreshold, setHeatmapTrafficThreshold] = useState<number>(0);
  const [newAgentForm, setNewAgentForm] = useState({ name: '', model: 'gemini-3.1-pro-preview', instruction: '', role: 'operator', apiKey: '', personality: 'Default' });
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [apiKeyUsage, setApiKeyUsage] = useState<any[]>([]);
  const [selectedApiKeyFilter, setSelectedApiKeyFilter] = useState<string>('all');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDomainId, setNewKeyDomainId] = useState('');
  const [isAddingNewDomain, setIsAddingNewDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [newKeyPrefix, setNewKeyPrefix] = useState('cnx');
  const [newKeyLength, setNewKeyLength] = useState(32);
  const [newKeyParams, setNewKeyParams] = useState({ numbers: true, symbols: false });
  const [newKeyWizardStep, setNewKeyWizardStep] = useState<1 | 2>(1);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  
  // Test Key State
  const [testKeyInput, setTestKeyInput] = useState('');
  const [testKeyResult, setTestKeyResult] = useState<{status: 'idle' | 'loading' | 'success' | 'error', message: string, data?: any}>({ status: 'idle', message: '' });

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void } | null>(null);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      setApiKeys(data);
      
      const usageRes = await fetch('/api/api-keys/usage');
      const usageData = await usageRes.json();
      setApiKeyUsage(usageData);
    } catch (e) {
      console.error('Failed to fetch API keys:', e);
    }
  };

  const fetchAgentVersions = async (id: string) => {
    const res = await fetch(`/api/agents/${id}/versions`);
    const data = await res.json();
    setAgentVersions(data);
  };

  const exportVisitsCSV = () => {
    if (!visits || visits.length === 0) return;
    const headers = ['ID', 'Domain', 'IP Address', 'Country', 'User Agent', 'Referrer', 'Created At'];
    const rows = visits.map(v => [
      v.id,
      v.domain_name || v.domain_id,
      v.ip_address,
      v.country,
      v.user_agent,
      v.referrer,
      new Date(v.created_at).toLocaleString()
    ]);
    
    const escapeCsv = (str: any) => {
      if (str == null) return '';
      const s = String(str);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `server_traffic_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportAlertsCSV = () => {
    if (!alertsLog || alertsLog.length === 0) return;
    
    // Filter alerts to match the current view
    const filteredAlerts = alertsLog.filter(alert => {
      if (!alertSearch) return true;
      const term = alertSearch.toLowerCase();
      return (alert.type || '').toLowerCase().includes(term) ||
             (alert.message || '').toLowerCase().includes(term) ||
             (alert.severity || '').toLowerCase().includes(term);
    });

    if (filteredAlerts.length === 0) return;

    const headers = ['Timestamp', 'Severity', 'Type', 'Message'];
    const rows = filteredAlerts.map(a => [
      new Date(a.timestamp).toLocaleString(),
      (a.severity || '').toUpperCase(),
      a.type || '',
      a.message || ''
    ]);
    
    const escapeCsv = (str: any) => {
      if (str == null) return '';
      const s = String(str);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map(row => row.map(escapeCsv).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `system_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportOverviewReportCSV = () => {
    const lines = [];
    lines.push("=== NEXUS OS - OVERVIEW REPORT ===");
    lines.push(`Generated On: ${new Date().toLocaleString()}`);
    lines.push("");
    
    lines.push("--- KPIS ---");
    lines.push(`Systems Online,${domains.length}`);
    lines.push(`Total Access Tokens,${users.length}`);
    lines.push(`Active Campaigns,${ads.length}`);
    
    const trafficByCountry: Record<string, number> = {};
    const trafficByDomain: Record<string, number> = {};
    visits.forEach(v => {
      if (v.country) {
        let code = v.country.toUpperCase();
        if (code === 'UK') code = 'GB';
        trafficByCountry[code] = (trafficByCountry[code] || 0) + 1;
      }
      const dName = v.domain_name || v.domain_id || 'Unknown';
      trafficByDomain[dName] = (trafficByDomain[dName] || 0) + 1;
    });

    lines.push("");
    lines.push("--- TRAFFIC BY COUNTRY ---");
    lines.push("Country Code,Visits");
    Object.entries(trafficByCountry).sort((a,b)=>b[1]-a[1]).forEach(([country, count]) => {
      lines.push(`${country},${count}`);
    });

    lines.push("");
    lines.push("--- TRAFFIC BY DOMAIN ---");
    lines.push("Domain,Visits");
    Object.entries(trafficByDomain).sort((a,b)=>b[1]-a[1]).forEach(([domain, count]) => {
      lines.push(`${domain},${count}`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nexus_overview_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportOverviewReportJSON = () => {
    const trafficByDomain: Record<string, number> = {};
    visits.forEach(v => {
      const dName = v.domain_name || v.domain_id || 'Unknown';
      trafficByDomain[dName] = (trafficByDomain[dName] || 0) + 1;
    });

    const report = {
      generatedOn: new Date().toISOString(),
      domainStatistics: Object.entries(trafficByDomain).map(([domain, visits]) => ({
        domain,
        visits
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nexus_domain_stats_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };



  const fetchAll = async () => {
    const [dRes, cRes, uRes, mRes, aRes, vRes, agRes] = await Promise.all([
      fetch('/api/domains').then(r => r.json()),
      fetch('/api/components').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
      fetch('/api/ads').then(r => r.json()),
      fetch('/api/visits').then(r => r.json()),
      fetch('/api/agents').then(r => r.json())
    ]);
    setDomains(dRes);
    setComponents(cRes);
    setUsers(uRes);
    setMembers(mRes);
    setAds(aRes);
    setVisits(vRes);
    setAgents(agRes);
    setSelectedAgentId(prev => (!prev && agRes.length > 0) ? agRes[0].id : prev);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAll();
      const intervalId = setInterval(fetchAll, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (visits && visits.length > 0 && activeTab === 'traffic') {
      const buckets: Record<string, number> = {};
      const now = Date.now();
      for (let i = 23; i >= 0; i--) {
        const d = new Date(now - i * 3600 * 1000);
        buckets[d.toISOString().slice(0, 13)] = 0;
      }
      visits.forEach(v => {
        const k = new Date(v.created_at).toISOString().slice(0, 13);
        if (buckets[k] !== undefined) buckets[k]++;
      });
      const hasTrafficSpike = Object.values(buckets).some(v => v >= trafficThreshold);
      if (hasTrafficSpike) {
        console.warn(`[SERVER_TRAFFIC_ALERT] High traffic volume detected (${trafficThreshold}+ visits per hour). Action recommended.`);
        if (typeof window !== 'undefined' && !window.sessionStorage.getItem(`trafficAlertAck_${trafficThreshold}`)) {
          alert(`SYSTEM ALERT: High traffic volume detected (>${trafficThreshold} visits per hour). Potential bot activity or DDoS. Please review firewall settings.`);
          window.sessionStorage.setItem(`trafficAlertAck_${trafficThreshold}`, 'true');
        }
      }
    }
  }, [visits, activeTab, trafficThreshold]);

  if (!isLoggedIn) {
     return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

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
    if (isLoggedIn) {
      const sse = new EventSource('/api/logs/stream');
      sse.onmessage = (e) => {
        const log = JSON.parse(e.data);
        setLogs(prev => [...prev, log].slice(-100)); // Keep last 100
        
        if (log.type === 'visit_created') {
           setVisits(prev => [log.data, ...prev].slice(0, 500));
        } else if (log.type === 'api_key_used') {
           setApiKeyUsage(prev => {
              const date = log.data.usage_date;
              const existing = prev.find(p => p.name === log.data.name && p.usage_date === date);
              if (existing) {
                 return prev.map(p => p === existing ? { ...p, calls: p.calls + 1 } : p);
              } else {
                 return [...prev, log.data];
              }
           });
        }
      };
      return () => sse.close();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === 'apikeys') {
      fetchApiKeys();
      const handleRefresh = () => fetchApiKeys();
      window.addEventListener('apikey_generated', handleRefresh);
      return () => {
        window.removeEventListener('apikey_generated', handleRefresh);
      };
    }
  }, [activeTab]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const navItems = [
    { id: 'overview', icon: Server, label: 'Overview' },
    { id: 'members', icon: Users, label: 'Member Access' },
    { id: 'ads', icon: Megaphone, label: 'Advertising' },
    { id: 'traffic', icon: LineChart, label: 'Server Traffic' },
    { id: 'alerts', icon: ShieldAlert, label: 'Alerts Log' },
    { id: 'config', icon: Layers, label: 'Interface Config' },
    { id: 'sql', icon: Database, label: 'SQL Engine' },
    { id: 'logs', icon: Terminal, label: 'System Events' },
    { id: 'agents_management', icon: Settings, label: 'Agents Matrix' },
    { id: 'apikeys', icon: Key, label: 'API Access' },
    { id: 'agent', icon: ShieldAlert, label: 'AI Operations Agent', isRed: true }
  ];

  console.log("NAV_ITEMS_DEBUG:", navItems);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-black text-white font-sans selection:bg-orange-500 selection:text-white pb-16 md:pb-0">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex">
          <div className="w-64 bg-orange-950 border-r border-orange-900 flex flex-col h-full relative">
              <div className="p-4 border-b border-orange-900 font-bold flex items-center justify-between tracking-widest text-orange-500">
                <div className="flex items-center gap-2">
                  <img src={cnLogo} alt="Logo" className="w-6 h-6 rounded-sm" />
                  CMD_CTRL
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-orange-500"><X className="w-6 h-6"/></button>
              </div>
             <div className="flex-1 overflow-y-auto py-4">
               <nav className="space-y-1 px-2">
                 {navItems.map(item => (
                   <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === item.id ? (item.isRed ? "bg-red-600 border-red-500 text-white font-bold shadow-lg shadow-red-900/50" : "bg-orange-600 text-white font-bold") : (item.isRed ? "text-red-400 border border-red-900 hover:bg-red-900 hover:text-white mt-4" : "text-orange-200 hover:bg-orange-900 hover:text-white"))}> 
                     <item.icon className="w-4 h-4" /> {item.label}
                   </button>
                 ))}
               </nav>
             </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)}></div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-orange-950 border-r border-orange-900 flex-col shrink-0">
        <div className="p-4 border-b border-orange-900 font-bold flex items-center gap-2 tracking-widest text-orange-500">
          <img src={cnLogo} alt="Logo" className="w-6 h-6 rounded-sm" />
          CMD_CTRL
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={cn("w-full flex items-center gap-2 px-4 py-2 rounded-md transition-colors", activeTab === item.id ? (item.isRed ? "bg-red-600 border-red-500 text-white font-bold shadow-lg shadow-red-900/50" : "bg-orange-600 text-white font-bold") : (item.isRed ? "text-red-400 border border-red-900 hover:bg-red-900 hover:text-white mt-4" : "text-orange-200 hover:bg-orange-900 hover:text-white"))}> 
                <item.icon className="w-4 h-4" /> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="border-b border-orange-900 px-4 md:px-6 py-4 flex items-center justify-between bg-black shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-orange-500 hover:text-white" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-orange-500 uppercase tracking-wider hidden sm:block">
              {navItems.find(i => i.id === activeTab)?.label || 'System Overview'}
            </h1>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <button
              onClick={() => setTheme(theme === 'high-contrast' ? 'default' : 'high-contrast')}
              className="text-orange-500 hover:text-white transition-colors"
              title="Toggle Theme"
            >
              {theme === 'high-contrast' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-xs md:text-sm text-red-500 font-mono animate-pulse font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> <span className="hidden sm:inline">CONNECTION SECURE</span>
            </div>
            <button onClick={() => {
              localStorage.removeItem('nexus_auth');
              setIsLoggedIn(false);
            }} className="text-orange-500 hover:text-white uppercase tracking-widest text-xs font-bold border border-orange-800 px-2 md:px-3 py-1 rounded transition-colors whitespace-nowrap">
              Disconnect
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 pb-6">
          
          {(() => {
            if (!visits || visits.length === 0) return null;
            const now = Date.now();
            const last24 = visits.filter(v => now - new Date(v.created_at).getTime() <= 24 * 3600 * 1000).length;
            const prev24 = visits.filter(v => {
              const diff = now - new Date(v.created_at).getTime();
              return diff > 24 * 3600 * 1000 && diff <= 48 * 3600 * 1000;
            }).length;
            const growthRate = prev24 > 0 ? (last24 - prev24) / prev24 : 0;
            
            if (growthRate > 0.25) {
              return (
                <div className="mb-6 bg-red-950/80 border border-red-500 p-4 rounded-lg flex items-start gap-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] duration-1000 animate-in slide-in-from-top-4">
                  <Activity className="w-6 h-6 text-red-500 mt-0.5 shrink-0 animate-pulse" />
                  <div>
                    <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-1">Traffic Growth Alert</h3>
                    <p className="text-red-200 text-sm">
                      Traffic has increased by <strong className="text-white font-mono">{(growthRate * 100).toFixed(1)}%</strong> compared to the previous 24 hours. 
                      ({last24} visits vs {prev24} visits). Immediate review recommended.
                    </p>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
               {/* TOP KPIS GRID CONTROLS */}
               <div className="flex justify-between items-end mb-2">
                 <h2 className="text-xl font-bold text-white uppercase tracking-widest text-orange-500">Dashboard Overview</h2>
                 <div className="flex items-center gap-4">
                   <button
                     onClick={exportOverviewReportJSON}
                     className="flex items-center gap-2 bg-orange-950 border border-orange-800 hover:bg-orange-900 text-orange-400 hover:text-white px-3 py-1.5 rounded uppercase text-xs font-bold transition-colors"
                   >
                     <Download className="w-4 h-4" /> Download Report
                   </button>
                   <button
                     onClick={exportOverviewReportCSV}
                     className="flex items-center gap-2 bg-orange-950 border border-orange-800 hover:bg-orange-900 text-orange-400 hover:text-white px-3 py-1.5 rounded uppercase text-xs font-bold transition-colors"
                     title="Export CSV"
                   >
                     <Download className="w-4 h-4" /> CSV
                   </button>
                   <div className="relative">
                     <button 
                       onClick={() => setShowWidgetConfig(!showWidgetConfig)}
                       className="flex items-center gap-2 bg-orange-950 border border-orange-800 hover:bg-orange-900 text-orange-400 hover:text-white px-3 py-1.5 rounded uppercase text-xs font-bold transition-colors"
                     >
                       <Layout className="w-4 h-4" /> Widgets
                     </button>
                     {showWidgetConfig && (
                       <div className="absolute right-0 top-full mt-2 w-64 bg-black border border-orange-800 rounded-lg shadow-xl z-50 p-4">
                         <h3 className="text-orange-500 font-bold uppercase text-xs tracking-widest mb-3 border-b border-orange-900 pb-1">Widget Config</h3>
                         <div className="space-y-3">
                           <label className="flex items-center gap-3 text-orange-200 text-sm cursor-pointer hover:text-white transition-colors">
                             <input type="checkbox" className="accent-orange-500 rounded bg-orange-950 border-orange-800" checked={widgetConfig.systemsOnline} onChange={e => setWidgetConfig(prev => ({ ...prev, systemsOnline: e.target.checked }))} />
                             Systems Online
                           </label>
                           <label className="flex items-center gap-3 text-orange-200 text-sm cursor-pointer hover:text-white transition-colors">
                             <input type="checkbox" className="accent-orange-500 rounded bg-orange-950 border-orange-800" checked={widgetConfig.accessTokens} onChange={e => setWidgetConfig(prev => ({ ...prev, accessTokens: e.target.checked }))} />
                             Total Access Tokens
                           </label>
                           <label className="flex items-center gap-3 text-orange-200 text-sm cursor-pointer hover:text-white transition-colors">
                             <input type="checkbox" className="accent-orange-500 rounded bg-orange-950 border-orange-800" checked={widgetConfig.activeCampaigns} onChange={e => setWidgetConfig(prev => ({ ...prev, activeCampaigns: e.target.checked }))} />
                             Active Campaigns
                           </label>
                           <label className="flex items-center gap-3 text-orange-200 text-sm cursor-pointer hover:text-white transition-colors">
                             <input type="checkbox" className="accent-orange-500 rounded bg-orange-950 border-orange-800" checked={widgetConfig.networkStress} onChange={e => setWidgetConfig(prev => ({ ...prev, networkStress: e.target.checked }))} />
                             Network Stress
                           </label>
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
               
               {/* TOP KPIS */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {widgetConfig.systemsOnline && (
                   <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                     <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Systems Online</div>
                     <div className="text-4xl text-white font-mono">{domains.length}</div>
                     <TrendIndicator data={domains} />
                   </div>
                 )}
                 {widgetConfig.accessTokens && (
                   <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                     <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Total Access Tokens</div>
                     <div className="text-4xl text-white font-mono">{users.length}</div>
                     <TrendIndicator data={users} />
                   </div>
                 )}
                 {widgetConfig.activeCampaigns && (
                   <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                     <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Active Campaigns</div>
                     <div className="text-4xl text-white font-mono">{ads.filter(a => a.active).length}</div>
                     <TrendIndicator data={ads} activeOnly={true} />
                   </div>
                 )}
                 {widgetConfig.networkStress && (
                   <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg text-center shadow-lg shadow-orange-900/20">
                     <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-2">Network Stress</div>
                     <div className="text-4xl text-red-500 font-mono animate-pulse">{(visits.length * 2.4).toFixed(1)}%</div>
                     <TrendIndicator data={visits} />
                   </div>
                 )}
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
                     <AreaChart data={visitesToChart(visits)}>
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


               <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg shadow-lg shadow-orange-900/20">
                 <div className="flex justify-between items-center mb-6 border-b-2 border-orange-600 pb-1">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                     <Globe className="w-5 h-5"/>
                     Domain Traffic Overview
                   </h2>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                     <thead>
                       <tr>
                         <th className="px-4 py-2 border-b border-orange-800 text-orange-400 font-bold uppercase text-xs">Domain</th>
                         <th className="px-4 py-2 border-b border-orange-800 text-orange-400 font-bold uppercase text-xs">Total Visits</th>
                         <th className="px-4 py-2 border-b border-orange-800 text-orange-400 font-bold uppercase text-xs">Top Referrers</th>
                       </tr>
                     </thead>
                     <tbody>
                       {(() => {
                         const breakdown: Record<string, { visits: number, referrers: Record<string, number> }> = {};
                         domains.forEach(d => { breakdown[d.name] = { visits: 0, referrers: {} }; });
                         
                         visits.forEach(v => {
                           const name = v.domain_name || v.domain_id || 'Unknown';
                           if (!breakdown[name]) breakdown[name] = { visits: 0, referrers: {} };
                           breakdown[name].visits++;
                           if (v.referrer) {
                             breakdown[name].referrers[v.referrer] = (breakdown[name].referrers[v.referrer] || 0) + 1;
                           }
                         });

                         const sorted = Object.entries(breakdown).sort((a, b) => b[1].visits - a[1].visits);
                         if (sorted.length === 0) {
                           return <tr><td colSpan={3} className="px-4 py-4 text-center text-orange-600 text-sm italic">No traffic recorded</td></tr>;
                         }
                         return sorted.map(([domain, data]) => {
                           const topRef = Object.entries(data.referrers)
                             .sort((a, b) => b[1] - a[1])
                             .slice(0, 3)
                             .map(e => `${e[0]} (${e[1]})`)
                             .join(', ');
                           return (
                             <tr key={domain} className="hover:bg-orange-900/30 transition-colors">
                               <td className="px-4 py-3 border-b border-orange-900/50 text-white font-medium">{domain}</td>
                               <td className="px-4 py-3 border-b border-orange-900/50 text-orange-300 font-mono text-sm">{data.visits}</td>
                               <td className="px-4 py-3 border-b border-orange-900/50 text-gray-400 text-sm truncate max-w-xs" title={topRef}>{topRef || 'Direct / None'}</td>
                             </tr>
                           );
                         });
                       })()}
                     </tbody>
                   </table>
                 </div>
               </div>

               <div className="bg-orange-950 border border-orange-800 p-6 rounded-lg shadow-lg shadow-orange-900/20 mb-8 mt-8">
                 <div className="flex justify-between items-center mb-6 border-b-2 border-orange-600 pb-1">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                     <Settings className="w-5 h-5"/>
                     System Preferences
                   </h2>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-orange-900 p-4 rounded bg-black shadow-[0_0_15px_rgba(234,88,12,0.1)]">
                       <h3 className="text-orange-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                         <Layers className="w-4 h-4" /> Global Theme Engine
                       </h3>
                       <p className="text-orange-800 text-xs mb-4 leading-tight">Set the core visual layout for the CMD_CTRL operating matrix. Settings persist across active sessions.</p>
                       <div className="space-y-3">
                         <button
                           onClick={() => setTheme('default')}
                           className={cn("w-full text-left px-4 py-2 text-sm font-bold uppercase rounded border transition-colors flex items-center justify-between", theme === 'default' ? "bg-orange-600 text-white border-orange-500" : "bg-black text-orange-500 border-orange-900 hover:bg-orange-950")}
                         >
                           <span>Dark Terminal (Default)</span>
                           {theme === 'default' && <span className="w-2 h-2 bg-white rounded-full"></span>}
                         </button>
                         <button
                           onClick={() => setTheme('solarized')}
                           className={cn("w-full text-left px-4 py-2 text-sm font-bold uppercase rounded border transition-colors flex items-center justify-between", theme === 'solarized' ? "bg-orange-600 text-white border-orange-500" : "bg-black text-orange-500 border-orange-900 hover:bg-orange-950")}
                         >
                           <span>Solarized Matrix</span>
                           {theme === 'solarized' && <span className="w-2 h-2 bg-white rounded-full"></span>}
                         </button>
                         <button
                           onClick={() => setTheme('high-contrast')}
                           className={cn("w-full text-left px-4 py-2 text-sm font-bold uppercase rounded border transition-colors flex items-center justify-between", theme === 'high-contrast' ? "bg-orange-600 text-white border-orange-500" : "bg-black text-orange-500 border-orange-900 hover:bg-orange-950")}
                         >
                           <span>High Contrast Light</span>
                           {theme === 'high-contrast' && <span className="w-2 h-2 bg-white rounded-full"></span>}
                         </button>
                       </div>
                    </div>
                 </div>
               </div>

               <div>
                 <div className="flex justify-between items-center mb-4 border-b-2 border-orange-600 pb-1">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                     <LineChart className="w-5 h-5"/>
                     Traffic Sources Breakdown
                   </h2>
                 </div>
                 {(() => {
                   const breakdown: Record<string, { visits: number, referrers: Record<string, number> }> = {};
                   domains.forEach(d => { breakdown[d.name] = { visits: 0, referrers: {} }; });
                   
                   visits.forEach(v => {
                     const name = v.domain_name || v.domain_id || 'Unknown';
                     if (!breakdown[name]) breakdown[name] = { visits: 0, referrers: {} };
                     breakdown[name].visits++;
                     if (v.referrer) {
                       breakdown[name].referrers[v.referrer] = (breakdown[name].referrers[v.referrer] || 0) + 1;
                     }
                   });

                   return (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                       {Object.entries(breakdown).map(([domain, data]) => {
                          const sources = {
                            'Direct': 0,
                            'Organic Search': 0,
                            'Social': 0,
                            'Referral': 0
                          };
                          let totalReferrerAttributed = 0;
                          Object.entries(data.referrers).forEach(([ref, count]) => {
                            const lRef = ref.toLowerCase();
                            if (!lRef || lRef === '' || lRef === 'direct') {
                               sources['Direct'] += count;
                            } else if (lRef.includes('google') || lRef.includes('bing') || lRef.includes('yahoo')) {
                               sources['Organic Search'] += count;
                            } else if (lRef.includes('facebook') || lRef.includes('t.co') || lRef.includes('twitter') || lRef.includes('linkedin') || lRef.includes('instagram')) {
                               sources['Social'] += count;
                            } else {
                               sources['Referral'] += count;
                            }
                            totalReferrerAttributed += count;
                          });
                          sources['Direct'] += data.visits - totalReferrerAttributed;

                          const pieData = Object.entries(sources).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
                          const COLORS = ['#ea580c', '#3b82f6', '#8b5cf6', '#10b981']; 
                          
                          return (
                            <div key={domain} className="bg-orange-950 border border-orange-800 p-4 rounded-lg shadow-lg flex flex-col justify-between">
                              <h3 className="font-bold text-white text-sm mb-2 uppercase tracking-widest border-b border-orange-800 pb-1 truncate" title={domain}>{domain}</h3>
                              <div className="h-48 w-full mt-2">
                                {pieData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                        {pieData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ backgroundColor: '#000', border: '1px solid #7c2d12', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'monospace' }} itemStyle={{ color: '#f97316' }} />
                                      <Legend wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase' }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="flex items-center justify-center h-full text-orange-600/50 text-xs font-mono uppercase tracking-widest">No Traffic Data</div>
                                )}
                              </div>
                            </div>
                          );
                       })}
                     </div>
                   );
                 })()}
               </div>

               <div>
                 <div className="flex justify-between items-center mb-4 border-b-2 border-orange-600 pb-1">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                     <Globe className="w-5 h-5"/>
                     Global Traffic Heatmap
                   </h2>
                   <div className="flex justify-end items-center gap-2">
                     {heatmapLayer === 'traffic' && (
                       <div className="flex items-center gap-2 mr-2">
                         <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Intensity Threshold:</span>
                         <input 
                           type="range" 
                           min="0" 
                           max="50" 
                           value={heatmapTrafficThreshold} 
                           onChange={e => setHeatmapTrafficThreshold(parseInt(e.target.value))}
                           className="w-20 accent-orange-600"
                         />
                         <span className="text-xs text-white font-mono w-4 text-right">{heatmapTrafficThreshold}</span>
                       </div>
                     )}
                     <button 
                       onClick={() => { setHeatmapLayer('traffic'); setHeatmapTrafficThreshold(0); }}
                       className={`text-[10px] px-2 py-1 font-bold rounded uppercase tracking-widest border transition-colors ${heatmapLayer === 'traffic' ? 'bg-orange-600 border-orange-600 text-white shadow-[0_0_10px_rgba(234,88,12,0.5)]' : 'border-orange-600/50 text-orange-400 hover:bg-orange-900/50'}`}
                     >
                       Traffic Density
                     </button>
                     <button 
                       onClick={() => setHeatmapLayer('agents')}
                       className={`text-[10px] px-2 py-1 font-bold rounded uppercase tracking-widest border transition-colors ${heatmapLayer === 'agents' ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'border-blue-600/50 text-blue-400 hover:bg-blue-900/50'}`}
                     >
                       Agent Coverage
                     </button>
                   </div>
                 </div>
                 {(() => {
                   const dataByCountry: Record<string, number> = {};
                   
                   if (heatmapLayer === 'traffic') {
                     visits.forEach(v => {
                       if (!v.country) return;
                       let code = v.country.toUpperCase();
                       if (code === 'UK') code = 'GB';
                       dataByCountry[code] = (dataByCountry[code] || 0) + 1;
                     });
                   } else {
                     dataByCountry['US'] = 145;
                     dataByCountry['GB'] = 82;
                     dataByCountry['AU'] = 54;
                     dataByCountry['CA'] = 31;
                     dataByCountry['DE'] = 12;
                     dataByCountry['IN'] = 8;
                     dataByCountry['FR'] = 5;
                   }
                   
                   const maxVal = Math.max(1, ...Object.values(dataByCountry));
                   const colorScale = heatmapLayer === 'traffic' 
                     ? scaleLinear<string>().domain([0, maxVal]).range(["#ffedd5", "#ea580c"])
                     : scaleLinear<string>().domain([0, maxVal]).range(["#dbeafe", "#2563eb"]);

                   const strokeColor = heatmapLayer === 'traffic' ? "#ea580c" : "#2563eb";
                   const hoverColor = heatmapLayer === 'traffic' ? "#f97316" : "#3b82f6";
                   const pressedColor = heatmapLayer === 'traffic' ? "#c2410c" : "#1d4ed8";
                   const emptyFill = heatmapLayer === 'traffic' ? "#1a0800" : "#0f172a";
                   const tooltipBg = heatmapLayer === 'traffic' ? "#ea580c" : "#2563eb";

                   const nameToIso: Record<string, string> = {
                     'United States of America': 'US',
                     'United Kingdom': 'GB',
                     'Japan': 'JP',
                     'Canada': 'CA',
                     'Germany': 'DE',
                     'France': 'FR',
                     'India': 'IN',
                     'Australia': 'AU',
                     'Brazil': 'BR',
                     'China': 'CN',
                     'Russia': 'RU'
                   };

                   return (
                     <div className={`border p-4 rounded shadow-lg mb-8 ${heatmapLayer === 'traffic' ? 'bg-orange-950/40 border-orange-900' : 'bg-blue-950/40 border-blue-900'}`}>
                       <div className="h-[400px] w-full flex items-center justify-center relative">
                         <ComposableMap 
                           projection="geoMercator" 
                           projectionConfig={{ scale: 120 }}
                           style={{ width: "100%", height: "100%" }}
                         >
                           <Sphere stroke={strokeColor} strokeWidth={0.5} id="sphere" fill="transparent" />
                           <Graticule stroke={strokeColor} strokeWidth={0.2} strokeOpacity={0.5} />
                           <Geographies geography="https://unpkg.com/world-atlas@2.0.2/countries-110m.json">
                             {({ geographies }) =>
                               geographies.map((geo) => {
                                 const countryName = geo.properties.name;
                                 const isoCode = nameToIso[countryName] || geo.id; 
                                 let value = dataByCountry[isoCode as string] || dataByCountry[countryName] || 0;
                                 if (heatmapLayer === 'traffic' && value < heatmapTrafficThreshold) {
                                   value = 0;
                                 }
                                 return (
                                   <Geography
                                     key={geo.rsmKey}
                                     geography={geo}
                                     fill={value ? colorScale(value) : emptyFill}
                                     stroke={strokeColor}
                                     strokeWidth={0.2}
                                     data-tooltip-id="global-traffic-tooltip"
                                     data-tooltip-content={`${countryName}: ${value} ${heatmapLayer === 'traffic' ? 'visits' : 'agents'}`}
                                     style={{
                                       default: { outline: "none", transition: "all 250ms" },
                                       hover: { fill: hoverColor, outline: "none", cursor: "pointer", strokeWidth: 0.5 },
                                       pressed: { fill: pressedColor, outline: "none" },
                                     }}
                                   />
                                 );
                               })
                             }
                           </Geographies>
                         </ComposableMap>
                         <ReactTooltip 
                           id="global-traffic-tooltip" 
                           style={{ backgroundColor: tooltipBg, color: '#fff', fontWeight: 'bold' }} 
                         />
                         <div className={`absolute bottom-4 left-4 p-3 rounded shadow-lg flex flex-col gap-1 text-xs text-white border backdrop-blur-sm ${heatmapLayer === 'traffic' ? 'bg-orange-950/80 border-orange-900' : 'bg-blue-950/80 border-blue-900'}`}>
                           <div className="font-bold opacity-80 uppercase tracking-widest">{heatmapLayer === 'traffic' ? 'Traffic Density' : 'Agent Coverage'}</div>
                           <div className="flex items-center gap-3 mt-1 text-[10px] font-mono">
                              <span className="opacity-60 text-right w-4">0</span>
                              <div className="w-32 h-2 rounded-full" style={{ background: heatmapLayer === 'traffic' ? 'linear-gradient(to right, #ffedd5, #ea580c)' : 'linear-gradient(to right, #dbeafe, #2563eb)' }}></div>
                              <span className="opacity-60">{maxVal}</span>
                           </div>
                         </div>
                       </div>
                     </div>
                   );
                 })()}
               </div>

               <div>
                 <div className="flex justify-between items-center mb-4 border-b-2 border-orange-600 pb-1">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                     <Server className="w-5 h-5"/>
                     Active Domain Controllers ({domains.length})
                   </h2>
                   <div className="flex items-center gap-3">
                     <div className="relative hidden md:block">
                       <input 
                         type="text" 
                         value={domainSearch} 
                         onChange={e => setDomainSearch(e.target.value)} 
                         placeholder="Filter Domains..." 
                         className="bg-black border border-orange-800 text-orange-200 px-3 py-1 pl-8 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors w-48 lg:w-64 focus:ring-1 focus:ring-orange-500 font-mono"
                       />
                       <Search className="w-4 h-4 text-orange-800 absolute left-2.5 top-1.5" />
                     </div>
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
                 </div>
                 <div className="md:hidden relative mb-4">
                   <input 
                     type="text" 
                     value={domainSearch} 
                     onChange={e => setDomainSearch(e.target.value)} 
                     placeholder="Filter Domains..." 
                     className="bg-black border border-orange-800 text-orange-200 px-3 py-2 pl-8 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors w-full focus:ring-1 focus:ring-orange-500 font-mono"
                   />
                   <Search className="w-4 h-4 text-orange-800 absolute left-2.5 top-2.5" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {domains.filter(d => 
                     d.name.toLowerCase().includes(domainSearch.toLowerCase()) || 
                     (d.description && d.description.toLowerCase().includes(domainSearch.toLowerCase()))
                   ).map(d => (
                     <div key={d.id} className="bg-orange-950 border border-orange-800 p-6 rounded-lg hover:border-orange-500 transition-colors shadow-lg shadow-orange-900/20 flex flex-col md:flex-row justify-between items-start xl:items-center gap-4">
                       <div>
                         <div className="font-bold text-xl text-white mb-1">{d.name}</div>
                       <div className="text-sm text-orange-300 mb-4">{d.description}</div>
                       <Link to={`/preview/${d.name}`} className="inline-flex items-center gap-2 text-sm bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded font-bold text-white transition">
                         <ExternalLink className="w-4 h-4"/> Connect Tunnel
                        </Link>
                      </div>
                      <div className="bg-white p-2 rounded shrink-0 shadow-inner">
                        <QRCodeSVG value={`${window.location.origin}/preview/${d.name}`} size={80} level="M" />
                      </div>
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
            <div className="animate-in fade-in duration-300 space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1">Access Control & System Administrators</h2>
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

              <div>
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 border-b-2 border-orange-600 pb-1 flex items-center gap-2">
                     <Users className="w-5 h-5"/>
                     Harvested Neural Leads
                   </h2>
                   <div className="bg-orange-950 px-3 py-1 text-orange-400 text-xs font-mono rounded border border-orange-800">
                     Total Leads: {members.length}
                   </div>
                </div>
                <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900">
                  <table className="min-w-full divide-y divide-orange-900">
                    <thead className="bg-orange-950">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Email / Source</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Intent Score</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Campaign / Agent</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Last Activity</th>
                        <th className="px-6 py-3 text-right text-xs font-bold text-orange-200 uppercase tracking-widest">Network Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-orange-900 text-sm">
                      {members.map(m => (
                        <tr key={m.id} className="hover:bg-orange-950/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-bold text-white">{m.email}</div>
                            <div className="text-orange-500 text-xs font-mono uppercase tracking-widest">Source: {m.source}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={cn("px-3 py-1 inline-flex text-xs leading-5 font-bold uppercase rounded-none border border-orange-800", m.intent_score > 80 ? "bg-red-900/30 text-red-500 border-red-500" : "bg-black text-orange-500")}>
                              {m.intent_score}% 
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-orange-400 font-mono text-xs">{m.campaign_id || 'Organic'}</div>
                            <div className="text-gray-500 text-xs max-w-[150px] truncate" title={m.user_agent}>{m.user_agent || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-orange-400 font-mono text-xs">
                              {new Date(m.last_seen || m.created_at).toLocaleString()}
                            </div>
                            <div className="text-orange-600 font-mono text-[10px]">
                              Created: {new Date(m.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono text-orange-300">
                            {m.ip_address || 'Proxy / Hidden'}
                          </td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-orange-600 font-bold uppercase tracking-widest">
                            No neural leads harvested yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                 <div className="flex items-center gap-4">
                   <button 
                     onClick={exportVisitsCSV}
                     className="flex items-center gap-2 bg-orange-950 border border-orange-800 hover:bg-orange-900 text-orange-400 hover:text-white px-3 py-1.5 rounded uppercase text-xs font-bold transition-colors"
                     title="Export CSV"
                   >
                     <Download className="w-4 h-4" /> Export CSV
                   </button>
                   <div className="flex items-center gap-2 text-sm text-green-500 font-bold uppercase animate-pulse">
                     <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Sentinel Active
                   </div>
                 </div>
               </div>
               
              {(() => {
                const buckets: Record<string, number> = {};
                const now = Date.now();
                for (let i = 24; i >= 0; i--) {
                  const d = new Date(now - i * 3600 * 1000);
                  buckets[d.toISOString().slice(0, 13)] = 0;
                }
                visits.forEach(v => {
                  const k = new Date(v.created_at).toISOString().slice(0, 13);
                  if (buckets[k] !== undefined) buckets[k]++;
                });
                const sortedKeys = Object.keys(buckets).sort();
                const sparklineData = sortedKeys.slice(1).map((k, index) => ({
                  time: new Date(k + ':00:00Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  visits: buckets[k],
                  prev_visits: buckets[sortedKeys[index]]
                }));
                const hasTrafficSpike = Object.values(buckets).some(v => v > trafficThreshold);

                return (
                  <div className="space-y-6">
                    <div className="bg-orange-950/30 border border-orange-900 rounded-lg p-4 flex items-center justify-between">
                       <label className="text-orange-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                         <Activity className="w-4 h-4"/> Alert Threshold ({trafficThreshold} visits/hr)
                       </label>
                       <input 
                         type="range" 
                         min="10" 
                         max="2000" 
                         step="10" 
                         value={trafficThreshold} 
                         onChange={e => setTrafficThreshold(Number(e.target.value))} 
                         className="w-48 accent-orange-500"
                       />
                    </div>
                    {hasTrafficSpike && (
                      <div className="bg-red-950/80 border border-red-500 p-4 rounded-lg flex items-start gap-4 shadow-[0_0_15px_rgba(239,68,68,0.3)] duration-1000">
                        <ShieldAlert className="w-6 h-6 text-red-500 mt-0.5 shrink-0 animate-pulse" />
                        <div>
                          <h3 className="text-red-400 font-bold uppercase tracking-widest text-sm mb-1">High Traffic Alert Threshold Exceeded</h3>
                          <p className="text-red-200 text-sm">Traffic volume has exceeded {trafficThreshold} visits/hour in recent intervals. Unusually high request density detected.</p>
                        </div>
                      </div>
                    )}
                    <div className="bg-orange-950/50 border border-orange-900 overflow-hidden rounded-lg p-4">
                      <div className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-4 flex items-center justify-between">
                        <span>24H Traffic Volume (Visits)</span>
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Current</span>
                          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-800"></span> Previous Hour</span>
                          <span className="text-orange-600 ml-2">SPARKLINE_SYS</span>
                        </div>
                      </div>
                      <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.5}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorPrevVisits" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9a3412" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#9a3412" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#4a1a08" vertical={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #7c2d12', borderRadius: '4px', textTransform: 'uppercase', fontFamily: 'monospace' }}
                            itemStyle={{ color: '#f97316' }}
                            labelStyle={{ color: '#fdba74', marginBottom: '8px' }}
                            cursor={{ stroke: '#f97316', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Area type="monotone" name="Previous Hour" dataKey="prev_visits" stroke="#9a3412" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorPrevVisits)" />
                          <Area type="monotone" name="Current" dataKey="visits" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorVisits)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  </div>
                );
              })()}

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
                    <BarChart data={(() => {
                      const origins: Record<string, number> = {};
                      visits.forEach(v => {
                        const code = v.country ? v.country.toUpperCase() : 'UNKNOWN';
                        origins[code] = (origins[code] || 0) + 1;
                      });
                      const data = Object.entries(origins).map(([region, requests]) => ({ region, requests })).sort((a,b) => b.requests - a.requests).slice(0, 7);
                      if (data.length === 0) return [{ region: 'No Data', requests: 0 }];
                      return data;
                    })()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#9a3412" vertical={false} />
                      <XAxis dataKey="region" stroke="#fdba74" tick={{ fill: '#fdba74', fontSize: 12 }} />
                      <YAxis stroke="#fdba74" tick={{ fill: '#fdba74', fontSize: 12 }} />
                      <Tooltip cursor={{ fill: '#431407' }} contentStyle={{ backgroundColor: '#000', borderColor: '#ea580c', color: '#fff' }} />
                      <Bar dataKey="requests" fill="#ea580c" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4 bg-orange-950/50 border border-orange-900 p-2 rounded-lg">
                <Search className="w-5 h-5 text-orange-500 ml-2" />
                <input
                  type="text"
                  placeholder="Filter traffic log by IP, country, or referrer..."
                  className="w-full bg-transparent border-none outline-none text-white placeholder-orange-700/70 font-mono text-sm px-2"
                  value={trafficSearch}
                  onChange={(e) => setTrafficSearch(e.target.value)}
                />
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
                    {(() => {
                      const filteredVisits = visits.filter(v => {
                        if (!trafficSearch) return true;
                        const term = trafficSearch.toLowerCase();
                        return (v.ip_address || '').toLowerCase().includes(term) ||
                               (v.country || '').toLowerCase().includes(term) ||
                               (v.referrer || '').toLowerCase().includes(term);
                      });

                      return (
                        <>
                          {filteredVisits.map(v => {
                            const ua = (v.user_agent || '').toLowerCase();
                            const ref = (v.referrer || '').toLowerCase();
                            const botKeywords = ['bot', 'crawler', 'spider', 'wget', 'curl', 'postman', 'python', 'go-http-client'];
                            const suspiciousRefs = ['auto', 'seo', 'spam', 'tracker', 'scam'];
                            const isSuspicious = botKeywords.some(kw => ua.includes(kw)) || suspiciousRefs.some(kw => ref.includes(kw));

                            return (
                              <tr key={v.id} className={cn("transition-colors", isSuspicious ? "bg-red-950/20 hover:bg-red-950/40 border-l-2 border-red-500" : "hover:bg-orange-950/30")}>
                                <td className="px-6 py-4 whitespace-nowrap text-orange-500 font-mono text-xs">
                                  {isSuspicious && <ShieldAlert className="inline w-3 h-3 text-red-500 mr-2" />}
                                  {new Date(v.created_at).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-white">{v.domain_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className={cn("font-mono text-xs", isSuspicious ? "text-red-300" : "text-red-400")}>{v.ip_address}</div>
                                  <div className={cn("text-xs font-bold uppercase", isSuspicious ? "text-red-500" : "text-orange-600")}>{v.country}</div>
                                </td>
                                <td className={cn("px-6 py-4 whitespace-nowrap max-w-xs truncate", isSuspicious ? "text-red-200" : "text-orange-300")} title={v.user_agent}>{v.user_agent}</td>
                                <td className={cn("px-6 py-4 whitespace-nowrap max-w-xs truncate", isSuspicious ? "text-red-300" : "text-orange-400")}>{v.referrer}</td>
                              </tr>
                            );
                          })}
                          {filteredVisits.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-orange-600 font-bold uppercase tracking-widest">No traffic intercepted</td></tr>
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'alerts' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              
              <TrafficVolumeAlerts alerts={alertsLog} />

              {(() => {
                const now = Date.now();
                const thirtyDaysAgo = now - 30 * 24 * 3600 * 1000;
                const dailyCounts = new Map<string, number>();
                
                // Initialize last 30 days
                for (let i = 29; i >= 0; i--) {
                  const d = new Date(now - i * 24 * 3600 * 1000).toISOString().split('T')[0];
                  dailyCounts.set(d, 0);
                }
                
                alertsLog.forEach(alert => {
                  if (alert.timestamp >= thirtyDaysAgo) {
                    const d = new Date(alert.timestamp).toISOString().split('T')[0];
                    if (dailyCounts.has(d)) {
                      dailyCounts.set(d, dailyCounts.get(d)! + 1);
                    }
                  }
                });
                
                const chartData = Array.from(dailyCounts.entries()).map(([date, count]) => ({ date, count }));
                
                return (
                  <div className="bg-orange-950/20 border border-orange-900 rounded-lg p-6">
                     <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                       <TrendingUp className="w-4 h-4" /> Trend: Alert Frequency (30 Days)
                     </h3>
                     <div className="h-[200px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={chartData}>
                           <defs>
                             <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                               <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#9a3412" opacity={0.3} />
                           <XAxis 
                             dataKey="date" 
                             stroke="#fdba74" 
                             tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                             fontSize={12}
                           />
                           <YAxis stroke="#fdba74" fontSize={12} allowDecimals={false} />
                           <Tooltip 
                             contentStyle={{ backgroundColor: '#431407', borderColor: '#ef4444', color: '#fff' }} 
                           />
                           <Area type="monotone" dataKey="count" name="Alerts" stroke="#ef4444" fillOpacity={1} fill="url(#colorAlerts)" />
                         </AreaChart>
                       </ResponsiveContainer>
                     </div>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center mb-4 border-b-2 border-orange-600 pb-1">
                <h2 className="text-lg font-bold text-white uppercase tracking-widest text-orange-500 inline-block flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5"/>
                  System Alerts Log
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative hidden md:block">
                    <input 
                      type="text" 
                      value={alertSearch} 
                      onChange={e => setAlertSearch(e.target.value)} 
                      placeholder="Filter Alerts..." 
                      className="bg-black border border-orange-800 text-orange-200 px-3 py-1 pl-8 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors w-48 lg:w-64 focus:ring-1 focus:ring-orange-500 font-mono"
                    />
                    <Search className="w-4 h-4 text-orange-800 absolute left-2.5 top-1.5" />
                  </div>
                  <span className="text-xs font-mono text-orange-400">Total Alerts: {alertsLog.length}</span>
                  <button onClick={exportAlertsCSV} className="text-xs font-bold uppercase tracking-widest bg-orange-950/50 hover:bg-orange-900 border border-orange-800 text-orange-400 py-1.5 px-3 rounded transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Clear System Alerts Log',
                      message: 'Are you sure you want to permanently delete all system alerts?',
                      onConfirm: () => setAlertsLog([])
                    });
                  }} className="text-xs font-bold uppercase tracking-widest bg-orange-950/50 hover:bg-orange-900 border border-orange-800 text-orange-400 py-1.5 px-3 rounded transition-colors flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Clear Log
                  </button>
                </div>
              </div>
              
              <div className="md:hidden relative mb-4">
                <input 
                  type="text" 
                  value={alertSearch} 
                  onChange={e => setAlertSearch(e.target.value)} 
                  placeholder="Filter Alerts..." 
                  className="bg-black border border-orange-800 text-orange-200 px-3 py-2 pl-8 rounded text-sm focus:outline-none focus:border-orange-500 transition-colors w-full focus:ring-1 focus:ring-orange-500 font-mono"
                />
                <Search className="w-4 h-4 text-orange-800 absolute left-2.5 top-2.5" />
              </div>

              <div className="border border-orange-900 rounded-lg overflow-hidden bg-black ring-1 ring-orange-900 shadow-xl">
                <table className="min-w-full divide-y divide-orange-900">
                  <thead className="bg-orange-950">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Severity</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Alert Type</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">Details</th>
                      <th className="px-6 py-3 text-right text-xs font-bold text-orange-200 uppercase tracking-widest">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-orange-900 text-sm">
                    {(() => {
                      const filteredAlerts = alertsLog.filter(alert => {
                        if (!alertSearch) return true;
                        const term = alertSearch.toLowerCase();
                        return (alert.type || '').toLowerCase().includes(term) ||
                               (alert.message || '').toLowerCase().includes(term) ||
                               (alert.severity || '').toLowerCase().includes(term);
                      });

                      return (
                        <>
                          {filteredAlerts.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-orange-600 font-bold uppercase tracking-widest">No alerts recorded</td>
                            </tr>
                          ) : (
                            filteredAlerts.map((alert: any) => (
                              <tr key={alert.id} className="hover:bg-orange-950/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-orange-500 font-mono text-xs">
                                  {new Date(alert.timestamp).toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {alert.severity === 'high' ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-950 border border-red-800 text-red-500">HIGH</span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-950 border border-yellow-800 text-yellow-500">MEDIUM</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-bold text-white uppercase text-xs tracking-widest">
                                  <div className="flex items-center gap-2">
                                    {alert.type === 'Volume Threshold Exceeded' ? <Activity className="w-4 h-4 text-red-500" /> : 
                                     alert.type === 'Traffic Growth Alert' ? <TrendingUp className="w-4 h-4 text-blue-500" /> : 
                                     <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                    {alert.type}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-orange-300 text-sm max-w-lg truncate" title={alert.message}>{alert.message}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button onClick={() => setSelectedAlertDetails(alert)} className="text-xs font-bold uppercase tracking-widest bg-orange-900 border border-orange-700 hover:bg-orange-600 text-white py-1 px-3 rounded transition-colors">
                                    Details
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Alert Details Modal */}
              {selectedAlertDetails && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setSelectedAlertDetails(null)}>
                  <div className="bg-black border-2 border-red-900 rounded-lg max-w-2xl w-full p-6 shadow-[0_0_50px_rgba(220,38,38,0.3)] animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-6 border-b border-red-900/50 pb-4">
                      <div className="flex items-center gap-3">
                        {selectedAlertDetails.type === 'Volume Threshold Exceeded' ? <Activity className="w-6 h-6 text-red-500" /> : 
                         selectedAlertDetails.type === 'Traffic Growth Alert' ? <TrendingUp className="w-6 h-6 text-blue-500" /> : 
                         <AlertTriangle className="w-6 h-6 text-yellow-500" />}
                        <div>
                          <h3 className="text-xl font-bold text-white uppercase tracking-widest">{selectedAlertDetails.type}</h3>
                          <div className="text-orange-500 font-mono text-sm">{new Date(selectedAlertDetails.timestamp).toLocaleString()}</div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedAlertDetails(null)} className="text-orange-500 hover:text-white transition-colors bg-red-950/30 p-2 rounded-lg">
                        <X className="w-5 h-5"/>
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Alert Description</h4>
                        <p className="text-orange-200">{selectedAlertDetails.message}</p>
                      </div>

                      {selectedAlertDetails.type === 'Volume Threshold Exceeded' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black border border-orange-900 p-4 rounded">
                            <div className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-1">Volume Threshold</div>
                            <div className="text-2xl font-mono text-white">{selectedAlertDetails.threshold || 'N/A'} <span className="text-sm text-orange-500">req/hr</span></div>
                          </div>
                          <div className="bg-black border border-red-900 p-4 rounded shadow-[inset_0_0_20px_rgba(220,38,38,0.1)]">
                            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">Actual Volume</div>
                            <div className="text-2xl font-mono text-red-500 font-bold">{selectedAlertDetails.visitCount || 'N/A'} <span className="text-sm">req/hr</span></div>
                          </div>
                        </div>
                      )}

                      <div className="bg-black border border-orange-900 rounded p-4">
                         <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-orange-400 mb-3 border-b border-orange-900/50 pb-2">
                           <ShieldAlert className="w-4 h-4" /> Recommended Remediation
                         </h4>
                         <ul className="list-disc list-inside text-orange-200 text-sm space-y-2">
                           {selectedAlertDetails.type === 'Volume Threshold Exceeded' ? (
                             <>
                               <li>Review firewall rules for potential DDoS attack signatures.</li>
                               <li>Identify IP blocks exhibiting abnormal request rates globally.</li>
                               <li>Verify if traffic is organic (e.g., promotional campaign spike).</li>
                               <li>Consider temporarily lowering rate-limits on API endpoints.</li>
                             </>
                           ) : selectedAlertDetails.type === 'Traffic Growth Alert' ? (
                             <>
                               <li>Validate campaign attributions to ensure growth is legitimate.</li>
                               <li>Prepare backend infrastructure for sustained higher load.</li>
                               <li>Monitor database connections and latency closely.</li>
                             </>
                           ) : (
                             <>
                               <li>Review system logs corresponding to the designated timestamp.</li>
                               <li>Escalate to engineering if anomaly persists for &gt; 15 mins.</li>
                             </>
                           )}
                         </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

          {/* API KEYS TAB */}
          {activeTab === 'apikeys' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                 <h2 className="text-xl font-bold text-white border-b-2 border-orange-600 inline-block pb-1 flex items-center gap-2">
                   <Key className="w-5 h-5 text-orange-500" /> API Access Management
                 </h2>
              </div>
              
              <div className="bg-orange-950/20 border border-orange-900 rounded-lg p-6">
                <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                  Generate New API Key {newKeyWizardStep === 2 && <span className="text-orange-800">/ Advanced Config</span>}
                </h3>
                
                {newKeyWizardStep === 1 ? (
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div>
                      <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Key Appellation</label>
                      <input 
                        type="text" 
                        placeholder="Key Name (e.g., Frontend App)" 
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full bg-black border border-orange-900 text-orange-200 px-4 py-3 rounded focus:outline-none focus:border-orange-500 min-w-0 placeholder-orange-900/50"
                      />
                      <p className="text-orange-800 text-xs mt-2 italic">Provide a memorable name to identify this key's purpose later.</p>
                    </div>
                    <div className="flex justify-between mt-2 items-center">
                       <div className="flex flex-col gap-1">
                          <div className="flex gap-1.5 items-center">
                            <div className="w-6 h-1.5 bg-orange-600 rounded-full"></div>
                            <div className="w-2 h-1.5 bg-orange-900 rounded-full"></div>
                          </div>
                          <div className="text-[10px] text-orange-600 uppercase font-bold tracking-widest">Step 1 of 2</div>
                       </div>
                       <button
                         onClick={() => setNewKeyWizardStep(2)}
                         disabled={!newKeyName.trim()}
                         className="w-full sm:w-auto px-8 py-3 bg-orange-900 border border-orange-600 hover:bg-orange-800 disabled:opacity-50 disabled:hover:bg-orange-900 text-white rounded uppercase text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 outline-none"
                       >
                         Next: Advanced Configuration <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-black border border-orange-900 rounded-lg shadow-inner">
                      <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 flex items-center justify-between">
                         <span>App / Domain Scope</span>
                         <button 
                            onClick={() => setIsAddingNewDomain(!isAddingNewDomain)}
                            className="text-orange-500 hover:text-white"
                         >
                            {isAddingNewDomain ? "Cancel" : "+ Add New App"}
                         </button>
                      </label>
                      {isAddingNewDomain ? (
                        <div className="flex gap-2 mt-2">
                           <input 
                             type="text" 
                             value={newDomainName}
                             onChange={e => setNewDomainName(e.target.value)}
                             placeholder="e.g. commandnexus.net"
                             className="w-full bg-black border border-orange-900 text-orange-200 px-4 py-2 rounded focus:outline-none focus:border-orange-500 min-w-0"
                             onKeyDown={async (e) => {
                               if (e.key === 'Enter' && newDomainName.trim()) {
                                  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                                  const res = await fetch('/api/domains', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ id, name: newDomainName.trim(), description: 'Added via API Dashboard' })
                                  });
                                  if (res.ok) {
                                     await fetchAll();
                                     setNewKeyDomainId(id);
                                     setNewDomainName('');
                                     setIsAddingNewDomain(false);
                                  } else {
                                     alert("Failed to add domain.");
                                  }
                               }
                             }}
                           />
                           <button 
                              onClick={async () => {
                                  if (!newDomainName.trim()) return;
                                  const id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
                                  const res = await fetch('/api/domains', {
                                     method: 'POST',
                                     headers: { 'Content-Type': 'application/json' },
                                     body: JSON.stringify({ id, name: newDomainName.trim(), description: 'Added via API Dashboard' })
                                  });
                                  if (res.ok) {
                                     await fetchAll();
                                     setNewKeyDomainId(id);
                                     setNewDomainName('');
                                     setIsAddingNewDomain(false);
                                  } else {
                                     alert("Failed to add domain.");
                                  }
                              }}
                              disabled={!newDomainName.trim()}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 mt-0 text-white rounded text-sm font-bold uppercase disabled:opacity-50"
                           >
                              Save
                           </button>
                        </div>
                      ) : (
                        <select
                          value={newKeyDomainId}
                          onChange={e => setNewKeyDomainId(e.target.value)}
                          className="w-full bg-black border border-orange-900 text-orange-200 px-4 py-2 rounded focus:outline-none focus:border-orange-500 mt-2"
                        >
                          <option value="">Global Access (CommandNexus System)</option>
                          {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      )}
                      <p className="text-orange-800 text-[10px] mt-2 uppercase tracking-wide">Leave as Global Access to allow the key to perform any operation across the system.</p>
                    </div>

                    <div className="p-4 bg-black border border-orange-900 rounded-lg shadow-inner">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Prefix</label>
                          <input 
                             type="text" 
                             value={newKeyPrefix} 
                             onChange={e => setNewKeyPrefix(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} 
                             className="w-full bg-black border border-orange-900 text-orange-200 px-4 py-2 rounded focus:outline-none focus:border-orange-500 min-w-0 font-mono" 
                             placeholder="cnx" 
                             maxLength={8} 
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1 flex justify-between">
                            <span>Length</span>
                            <span className="text-orange-500">{newKeyLength} chars</span>
                          </label>
                          <input 
                             type="range" 
                             min={16} 
                             max={64} 
                             value={newKeyLength} 
                             onChange={e => setNewKeyLength(Number(e.target.value))} 
                             className="w-full accent-orange-600 h-2 bg-black rounded outline-none appearance-none mt-3" 
                          />
                        </div>
                        <div className="flex-1 flex gap-2">
                          <label className={cn("flex-1 text-center cursor-pointer border rounded px-2 py-2 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1", newKeyParams.numbers ? "bg-orange-900 border-orange-500 text-white" : "bg-black border-orange-900 text-orange-500")}>
                            <input type="checkbox" className="hidden" checked={newKeyParams.numbers} onChange={e => setNewKeyParams({...newKeyParams, numbers: e.target.checked})} />
                            [1-9] Nums
                          </label>
                          <label className={cn("flex-1 text-center cursor-pointer border rounded px-2 py-2 text-[10px] font-bold uppercase transition-colors flex items-center justify-center gap-1", newKeyParams.symbols ? "bg-orange-900 border-orange-500 text-white" : "bg-black border-orange-900 text-orange-500")}>
                            <input type="checkbox" className="hidden" checked={newKeyParams.symbols} onChange={e => setNewKeyParams({...newKeyParams, symbols: e.target.checked})} />
                            [@#$] Syms
                          </label>
                        </div>
                      </div>
                      <p className="text-orange-800 text-[10px] mt-3 uppercase tracking-wide">Customize the final string format for the bearer token output.</p>
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex flex-col gap-1 cursor-pointer group" onClick={() => setNewKeyWizardStep(1)}>
                         <div className="flex gap-1.5 items-center">
                           <div className="w-2 h-1.5 bg-orange-900 group-hover:bg-orange-600 rounded-full transition-colors"></div>
                           <div className="w-6 h-1.5 bg-orange-600 rounded-full"></div>
                         </div>
                         <div className="text-[10px] text-orange-600 uppercase font-bold tracking-widest group-hover:text-orange-500 transition-colors">Step 2 of 2</div>
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => setNewKeyWizardStep(1)}
                          className="px-4 py-3 bg-black border border-orange-900 text-orange-500 hover:text-white hover:bg-orange-900 text-xs font-bold uppercase rounded transition-colors"
                        >
                          Back
                        </button>
                        <button 
                          onClick={async () => {
                            if (!newKeyName.trim()) return;
                            
                            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
                            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                            const numbers = '0123456789';
                            const symbols = '_-.!';
    
                            let chars = lowercase + uppercase;
                            if (newKeyParams.numbers) chars += numbers;
                            if (newKeyParams.symbols) chars += symbols;
    
                            let key = newKeyPrefix ? newKeyPrefix + '_' : '';
                            const randomLength = newKeyPrefix ? newKeyLength - newKeyPrefix.length - 1 : newKeyLength;
    
                            let randomValues = new Uint32Array(Math.max(0, randomLength));
                            if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(randomValues);
    
                            for (let i = 0; i < randomValues.length; i++) {
                              key += chars.charAt(randomValues[i] % chars.length);
                            }
    
                            const payload = { name: newKeyName.trim(), domain_id: newKeyDomainId || undefined, custom_key: key };
                            const res = await fetch('/api/api-keys', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(payload)
                            });
                            const data = await res.json();
                            if (data.success) {
                              setGeneratedKey(data.api_key);
                              setNewKeyName('');
                              setNewKeyDomainId('');
                              setNewKeyWizardStep(1);
                              fetchApiKeys();
                            } else {
                              alert("Failed to generate key: " + data.error);
                            }
                          }} 
                          disabled={!newKeyName.trim()}
                          className="w-full sm:w-auto px-8 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-white rounded uppercase text-sm font-bold flex items-center justify-center gap-2 transition-colors shrink-0 outline-none shadow-lg shadow-orange-900/50"
                          title="Ctrl+G to Generate"
                        >
                          <Plus className="w-4 h-4" /> Create Key <span className="bg-black/30 px-1.5 py-0.5 rounded text-[10px] ml-2 font-mono border border-black/20">CTRL+G</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {generatedKey && (
                  <div className="mt-6 p-4 border border-green-500/50 bg-green-900/20 rounded animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-green-400 font-bold mb-2 flex items-center justify-between">
                       <span>Key generated successfully!</span>
                       <button onClick={() => setGeneratedKey(null)} className="text-green-400 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="text-orange-200 mb-3 text-sm">Please copy this key and store it safely. It acts as a bearer token for the API.</div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                       <code className="bg-black border border-green-900 text-green-300 px-4 py-3 rounded flex-1 font-mono text-sm break-all select-all">{generatedKey}</code>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(generatedKey);
                           setTimeout(() => setGeneratedKey(null), 1500);
                         }} 
                         className="px-4 py-3 bg-black border border-green-500/50 text-green-400 rounded hover:bg-green-500/20 transition-colors uppercase text-xs font-bold whitespace-nowrap self-stretch"
                       >
                         Copy to Clipboard
                       </button>
                    </div>
                    <div className="text-red-400 mt-3 text-xs uppercase font-bold flex items-center gap-1"><ShieldAlert className="w-4 h-4" /> Warning: For security, this key will never be shown again!</div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-orange-400 uppercase tracking-widest">Usage Statistics</h3>
                <select 
                  value={selectedApiKeyFilter}
                  onChange={(e) => setSelectedApiKeyFilter(e.target.value)}
                  className="bg-black border border-orange-900 text-orange-200 px-3 py-1.5 rounded text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="all">All API Keys</option>
                  {apiKeys.map(k => (
                    <option key={k.id} value={k.name}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-orange-950/20 border border-orange-900 rounded-lg p-6 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity className="w-16 h-16 text-orange-500" />
                  </div>
                  <div className="text-orange-500 font-bold uppercase tracking-widest text-xs mb-2 z-10">Total Successful Calls (30d)</div>
                  <div className="text-4xl text-white font-mono font-bold z-10">
                    {apiKeyUsage
                      .filter(curr => selectedApiKeyFilter === 'all' || curr.name === selectedApiKeyFilter)
                      .reduce((acc, curr) => acc + curr.calls, 0)}
                  </div>
                </div>
              </div>

              <div className="bg-orange-950/20 border border-orange-900 rounded-lg overflow-hidden">
                <table className="w-full text-left bg-black text-sm">
                  <thead className="bg-orange-950 border-b-2 border-orange-800">
                    <tr>
                      <th className="p-3 text-white font-bold tracking-widest uppercase text-xs">Name</th>
                      <th className="p-3 text-white font-bold tracking-widest uppercase text-xs">Prefix</th>
                      <th className="p-3 text-white font-bold tracking-widest uppercase text-xs">Scope</th>
                      <th className="p-3 text-white font-bold tracking-widest uppercase text-xs">Total Calls</th>
                      <th className="p-3 text-white font-bold tracking-widest uppercase text-xs">Created At</th>
                      <th className="p-3 text-orange-500 font-bold tracking-widest uppercase text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map(key => (
                      <tr key={key.id} className="border-b border-orange-900/50 hover:bg-orange-900/20 transition-colors group">
                        <td className="p-3 font-medium text-orange-200">{key.name}</td>
                        <td className="p-3 text-orange-400 font-mono text-xs">{key.prefix}...</td>
                        <td className="p-3 text-orange-300 text-xs">{domains.find(d => d.id === key.domain_id)?.name || 'Global'}</td>
                        <td className="p-3 text-orange-300 font-mono text-xs">{key.use_count || 0}</td>
                        <td className="p-3 text-orange-400/70">{new Date(key.created_at).toLocaleString()}</td>
                        <td className="p-3 text-right">
                           <button onClick={(e) => {
                             e.preventDefault();
                             setConfirmDialog({
                               isOpen: true,
                               title: 'Revoke API Key',
                               message: `Revoke API Key "${key.name}"? This action cannot be undone.`,
                               onConfirm: async () => {
                                 await fetch(`/api/api-keys/${key.id}`, { method: 'DELETE' });
                                 fetchApiKeys();
                               }
                             });
                           }} className="text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Revoke Key">
                             <Trash2 className="w-4 h-4 ml-auto" />
                           </button>
                        </td>
                      </tr>
                    ))}
                    {apiKeys.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-orange-700 italic">No API keys active</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="bg-orange-950/20 border border-orange-900 rounded-lg p-6">
                 <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
                   Test Validation Endpoint (Edge Function)
                 </h3>
                 <div className="flex flex-col gap-4 max-w-2xl">
                   <p className="text-orange-800 text-xs">Simulate an app-to-app validation request against your backend's Edge Function gateway via POST /api/api-keys/validate.</p>
                   <div className="flex flex-col md:flex-row gap-3">
                     <input 
                       type="text" 
                       placeholder="Enter Bearer Token (cnx_...)"
                       value={testKeyInput}
                       onChange={(e) => setTestKeyInput(e.target.value)}
                       className="flex-1 bg-black border border-orange-900 text-orange-200 px-4 py-3 rounded focus:outline-none focus:border-orange-500 min-w-0"
                     />
                     <button
                       onClick={async () => {
                         if (!testKeyInput.trim()) return;
                         setTestKeyResult({ status: 'loading', message: 'Validating against Edge Function...' });
                         try {
                           const res = await fetch('/api/api-keys/validate', {
                             method: 'POST',
                             headers: { 'Content-Type': 'application/json' },
                             body: JSON.stringify({ api_key: testKeyInput.trim() })
                           });
                           const data = await res.json();
                           if (res.ok && data.valid) {
                             setTestKeyResult({ status: 'success', message: 'Validation Successful (200 OK)', data });
                           } else {
                             setTestKeyResult({ status: 'error', message: `Validation Failed (${res.status} Unauthorized)`, data });
                           }
                         } catch (e: any) {
                           setTestKeyResult({ status: 'error', message: 'Failed to contact validation endpoint: ' + e.message });
                         }
                       }}
                       disabled={!testKeyInput.trim() || testKeyResult.status === 'loading'}
                       className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:hover:bg-orange-600 text-white rounded font-bold uppercase text-xs tracking-wider transition-colors shrink-0"
                     >
                       {testKeyResult.status === 'loading' ? 'Validating...' : 'Validate Key'}
                     </button>
                   </div>
                   
                   {testKeyResult.status !== 'idle' && (
                     <div className={cn("p-4 rounded border font-mono text-xs overflow-x-auto", testKeyResult.status === 'success' ? "bg-green-950/30 border-green-900 text-green-400" : (testKeyResult.status === 'error' ? "bg-red-950/30 border-red-900 text-red-400" : "bg-orange-950/30 border-orange-900 text-orange-400"))}>
                        <div className="font-bold mb-2 uppercase">{testKeyResult.message}</div>
                        {testKeyResult.data && (
                          <pre className="whitespace-pre-wrap">{JSON.stringify(testKeyResult.data, null, 2)}</pre>
                        )}
                     </div>
                   )}
                 </div>
              </div>

              {apiKeyUsage && apiKeyUsage.length > 0 && (
                (() => {
                  const filteredUsage = apiKeyUsage.filter(item => selectedApiKeyFilter === 'all' || item.name === selectedApiKeyFilter);
                  const map = new Map<string, any>();
                  const keysSet = new Set<string>();
                  filteredUsage.forEach((item: any) => {
                    if (!map.has(item.date)) map.set(item.date, { date: item.date });
                    const entry = map.get(item.date);
                    entry[item.name] = item.calls;
                    keysSet.add(item.name);
                  });
                  const chartData = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
                  const colors = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

                  return (
                    <div className="bg-orange-950/20 border border-orange-900 rounded-lg p-6 mt-6">
                      <h3 className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                        <LineChart className="w-4 h-4" /> Daily Call Volume (30 Days) {selectedApiKeyFilter !== 'all' ? `- ${selectedApiKeyFilter}` : ''}
                      </h3>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#9a3412" opacity={0.3} />
                            <XAxis 
                              dataKey="date" 
                              stroke="#fdba74" 
                              tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                              fontSize={12}
                            />
                            <YAxis stroke="#fdba74" fontSize={12} allowDecimals={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#431407', borderColor: '#ea580c', color: '#fff' }} 
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#fdba74' }} />
                            {Array.from(keysSet).map((keyName, i) => (
                              <Bar key={keyName} dataKey={keyName} name={keyName} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()
              )}
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
                       <select value={newAgentForm.model} onChange={e => setNewAgentForm({...newAgentForm, model: e.target.value})} className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white">
                         <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                         <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                         <option value="gpt-4o">GPT-4o (Legacy)</option>
                         <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                       </select>
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
                       <label className="block text-xs font-bold text-orange-400 uppercase tracking-widest mb-1">Personality</label>
                       <select value={newAgentForm.personality} onChange={(e) => {
                          const personality = e.target.value;
                          setNewAgentForm(prev => {
                             let instruction = prev.instruction;
                             
                             // Strip out previous personality modifiers if they exist at the end
                             instruction = instruction.replace(/\n\n(Maintain a strictly formal and professional tone in all communications\.|Focus on technical accuracy, providing detailed system-level explanations, code snippets, and structured data outputs\.|Be extremely concise\. Provide minimal fluff and get straight to the point in as few words as possible\.)/g, '');
                             
                             if (personality === 'Formal') {
                                instruction += '\n\nMaintain a strictly formal and professional tone in all communications.';
                             } else if (personality === 'Technical') {
                                instruction += '\n\nFocus on technical accuracy, providing detailed system-level explanations, code snippets, and structured data outputs.';
                             } else if (personality === 'Concise') {
                                instruction += '\n\nBe extremely concise. Provide minimal fluff and get straight to the point in as few words as possible.';
                             }
                             return { ...prev, personality, instruction: instruction.trim() };
                          });
                       }} className="w-full bg-black border border-orange-600 focus:border-red-500 rounded p-2 text-white">
                          <option value="Default">Default</option>
                          <option value="Formal">Formal</option>
                          <option value="Technical">Technical</option>
                          <option value="Concise">Concise</option>
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
                       setNewAgentForm({ name: '', model: 'gemini-3.1-pro-preview', instruction: '', role: 'operator', apiKey: '', personality: 'Default' }); // reset form
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
                      <th className="px-6 py-3 text-left text-xs font-bold text-orange-200 uppercase tracking-widest">API Key</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-orange-300 font-mono text-xs">
                           {ag.api_key ? '••••••••' : <span className="text-orange-700">System Default</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-orange-300 text-xs">{new Date(ag.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-medium flex gap-3 justify-end items-center">
                          <button onClick={() => {
                            setViewingAgentVersionsId(ag.id);
                            fetchAgentVersions(ag.id);
                          }} className="text-orange-400 hover:text-white transition-colors uppercase text-xs font-bold border border-orange-800 rounded px-2 py-1 bg-black">Versioning</button>
                          <button onClick={(e) => {
                            e.preventDefault();
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Eradicate Neural Network',
                              message: 'Are you absolutely sure you want to delete this agent? This cannot be undone.',
                              onConfirm: async () => {
                                await fetch(`/api/agents/${ag.id}`, { method: 'DELETE' });
                                fetchAll();
                              }
                            });
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

        {/* Mobile Bottom Navbar */}
        <div className="md:hidden shrink-0 w-full overflow-x-auto bg-black border-t border-orange-900 flex items-center z-40 pb-safe">
          <div className="flex items-center px-2 py-2 gap-2 min-w-max">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={cn(
                  "flex flex-col items-center justify-center min-w-[70px] w-[70px] h-14 rounded-lg transition-colors px-1", 
                  activeTab === item.id 
                    ? (item.isRed 
                        ? "text-white bg-red-600 font-bold shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-500" 
                        : "text-white bg-orange-600 font-bold shadow-[0_0_15px_rgba(234,88,12,0.5)] border border-orange-500") 
                    : (item.isRed 
                        ? "text-red-700 hover:text-red-500 border border-transparent hover:bg-red-950/40" 
                        : "text-orange-400 hover:text-orange-300 border border-transparent hover:bg-orange-950/40")
                )}
              > 
                <item.icon className="w-5 h-5 mb-1 shrink-0" />
                <span className="text-[10px] uppercase text-center leading-tight line-clamp-1 w-full truncate">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
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
                      <button onClick={(e) => {
                        e.preventDefault();
                        setConfirmDialog({
                          isOpen: true,
                          title: 'Confirm Rollback',
                          message: 'Rollback strictly overrides current logic matrix. Proceed?',
                          onConfirm: async () => {
                            await fetch(`/api/agents/${viewingAgentVersionsId}/versions`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ model: av.model, system_instruction: av.system_instruction })
                            });
                            fetchAgentVersions(viewingAgentVersionsId!);
                            fetchAll();
                          }
                        });
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

      {/* GLOBAL CONFIRMATION DIALOG */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-orange-950 border border-orange-500 shadow-2xl shadow-orange-900/50 rounded-lg max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-orange-500" />
              {confirmDialog.title}
            </h3>
            <p className="text-orange-200 mb-6">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 border border-orange-800 text-orange-300 hover:text-white hover:bg-orange-900 rounded font-bold uppercase tracking-widest text-sm transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-lg shadow-red-900/50 uppercase tracking-widest text-sm transition-colors"
              >
                Confirm
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

