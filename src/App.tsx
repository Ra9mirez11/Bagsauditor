import { useState } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  BarChart3, 
  Search, 
  Cpu, 
  Activity,
  CheckCircle2,
  CodeXml
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
import { BagsService } from './services/bags';
import { simulateClaudeAudit } from './services/claude';

// Initialize service with a dummy key for demo
// In production, this would be an env variable or fetched from backend
const bagsService = new BagsService("DEMO_KEY");

// Mock types for Bags API
interface TokenAudit {
  name: string;
  symbol: string;
  safetyScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  vulnerabilities: string[];
  ownerStatus: string;
  liquidityStatus: string;
  claimEvents?: any[];
}

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<TokenAudit | null>(null);

  const runAudit = async () => {
    if (!searchQuery) return;
    setIsAuditing(true);
    setAuditResult(null);
    
    try {
      // Try to call the real backend API
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_mint: searchQuery })
      });

      if (response.ok) {
        const data = await response.json();
          setAuditResult({
            name: data.name || (searchQuery.length > 15 ? 'SOLANA TOKEN' : searchQuery.toUpperCase()),
            symbol: data.symbol || searchQuery.substring(0, 4).toUpperCase(),
            safetyScore: data.safetyScore,
            riskLevel: data.riskLevel,
            vulnerabilities: data.vulnerabilities,
            ownerStatus: 'Verified Standard',
            liquidityStatus: `${(data.fees / 1e9).toFixed(2)} SOL Generated`,
            claimEvents: data.claimEvents
          });
        } else {
          throw new Error('Backend not available or failed');
        }
      } catch (error) {
        console.warn("Backend failed, falling back to local simulation:", error);
        // Fallback to local simulation
        const data = await bagsService.auditToken(searchQuery);
        const aiAnalysis = await simulateClaudeAudit(data);
        
        // Generate dummy events for simulation
        const dummyEvents = Array.from({ length: 12 }).map((_, i) => ({
          timestamp: Date.now() - (12 - i) * 24 * 60 * 60 * 1000,
          amount: Math.random() * 5 + 1
        }));

        setAuditResult({
          name: searchQuery.length > 15 ? 'SOLANA TOKEN' : searchQuery.toUpperCase(),
          symbol: searchQuery.substring(0, 4).toUpperCase(),
          safetyScore: data.safetyScore,
          riskLevel: data.riskLevel as 'Low' | 'Medium' | 'High',
          vulnerabilities: aiAnalysis.insights,
          ownerStatus: 'Simulation Mode',
          liquidityStatus: `${(data.fees / 1e9).toFixed(2)} SOL Generated`,
          claimEvents: dummyEvents
        });
      } finally {
        setIsAuditing(false);
      }
    };

  return (
    <div className="min-h-screen font-sans selection:bg-primary/30">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 -z-10 bg-background overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-cyan">
              <ShieldCheck className="text-background w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">BAGS<span className="text-primary">AUDITOR</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-primary transition-colors">Analyzer</a>
            <a href="#" className="hover:text-primary transition-colors">Fee Tracker</a>
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <div className="h-4 w-px bg-white/10" />
            <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all">
              <CodeXml className="w-4 h-4" />
              <span>GitHub</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          
          {/* Hero Section */}
          <section className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-widest mb-6">
                <Activity className="w-3 h-3 animate-pulse" />
                AI-Powered Security Sentinel
              </span>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 tracking-tighter leading-tight">
                Secure Your <span className="text-gradient">Bags</span> <br /> 
                with Claude AI.
              </h1>
              <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                Autonomous security audits for Solana's premier creator tokens. Detect scams, analyze fee distributions, and trade with confidence.
              </p>
            </motion.div>
          </section>

          {/* Audit Search */}
          <section className="mb-20">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass p-2 rounded-3xl glow-cyan-hover group transition-all max-w-2xl mx-auto"
            >
              <div className="flex items-center gap-2">
                <div className="pl-4">
                  <Search className="w-5 h-5 text-white/40" />
                </div>
                <input 
                  type="text" 
                  placeholder="Enter Creator Token Address or Name..." 
                  className="w-full bg-transparent border-none focus:ring-0 py-4 text-lg placeholder:text-white/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runAudit()}
                />
                <button 
                  onClick={runAudit}
                  disabled={isAuditing}
                  className="bg-primary hover:bg-primary/80 text-background px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isAuditing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                      <span>Auditing...</span>
                    </>
                  ) : (
                    <span>Audit Now</span>
                  )}
                </button>
              </div>
            </motion.div>
          </section>

          {/* Audit Results (Conditional) */}
          <AnimatePresence>
            {auditResult && (
              <>
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center group">
                    <div className="text-sm font-bold text-white/40 uppercase mb-4">Safety Score</div>
                    <div className={`text-7xl font-bold ${auditResult.safetyScore > 80 ? 'text-success' : 'text-warning'}`}>{auditResult.safetyScore}</div>
                    <div className="text-sm font-medium mt-2 text-white/60">Verified by Claude-3.5</div>
                  </div>
                  <div className="md:col-span-2 glass p-8 rounded-3xl">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{auditResult.name}</h3>
                        <p className="text-primary font-mono text-sm">${auditResult.symbol}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-success/10 border border-success/20 text-xs font-bold text-success uppercase">Secure</span>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">BAGS V2</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {auditResult.vulnerabilities.map((v, i) => (
                        <div key={i} className="flex items-center gap-3 text-white/80">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                          <span>{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 pt-8 border-t border-white/5 flex gap-8">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-white/30 mb-1">Ownership</div>
                        <div className="text-sm font-medium text-white/80">{auditResult.ownerStatus}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-white/30 mb-1">Liquidity</div>
                        <div className="text-sm font-medium text-white/80">{auditResult.liquidityStatus}</div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Fee Visualization Chart */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: 0.1 }}
                  className="glass p-8 rounded-3xl mb-20"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-xl font-bold">Fee Distribution Timeline</h4>
                      <p className="text-white/40 text-sm">Visualizing the 1% creator fee distribution (SOL)</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-white/40">
                        <div className="w-3 h-3 rounded-full bg-primary/40" />
                        <span>Claims</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={auditResult.claimEvents}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis 
                          dataKey="timestamp" 
                          hide 
                        />
                        <YAxis 
                          stroke="#ffffff20" 
                          fontSize={12} 
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ color: '#22d3ee' }}
                          labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#22d3ee" 
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Features Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl glass-hover group">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Terminal className="text-primary w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-3">Claude Integration</h4>
              <p className="text-white/40 leading-relaxed">
                Utilizes Claude 3.5 Sonnet to perform deep-dive analysis of token dynamics and social sentiment.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl glass-hover group">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="text-secondary w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-3">Fee Visualization</h4>
              <p className="text-white/40 leading-relaxed">
                Real-time tracking of the 1% creator fee and distribution metrics for community holders.
              </p>
            </div>

            <div className="glass p-8 rounded-3xl glass-hover group">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="text-accent w-6 h-6" />
              </div>
              <h4 className="text-xl font-bold mb-3">Autonomous Agents</h4>
              <p className="text-white/40 leading-relaxed">
                Deploy agents that automatically claim fees and re-invest into high-safety creator pools.
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-40">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-medium tracking-widest uppercase">Bags Hackathon 2026 Submission</span>
          </div>
          <div className="flex gap-6 text-xs font-bold text-white/30 uppercase tracking-widest">
            <a href="#" className="hover:text-primary">Terms</a>
            <a href="#" className="hover:text-primary">Privacy</a>
            <a href="#" className="hover:text-primary">Bags API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
