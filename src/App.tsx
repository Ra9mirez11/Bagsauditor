import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Search, 
  Cpu, 
  CheckCircle2,
  Zap,
  AlertTriangle,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const GithubIcon = ({ className = "" }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-3xl transition-colors hover:border-white/10 ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px transition duration-300"
        style={{
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(34, 211, 238, 0.1), transparent 40%)`,
          opacity,
        }}
      />
      {children}
    </div>
  );
};

interface TokenAudit {
  mint: string;
  name: string;
  symbol: string;
  safetyScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  insights: string[];
  recommendation: 'SAFE' | 'CAUTION' | 'DANGER' | 'UNKNOWN';
  fees: number;
  claimEvents?: any[];
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<TokenAudit | null>(null);
  const [feed, setFeed] = useState<any[]>([]);

  useEffect(() => {
    fetchFeed();
    const interval = setInterval(fetchFeed, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeed = async () => {
    const fallbackData = [
      { symbol: 'BAGS', name: 'Bags Official', status: 'LIVE', tokenMint: 'BAGS...' },
      { symbol: 'SOL', name: 'Solana', status: 'ACTIVE', tokenMint: 'So11...' },
      { symbol: 'SEND', name: 'Send It', status: 'TRENDING', tokenMint: 'SEND...' },
    ];

    try {
      const res = await fetch('/api/feed');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setFeed(data.slice(0, 10));
        } else {
          setFeed(fallbackData);
        }
      } else {
        setFeed(fallbackData);
      }
    } catch (e) {
      setFeed(fallbackData);
    }
  };

  const runAudit = async (forcedMint?: string) => {
    const mint = (forcedMint || searchQuery).trim();
    if (!mint) return;
    setIsAuditing(true);
    setAuditResult(null);
    
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_mint: mint })
      });

      if (response.ok) {
        const data = await response.json();
        setAuditResult({
          mint: mint,
          name: data.name,
          symbol: data.symbol,
          safetyScore: data.safetyScore,
          riskLevel: data.riskLevel,
          insights: data.insights || [],
          recommendation: data.recommendation,
          fees: data.fees,
          claimEvents: data.claimEvents
        });
      } else {
        const errData = await response.json();
        throw new Error(errData.error || 'Backend failure');
      }
    } catch (error: any) {
      console.error("Audit failed:", error);
    } finally {
      setIsAuditing(false);
      setTimeout(() => {
        const element = document.getElementById('results-section');
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'SAFE': return 'text-success';
      case 'CAUTION': return 'text-warning';
      case 'DANGER': return 'text-danger';
      default: return 'text-white/60';
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'SAFE': return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'CAUTION': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'DANGER': return <ShieldAlert className="w-5 h-5 text-danger" />;
      default: return <Cpu className="w-5 h-5 text-white/40" />;
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-primary/30 text-white bg-black">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/bg-vortex.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.4)]">
              <ShieldCheck className="text-black w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">Bags<span className="text-primary">Auditor</span></span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em]">Hackathon Sentinel</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40">
            <button onClick={() => scrollToSection('search-section')} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none">Analyzer</button>
            <button onClick={() => scrollToSection('features-section')} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none">Integration</button>
            <a href="https://github.com/Ra9mirez11/Bagsauditor" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors no-underline">
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16">
          
          {/* Sidebar Feed */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="glass p-6 rounded-3xl sticky top-40 border-primary/10">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
                <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-primary">Live Activity</h3>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {feed.length > 0 ? feed.map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/40 hover:bg-white/5 transition-all cursor-pointer group"
                    onClick={() => {
                      setSearchQuery(item.tokenMint);
                      runAudit(item.tokenMint);
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-black text-xs group-hover:text-primary transition-colors">{item.symbol}</span>
                      <span className="text-[10px] text-white/20">{item.status || 'LIVE'}</span>
                    </div>
                    <p className="text-[10px] text-white/40 truncate font-mono uppercase">{item.name}</p>
                  </motion.div>
                )) : (
                  <div className="text-center py-10 text-white/20 text-[10px] font-bold uppercase tracking-widest">No active launches</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <section className="mb-20">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[9px] font-black uppercase tracking-[0.3em] mb-8"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Bags Hackathon 2026 Submission
              </motion.div>
              
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
                Secure Your <br />
                <span className="text-gradient">Bags</span> AI.
              </h1>
              
              <p className="text-white/40 max-w-2xl text-xl leading-relaxed font-medium">
                Autonomous security sentinel leveraging Neural Intelligence to verify 1% fee distributions, creator trust, and safe launch standards on the Bags ecosystem.
              </p>
            </section>

            {/* Audit Search */}
            <section id="search-section" className="mb-20">
              <motion.div className="glass p-2 rounded-3xl focus-within:border-primary/40 focus-within:shadow-[0_0_40px_rgba(0,245,255,0.15)] transition-all max-w-2xl">
                <div className="flex items-center gap-2">
                  <div className="pl-4"><Search className="w-5 h-5 text-white/40" /></div>
                  <input 
                    type="text" 
                    placeholder="ENTER TOKEN MINT ADDRESS..." 
                    className="w-full bg-transparent border-none focus:ring-0 py-5 text-xl placeholder:text-white/10 text-white font-mono uppercase tracking-tighter"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runAudit()}
                  />
                  <button 
                    onClick={() => runAudit()}
                    disabled={isAuditing}
                    className="bg-primary hover:bg-primary/80 text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAuditing ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <span>Audit</span>}
                  </button>
                </div>
              </motion.div>
            </section>

            {/* Audit Results */}
            <AnimatePresence>
              {auditResult && (
                <div id="results-section">
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="relative group overflow-hidden rounded-3xl p-[1px]">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-border-flow opacity-70" />
                      <div className="relative glass p-8 rounded-3xl flex flex-col items-center justify-center text-center bg-black h-full">
                        <div className="text-[10px] font-black text-white/30 uppercase mb-4 tracking-[0.3em]">Security Index</div>
                        <div className={`text-8xl font-black tracking-tighter ${auditResult.safetyScore > 80 ? 'text-success' : auditResult.safetyScore > 50 ? 'text-warning' : 'text-danger'}`}>{auditResult.safetyScore}</div>
                        <div className="text-[9px] font-black mt-6 text-white/40 uppercase tracking-[0.4em]">Powered by Bags AI Intelligence</div>
                      </div>
                    </div>
                    <div className="md:col-span-2 glass p-10 rounded-3xl border-white/5">
                      <div className="flex justify-between items-start mb-10">
                        <div>
                          <h3 className="text-4xl font-black mb-2 uppercase tracking-tighter italic">{auditResult.name}</h3>
                          <div className="flex items-center gap-3">
                            <p className="text-primary font-mono text-sm font-black tracking-widest">${auditResult.symbol}</p>
                            <div className="w-1 h-1 rounded-full bg-white/20" />
                            <p className="text-white/30 font-mono text-[10px]">{auditResult.mint.substring(0, 8)}...{auditResult.mint.substring(36)}</p>
                          </div>
                        </div>
                        <div className={`px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] ${getRecommendationColor(auditResult.recommendation)}`}>
                          {auditResult.recommendation}
                        </div>
                      </div>
                      <div className="space-y-5">
                        {auditResult.insights.map((v, i) => (
                          <div key={i} className="flex items-start gap-4 text-white/70 group">
                            <div className="mt-1">{getRecommendationIcon(auditResult.recommendation)}</div>
                            <span className="text-base font-medium leading-relaxed">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Fee Dashboard Section */}
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="glass p-10 rounded-3xl mb-8 border border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                      <div>
                        <h4 className="text-3xl font-black uppercase tracking-tighter italic">Fee Network Analytics</h4>
                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-2">Bags State Program | 1% Creator Revenue Tracking</p>
                      </div>
                      <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <span className="px-4 py-1.5 bg-primary/20 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest">Real-Time</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all group">
                        <div className="text-[9px] text-white/30 uppercase font-black mb-2 tracking-[0.2em]">Total Revenue</div>
                        <div className="text-2xl font-mono text-white group-hover:text-primary transition-colors">{(auditResult.claimEvents?.reduce((acc, curr) => acc + curr.amount, 0) || 0).toFixed(2)} SOL</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-secondary/30 transition-all group">
                        <div className="text-[9px] text-white/30 uppercase font-black mb-2 tracking-[0.2em]">Community</div>
                        <div className="text-2xl font-mono text-secondary">{(auditResult.claimEvents?.filter(e => !e.isCreator).reduce((acc, curr) => acc + curr.amount, 0) || 0).toFixed(2)} SOL</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-success/30 transition-all group">
                        <div className="text-[9px] text-white/30 uppercase font-black mb-2 tracking-[0.2em]">Avg Claim</div>
                        <div className="text-2xl font-mono text-success">{(auditResult.claimEvents?.length ? (auditResult.claimEvents.reduce((acc, curr) => acc + curr.amount, 0) / auditResult.claimEvents.length) : 0).toFixed(3)} SOL</div>
                      </div>
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-accent/30 transition-all group">
                        <div className="text-[9px] text-white/30 uppercase font-black mb-2 tracking-[0.2em]">Creator Net</div>
                        <div className="text-2xl font-mono text-accent">{(auditResult.claimEvents?.filter(e => e.isCreator).reduce((acc, curr) => acc + curr.amount, 0) || 0).toFixed(2)} SOL</div>
                      </div>
                    </div>
                    
                    <div className="h-[350px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={auditResult.claimEvents}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            dataKey="timestamp" 
                            stroke="#ffffff20" 
                            fontSize={10} 
                            tickFormatter={(t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          />
                          <YAxis stroke="#ffffff20" fontSize={10} tickFormatter={(v) => `${v}S`} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '16px' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#00F5FF' }}
                            labelStyle={{ color: '#ffffff40', fontSize: '10px', marginBottom: '4px' }}
                          />
                          <Area 
                            name="SOL Claimed"
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#00F5FF" 
                            fill="url(#colorAmount)" 
                            strokeWidth={4} 
                            animationDuration={2500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>


                </div>
              )}
            </AnimatePresence>

            {/* Features / Submission Requirements Grid */}
            <section id="features-section" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SpotlightCard className="p-10 group border-primary/10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-primary">
                  <Cpu className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-black mb-4 uppercase italic">Bags Integration</h4>
                <p className="text-white/40 leading-relaxed text-sm font-medium">Full integration with Bags State Program via API and SDK to track on-chain creator fee distributions and lifetime revenue metrics.</p>
              </SpotlightCard>
              <SpotlightCard className="p-10 group border-secondary/10">
                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-secondary">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-black mb-4 uppercase italic">Security Track</h4>
                <p className="text-white/40 leading-relaxed text-sm font-medium">Solving the problem of trust in social finance by providing autonomous audits for newly launched creator tokens on the Bags platform.</p>
              </SpotlightCard>
              <SpotlightCard className="p-10 group border-accent/10">
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform text-accent">
                  <Terminal className="w-7 h-7" />
                </div>
                <h4 className="text-2xl font-black mb-4 uppercase italic">Open Source</h4>
                <p className="text-white/40 leading-relaxed text-sm font-medium">Built with transparency in mind. The entire codebase is open-source and ready for community contributions to enhance the Bags ecosystem security.</p>
              </SpotlightCard>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4 group cursor-help">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="text-xs font-black tracking-[0.4em] uppercase text-white/40 group-hover:text-primary transition-colors">The Bags Hackathon 2026 Submission</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-10">
            <a href="https://bagsauditor.vercel.app/" target="_blank" rel="noreferrer" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-primary transition-colors no-underline flex items-center gap-2">
              <ExternalLink className="w-3 h-3" />
              Live Site
            </a>
            <a href="https://github.com/Ra9mirez11/Bagsauditor" target="_blank" rel="noreferrer" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-primary transition-colors no-underline flex items-center gap-2">
              <GithubIcon className="w-3 h-3" />
              GitHub Repo
            </a>
            <a href="https://docs.bags.fm/" target="_blank" rel="noreferrer" className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-primary transition-colors no-underline">
              Bags API
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
