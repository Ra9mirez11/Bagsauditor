import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  BarChart3, 
  Search, 
  Cpu, 
  CheckCircle2,
  MessageSquare,
  Send,
  Zap,
  AlertTriangle,
  ShieldAlert
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

const GithubIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
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
  name: string;
  symbol: string;
  safetyScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  vulnerabilities: string[];
  recommendation: 'SAFE' | 'CAUTION' | 'DANGER' | 'UNKNOWN';
  fees: number;
  claimEvents?: any[];
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<TokenAudit | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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
      console.warn("Feed fetch failed, using fallback");
      setFeed(fallbackData);
    }
  };

  const sendChatMessage = async () => {
    if (!currentMessage || !auditResult) return;
    
    const userMsg = { role: 'user', content: currentMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setCurrentMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentMessage,
          context: auditResult
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || 'API failure');
      }
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'ai', content: `CRITICAL ERROR: ${e.message}` }]);
    } finally {
      setIsSending(false);
    }
  };

  const runAudit = async (forcedMint?: string) => {
    const mint = forcedMint || searchQuery;
    if (!mint) return;
    setIsAuditing(true);
    setAuditResult(null);
    setChatMessages([]);
    
    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_mint: mint })
      });

      if (response.ok) {
        const data = await response.json();
        setAuditResult({
          name: data.name,
          symbol: data.symbol,
          safetyScore: data.safetyScore,
          riskLevel: data.riskLevel,
          vulnerabilities: data.vulnerabilities,
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
      setChatMessages(prev => [...prev, { role: 'ai', content: `AUDIT FAILED: ${error.message}` }]);
    } finally {
      setIsAuditing(false);
      const element = document.getElementById('results-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
          className="w-full h-full object-cover opacity-40"
        >
          <source src="/bg-vortex.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.3)]">
              <ShieldCheck className="text-black w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tighter text-white">BAGS<span className="text-primary">AUDITOR</span></span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Sentinel AI v2</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <button onClick={() => scrollToSection('search-section')} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none">Analyzer</button>
            <button onClick={() => scrollToSection('features-section')} className="hover:text-primary transition-colors cursor-pointer bg-transparent border-none">Features</button>
            <a href="https://docs.bags.fm/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">Docs</a>
            <div className="h-4 w-px bg-white/10" />
            <a 
              href="https://github.com/Ra9mirez11/Bagsauditor"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all text-white no-underline group"
            >
              <GithubIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar Feed */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="glass p-6 rounded-3xl sticky top-32">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-4 h-4 text-secondary animate-pulse" />
                <h3 className="font-bold text-sm uppercase tracking-widest text-white/60">Live Bags Activity</h3>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {feed.length > 0 ? feed.map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer group"
                    onClick={() => {
                      setSearchQuery(item.tokenMint);
                      runAudit(item.tokenMint);
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.symbol}</span>
                      <span className="text-[10px] text-white/30">{item.status || 'LIVE'}</span>
                    </div>
                    <p className="text-xs text-white/40 truncate">{item.name}</p>
                  </motion.div>
                )) : (
                  <div className="text-center py-10 text-white/20 text-xs">No active launches found</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Hero Section */}
            <section className="text-center mb-16">
              <div className="flex flex-col items-center text-center space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-[0.2em]"
              >
                AI-Powered Security Sentinel
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Secure Your <span className="text-gradient">Bags</span> <br />
                with Claude AI.
              </h1>
              
              <p className="text-white/40 max-w-xl text-lg leading-relaxed">
                Real-time security auditing for the Bags ecosystem. We track 1% fee distributions and verify safe launch events using Claude 3.5 Sonnet.
              </p>
            </div>
            </section>

            {/* Audit Search */}
            <section id="search-section" className="mb-16">
              <motion.div className="glass p-2 rounded-3xl focus-within:border-primary/30 focus-within:shadow-[0_0_30px_rgba(0,245,255,0.1)] transition-all max-w-2xl mx-auto">
                <div className="flex items-center gap-2">
                  <div className="pl-4"><Search className="w-5 h-5 text-white/40" /></div>
                  <input 
                    type="text" 
                    placeholder="Enter Token Mint Address..." 
                    className="w-full bg-transparent border-none focus:ring-0 py-4 text-lg placeholder:text-white/20 text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runAudit()}
                  />
                  <button 
                    onClick={() => runAudit()}
                    disabled={isAuditing}
                    className="bg-primary hover:bg-primary/80 text-black px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAuditing ? <><div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /><span>Auditing...</span></> : <span>Audit Now</span>}
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
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent animate-border-flow" />
                      <div className="relative glass p-8 rounded-3xl flex flex-col items-center justify-center text-center bg-black h-full">
                        <div className="text-xs font-bold text-white/40 uppercase mb-4 tracking-widest">Safety Score</div>
                        <div className={`text-7xl font-bold ${auditResult.safetyScore > 80 ? 'text-success' : auditResult.safetyScore > 50 ? 'text-warning' : 'text-danger'}`}>{auditResult.safetyScore}</div>
                        <div className="text-[10px] font-medium mt-4 text-white/60 uppercase tracking-widest">Verified by Claude-3.5</div>
                      </div>
                    </div>
                    <div className="md:col-span-2 glass p-8 rounded-3xl border-white/5">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h3 className="text-3xl font-black mb-1">{auditResult.name}</h3>
                          <p className="text-primary font-mono text-sm font-bold">${auditResult.symbol}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider ${getRecommendationColor(auditResult.recommendation)}`}>
                            {auditResult.recommendation}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {auditResult.vulnerabilities.length > 0 ? auditResult.vulnerabilities.map((v, i) => (
                          <div key={i} className="flex items-center gap-3 text-white/80 group">
                            <div className="shrink-0">{getRecommendationIcon(auditResult.recommendation)}</div>
                            <span className="text-sm md:text-base">{v}</span>
                          </div>
                        )) : (
                          <div className="text-white/40 italic text-sm">No specific vulnerabilities flagged.</div>
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Fee Dashboard Section */}
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="glass p-8 rounded-3xl mb-8 border border-white/5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                      <div>
                        <h4 className="text-2xl font-bold">Fee Distribution Dashboard</h4>
                        <p className="text-white/40 text-sm font-medium">On-chain transparency for the 1% creator fee</p>
                      </div>
                      <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                        <span className="px-3 py-1 bg-primary/20 text-primary text-[10px] font-bold rounded-lg uppercase">Live Data</span>
                        <span className="px-3 py-1 text-white/40 text-[10px] font-bold rounded-lg uppercase">Recent Events</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group">
                        <div className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-widest">Total Claims</div>
                        <div className="text-xl font-mono text-white group-hover:text-primary transition-colors">{(auditResult.claimEvents?.reduce((acc, curr) => acc + curr.amount, 0) || 0).toFixed(2)} SOL</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-secondary/30 transition-all group">
                        <div className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-widest">Community</div>
                        <div className="text-xl font-mono text-secondary">{(auditResult.claimEvents?.filter(e => !e.isCreator).reduce((acc, curr) => acc + curr.amount, 0) || 0).toFixed(2)} SOL</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-success/30 transition-all group">
                        <div className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-widest">Avg Size</div>
                        <div className="text-xl font-mono text-success">{(auditResult.claimEvents?.length ? (auditResult.claimEvents.reduce((acc, curr) => acc + curr.amount, 0) / auditResult.claimEvents.length) : 0).toFixed(3)} SOL</div>
                      </div>
                      <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-accent/30 transition-all group">
                        <div className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-widest">Creator Share</div>
                        <div className="text-xl font-mono text-accent">{(auditResult.claimEvents?.filter(e => e.isCreator).reduce((acc, curr) => acc + curr.amount, 0) || 0).toFixed(2)} SOL</div>
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full mt-4">
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
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#ffffff40', fontSize: '10px', marginBottom: '4px' }}
                            labelFormatter={(label) => `Time: ${new Date(label).toLocaleString()}`}
                          />
                          <Area 
                            name="Claim Amount"
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#00F5FF" 
                            fill="url(#colorAmount)" 
                            strokeWidth={3} 
                            animationDuration={2000}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>

                  {/* AI Researcher Chat */}
                  <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl overflow-hidden mb-20 border border-primary/20 bg-black/40">
                    <div className="bg-primary/5 p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Claude AI Researcher</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-[10px] font-bold text-white/40 uppercase">Connected</span>
                      </div>
                    </div>
                    <div className="h-80 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-10">
                          <Cpu className="w-10 h-10 text-white/10 mx-auto mb-4" />
                          <p className="text-white/20 text-sm">Ask Claude about this token's security or fee structure...</p>
                        </div>
                      )}
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-black font-bold' : 'bg-white/5 border border-white/10 text-white/90 leading-relaxed'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-black/60 border-t border-white/5 flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Type your question..." 
                        className="flex-1 bg-white/5 border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                      />
                      <button 
                        onClick={sendChatMessage}
                        disabled={isSending || !currentMessage}
                        className="bg-primary hover:bg-primary/80 text-black px-6 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center"
                      >
                        {isSending ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Features Grid */}
            <section id="features-section" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <SpotlightCard className="p-8 group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-primary shadow-[0_0_20px_rgba(0,245,255,0.1)]">
                  <Terminal />
                </div>
                <h4 className="text-xl font-bold mb-3">AI Security Audit</h4>
                <p className="text-white/40 leading-relaxed text-sm">Deep-dive analysis of token dynamics using state-of-the-art LLMs.</p>
              </SpotlightCard>
              <SpotlightCard className="p-8 group">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-secondary shadow-[0_0_20px_rgba(112,0,255,0.1)]">
                  <BarChart3 />
                </div>
                <h4 className="text-xl font-bold mb-3">Fee Transparency</h4>
                <p className="text-white/40 leading-relaxed text-sm">Real-time monitoring of the 1% creator fee distribution network.</p>
              </SpotlightCard>
              <SpotlightCard className="p-8 group">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-accent shadow-[0_0_20px_rgba(255,0,229,0.1)]">
                  <Cpu />
                </div>
                <h4 className="text-xl font-bold mb-3">Bags Integration</h4>
                <p className="text-white/40 leading-relaxed text-sm">Direct integration with Bags State Program for authentic data.</p>
              </SpotlightCard>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 bg-black/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">Bags Hackathon 2026</span>
          </div>
          <div className="flex gap-8 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
            <a href="#" className="hover:text-primary transition-colors no-underline">Terms</a>
            <a href="#" className="hover:text-primary transition-colors no-underline">Privacy</a>
            <a href="https://docs.bags.fm/" className="hover:text-primary transition-colors no-underline">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
