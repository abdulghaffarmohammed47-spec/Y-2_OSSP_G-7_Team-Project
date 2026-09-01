import React, { useState } from 'react';
import { api } from '../services/api';
import { TraceResult, SyscallItem, ExplainResponse } from '../types';
import { 
  GitCommit, Play, Loader2, ArrowRight, User, Terminal, Cpu,
  CheckCircle, Info, Activity, ChevronDown, ChevronUp, BookOpen, 
  LayoutList, Server, Search, Check, AlertTriangle, List, Compass
} from 'lucide-react';

const TimelineEvent = ({ s, idx }: { s: SyscallItem; idx: number }) => {
  const [techOpen, setTechOpen] = useState(false);
  
  return (
    <div className={`p-4 rounded-xl flex items-start gap-4 relative overflow-hidden group border shadow-sm transition-colors ${
      s.importance === 'CORE' ? 'bg-navy-900 border-cyan-500/30' : 
      s.importance === 'RELEVANT' ? 'bg-navy-900/80 border-navy-700' : 
      'bg-navy-950/50 border-navy-800/50 opacity-70'
    }`}>
      {s.importance === 'CORE' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500" />}
      {s.importance === 'RELEVANT' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-500" />}
      
      <div className="mt-1">
        <Activity className={`w-5 h-5 ${
          s.importance === 'CORE' ? 'text-cyan-400' : 
          s.importance === 'RELEVANT' ? 'text-violet-400' : 'text-slate-500'
        }`} />
      </div>

      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 font-mono">#{idx + 1}</span>
            <span className={`font-bold text-sm ${s.importance === 'CORE' ? 'text-slate-100' : 'text-slate-300'}`}>
              {s.simple_explanation || s.syscall}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-navy-800 text-slate-400 border border-navy-700 font-medium tracking-wide">
              {s.category}
            </span>
            {s.os_concept && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 font-medium tracking-wide">
                {s.os_concept}
              </span>
            )}
          </div>
        </div>

        {s.why && (
          <div className="text-xs text-slate-400 bg-navy-950/40 p-2 rounded border border-navy-800/50">
            <span className="font-bold text-slate-500 mr-2">Why?</span> {s.why}
          </div>
        )}

        <div>
          <button 
            onClick={() => setTechOpen(!techOpen)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            {techOpen ? 'Hide Technical Details' : 'Show Technical Details'}
          </button>
        </div>

        {techOpen && (
          <div className="mt-2 p-3 bg-[#0d1117] rounded-lg border border-navy-800/80 text-xs font-mono">
            <div className="text-slate-400 mb-2 border-b border-navy-800 pb-2 flex justify-between">
              <span>RAW SYSTEM CALL</span>
              <span>{s.importance}</span>
            </div>
            <div className="text-slate-300 break-all leading-relaxed">
              <span className="text-pink-400 font-bold">{s.syscall}</span>
              <span className="text-slate-500">(</span>
              <span className="text-amber-300">{s.args}</span>
              <span className="text-slate-500">)</span>
              <span className="text-slate-500 mx-2">=</span>
              <span className={s.result.includes('-1') || s.result.includes('ENOENT') ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {s.result}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TraceView: React.FC = () => {
  const [cmdInput, setCmdInput] = useState('ls -la');
  const [loading, setLoading] = useState(false);
  const [explainRes, setExplainRes] = useState<ExplainResponse | null>(null);
  const [traceRes, setTraceRes] = useState<TraceResult | null>(null);
  const [showBackground, setShowBackground] = useState(false);
  
  const examples = [
    "Find all C files",
    "ls | grep .c",
    "mkdir test && cd test",
    "pwd"
  ];

  const handleAnalyze = async (queryOverride?: string) => {
    const q = queryOverride || cmdInput;
    if (!q) return;
    setCmdInput(q);
    setLoading(true);
    setExplainRes(null);
    setTraceRes(null);
    
    try {
      // 1. Get simple explanation from LLM
      const explanation = await api.explainCommand(q);
      setExplainRes(explanation);
      
      // 2. Actually run and trace the command using our C Engine
      if (explanation.generated_command) {
        const trace = await api.traceCommand(explanation.generated_command);
        setTraceRes(trace);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const visibleSyscalls = traceRes?.syscalls.filter(s => showBackground ? true : s.importance !== 'BACKGROUND') || [];

  return (
    <div className="space-y-6 text-sm max-w-6xl mx-auto pb-12">
      {/* Header and Input */}
      <div className="bg-navy-900 border border-navy-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3 relative z-10">
          <Compass className="w-7 h-7 text-violet-400" />
          OS Learning & Observability
        </h1>
        <p className="text-slate-400 text-sm mt-2 relative z-10 max-w-2xl">
          Enter a command or a natural language question to see exactly how the Shell and Linux Kernel execute it behind the scenes.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Ask a question or enter a command..."
            className="flex-1 bg-navy-950/80 border border-navy-600 rounded-xl px-5 py-3 text-slate-100 focus:outline-none focus:border-violet-500 shadow-inner text-sm"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>Analyze</span>
          </button>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-2 relative z-10 text-xs">
          <span className="text-slate-500 font-medium">Try asking:</span>
          {examples.map(ex => (
            <button 
              key={ex} 
              onClick={() => handleAnalyze(ex)}
              className="bg-navy-800 hover:bg-navy-700 text-slate-300 px-3 py-1.5 rounded-full border border-navy-600 transition-colors"
            >
              "{ex}"
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
          <p>Analyzing intent and tracing OS execution...</p>
        </div>
      )}

      {explainRes && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Left Column: Explanations */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Section: What You Asked & Quick Answer */}
            <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Quick Answer</h2>
              <div className="text-lg font-bold text-slate-100 mb-2">
                {explainRes.summary}
              </div>
              <div className="mt-4 p-3 bg-navy-950 rounded-lg border border-navy-800 text-sm">
                <div className="text-slate-500 text-xs mb-1">Generated Command:</div>
                <div className="font-mono text-cyan-400 break-all">{explainRes.generated_command}</div>
              </div>
            </div>

            {/* Section: Command Breakdown */}
            <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-5 shadow-lg">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <List className="w-4 h-4" />
                Command Breakdown
              </h2>
              <div className="space-y-3">
                {explainRes.breakdown.map((b, i) => (
                  <div key={i} className="flex flex-col gap-1 border-l-2 border-navy-700 pl-3 py-1">
                    <span className="font-mono font-bold text-cyan-300">{b.part}</span>
                    <span className="text-slate-400 text-xs">{b.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Section: OS Concepts */}
            <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-5 shadow-lg">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Concepts Explored
              </h2>
              <div className="flex flex-wrap gap-2">
                {explainRes.concepts.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-violet-500/10 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Execution Journey & Tracing */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section: Execution Journey */}
            <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-6 shadow-lg">
               <h2 className="text-sm font-bold text-slate-200 mb-6 flex items-center gap-2">
                  <RouteIcon />
                  OS Execution Flow
               </h2>
               <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-center mb-8">
                  <FlowBox icon={<User className="w-4 h-4"/>} label="User" color="text-slate-300" border="border-slate-600" />
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:block" />
                  <FlowBox icon={<Terminal className="w-4 h-4"/>} label="ShellForge" color="text-cyan-400" border="border-cyan-500/40" />
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:block" />
                  <FlowBox icon={<GitCommit className="w-4 h-4"/>} label="fork / exec" color="text-violet-400" border="border-violet-500/40" />
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:block" />
                  <FlowBox icon={<Cpu className="w-4 h-4"/>} label="Linux Kernel" color="text-emerald-400" border="border-emerald-500/40" bg="bg-emerald-950/30" />
               </div>
               
               <div className="space-y-3 bg-navy-950 p-4 rounded-xl border border-navy-800">
                  {explainRes.os_flow.map((step, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-navy-800 border border-navy-600 flex items-center justify-center text-[10px] font-bold text-slate-400 mt-0.5">
                        {i + 1}
                      </div>
                      <div className="text-slate-300">{step}</div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Section: System Call Trace */}
            <div className="bg-navy-800/40 border border-navy-700/60 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-navy-900 p-5 border-b border-navy-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-slate-200 font-bold">
                  <LayoutList className="w-5 h-5 text-cyan-400" />
                  Relevant System Activity
                </div>
                
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showBackground}
                    onChange={(e) => setShowBackground(e.target.checked)}
                    className="rounded border-navy-600 bg-navy-950 text-cyan-500 focus:ring-cyan-500"
                  />
                  Show Background/Loader Activity
                </label>
              </div>

              <div className="p-4 bg-navy-950/30">
                {traceRes ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {visibleSyscalls.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 text-sm">
                        No system calls captured or matching filter.
                      </div>
                    ) : (
                      visibleSyscalls.map((s, idx) => (
                        <TimelineEvent key={idx} s={s} idx={idx} />
                      ))
                    )}
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center relative overflow-hidden rounded-xl bg-navy-950/50 border border-cyan-900/30 shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none"></div>
                    
                    <div className="relative flex items-center justify-center mb-8 mt-4">
                      <div className="absolute -inset-4 border border-cyan-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                      <div className="absolute -inset-8 border border-violet-500/20 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" style={{ animationDelay: '500ms' }}></div>
                      <div className="w-16 h-16 bg-navy-900 border border-cyan-500/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.4)] z-10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors"></div>
                        <Activity className="w-8 h-8 text-cyan-400 animate-pulse relative z-10" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center z-10">
                      <div className="text-cyan-400 font-bold tracking-widest text-sm mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                        INTERCEPTING SYSTEM CALLS
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                      </div>
                      <div className="text-slate-500 text-xs font-mono flex items-center gap-2 bg-navy-900/80 px-3 py-1.5 rounded border border-navy-800">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                        Analyzing OS Kernel Execution flow...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* What Just Happened? */}
            {explainRes.result && (
              <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-xl p-5 shadow-lg flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-400 mb-1">What Just Happened?</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">{explainRes.result}</p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const FlowBox = ({ icon, label, color, border, bg = 'bg-navy-950' }: { icon: React.ReactNode, label: string, color: string, border: string, bg?: string }) => (
  <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${border} ${bg} min-w-[90px] shadow-sm`}>
    <div className={`mb-2 ${color}`}>{icon}</div>
    <span className="text-xs font-bold text-slate-300">{label}</span>
  </div>
);

const RouteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
    <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
  </svg>
);
