import React, { useState } from 'react';
import { api } from '../services/api';
import { TraceResult, SyscallItem, ExplainResponse } from '../types';
import { 
  GitCommit, Play, Loader2, ArrowRight, User, Terminal, Cpu,
  CheckCircle, Info, Activity, ShieldAlert, List, Compass,
  Database, Network, Layers, Code, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MemorySegmentVisualizer = () => (
  <div className="bg-elevated p-4 rounded-xl border border-slate-800 space-y-4">
    <div className="flex items-center gap-2 text-slate-300 font-bold mb-2">
      <Database className="w-5 h-5 text-cyan-400" />
      Virtual Memory Space Layout
    </div>
    <div className="w-full h-8 flex rounded-md overflow-hidden font-mono text-[10px] font-bold text-workspace shadow-inner">
      <div className="bg-cyan-400 flex items-center justify-center relative group" style={{ width: '15%' }}>
        .text
        <div className="absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap bg-elevated border border-slate-700 text-slate-300 px-2 py-1 rounded">0x00400000 (Exec code)</div>
      </div>
      <div className="bg-emerald-400 flex items-center justify-center relative group" style={{ width: '10%' }}>
        .data
        <div className="absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap bg-elevated border border-slate-700 text-slate-300 px-2 py-1 rounded">0x00600000 (Init vars)</div>
      </div>
      <div className="bg-violet-400 flex items-center justify-center relative group" style={{ width: '25%' }}>
        Heap
        <div className="absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap bg-elevated border border-slate-700 text-slate-300 px-2 py-1 rounded">0x00800000 (brk/mmap)</div>
      </div>
      <div className="bg-slate-800 flex items-center justify-center text-slate-500" style={{ width: '20%' }}>
        Free Space
      </div>
      <div className="bg-amber-400 flex items-center justify-center relative group" style={{ width: '15%' }}>
        Shared Libs
        <div className="absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap bg-elevated border border-slate-700 text-slate-300 px-2 py-1 rounded">0x7F... (libc.so)</div>
      </div>
      <div className="bg-rose-400 flex items-center justify-center relative group" style={{ width: '15%' }}>
        Stack
        <div className="absolute bottom-full mb-1 hidden group-hover:block whitespace-nowrap bg-elevated border border-slate-700 text-slate-300 px-2 py-1 rounded">0x7FF... (Growth ↓)</div>
      </div>
    </div>
  </div>
);

const FDTopologyGraph = () => (
  <div className="bg-elevated p-4 rounded-xl border border-slate-800">
    <div className="flex items-center gap-2 text-slate-300 font-bold mb-4">
      <Network className="w-5 h-5 text-emerald-400" />
      File Descriptor Topology
    </div>
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-workspace border border-slate-700 p-3 rounded-lg flex flex-col items-center">
        <span className="text-cyan-400 font-bold font-mono text-sm">fd 0</span>
        <span className="text-xs text-slate-400">stdin</span>
        <ArrowRight className="w-4 h-4 text-slate-600 my-1 rotate-90" />
        <span className="text-xs font-mono text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded">/dev/pts/0</span>
      </div>
      <div className="bg-workspace border border-slate-700 p-3 rounded-lg flex flex-col items-center">
        <span className="text-cyan-400 font-bold font-mono text-sm">fd 1</span>
        <span className="text-xs text-slate-400">stdout</span>
        <ArrowRight className="w-4 h-4 text-slate-600 my-1 rotate-90" />
        <span className="text-xs font-mono text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded">/dev/pts/0</span>
      </div>
      <div className="bg-workspace border border-slate-700 p-3 rounded-lg flex flex-col items-center">
        <span className="text-cyan-400 font-bold font-mono text-sm">fd 2</span>
        <span className="text-xs text-slate-400">stderr</span>
        <ArrowRight className="w-4 h-4 text-slate-600 my-1 rotate-90" />
        <span className="text-xs font-mono text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded">/dev/pts/0</span>
      </div>
    </div>
  </div>
);

const SyscallModal = ({ s, onClose }: { s: SyscallItem, onClose: () => void }) => {
  const [mode, setMode] = useState<'beginner' | 'intermediate' | 'tech'>('tech');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-workspace/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-elevated border border-slate-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-workspace/50">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Activity className="w-5 h-5 text-cyan-400" />
            {s.syscall}() Details
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition"><X className="w-5 h-5" /></button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {/* Mode Tabs */}
          <div className="flex bg-workspace border border-slate-800 rounded-lg p-1 w-fit mb-6">
            <button onClick={() => setMode('beginner')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'beginner' ? 'bg-cyan-500 text-workspace' : 'text-slate-500 hover:text-slate-300'}`}>Beginner</button>
            <button onClick={() => setMode('intermediate')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'intermediate' ? 'bg-cyan-500 text-workspace' : 'text-slate-500 hover:text-slate-300'}`}>Intermediate</button>
            <button onClick={() => setMode('tech')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${mode === 'tech' ? 'bg-cyan-500 text-workspace' : 'text-slate-500 hover:text-slate-300'}`}>Kernel Technical</button>
          </div>

          <div className="bg-workspace p-4 rounded-xl border border-slate-800 text-slate-300 text-sm leading-relaxed mb-6 font-mono">
            {mode === 'beginner' && (
              <div>
                <p className="text-cyan-300 font-bold mb-2">What does this do in plain English?</p>
                <p>{s.simple_explanation || `The OS executed the ${s.syscall} action.`}</p>
              </div>
            )}
            {mode === 'intermediate' && (
              <div>
                <p className="text-violet-300 font-bold mb-2">POSIX / OS Concept mapping:</p>
                <p className="mb-2"><strong>Category:</strong> {s.category}</p>
                <p>{s.why || 'This syscall is part of standard process/filesystem management.'}</p>
              </div>
            )}
            {mode === 'tech' && (
              <div>
                <p className="text-emerald-300 font-bold mb-2">Raw execution details:</p>
                <div className="bg-elevated p-3 rounded border border-slate-700">
                  <span className="text-pink-400">{s.syscall}</span>
                  <span className="text-slate-500">(</span>
                  <span className="text-amber-300">{s.args}</span>
                  <span className="text-slate-500">) = </span>
                  <span className={s.result.includes('-1') ? 'text-red-400' : 'text-emerald-400'}>{s.result}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const TraceView: React.FC = () => {
  const [cmdInput, setCmdInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [explainRes, setExplainRes] = useState<ExplainResponse | null>(null);
  const [traceRes, setTraceRes] = useState<TraceResult | null>(null);
  const [activeModalSyscall, setActiveModalSyscall] = useState<SyscallItem | null>(null);
  
  const handleAnalyze = async (queryOverride?: string) => {
    const q = queryOverride || cmdInput;
    if (!q) return;
    setCmdInput(q);
    setLoading(true);
    setExplainRes(null);
    setTraceRes(null);
    
    try {
      const explanation = await api.explainCommand(q);
      setExplainRes(explanation);
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

  return (
    <div className="space-y-6 text-sm mx-auto pb-12">
      {/* Search Header */}
      <div className="bg-elevated/80 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-violet-500/20 transition-colors" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 flex items-center gap-3 relative z-10">
          <Layers className="w-8 h-8 text-violet-400" />
          Execution Trace & Observability
        </h1>
        
        <div className="mt-6 flex flex-col sm:flex-row gap-3 relative z-10">
          <input
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter command to trace (e.g. ls -la, pwd)..."
            className="flex-1 bg-workspace/50 border border-slate-700 focus:border-violet-400/50 rounded-xl px-5 py-4 font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
          />
          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-workspace font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>Trace Execution</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-violet-500 mb-4" />
          <p className="font-mono text-xs">TRACING SYSCALLS & GENERATING AST...</p>
        </div>
      )}

      {explainRes && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          
          {/* 6 Horizontal Flow Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center text-xs font-bold font-mono">
            <div className="bg-elevated border border-cyan-500/30 rounded-lg p-3 text-cyan-300 shadow-cyan-glow">1. Query</div>
            <div className="bg-elevated border border-cyan-500/30 rounded-lg p-3 text-cyan-300 shadow-cyan-glow">2. Intent</div>
            <div className="bg-elevated border border-emerald-500/30 rounded-lg p-3 text-emerald-300 shadow-emerald-glow">3. Command</div>
            <div className="bg-elevated border border-amber-500/30 rounded-lg p-3 text-amber-300 shadow-amber-glow">4. Safety</div>
            <div className="bg-elevated border border-violet-500/30 rounded-lg p-3 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.2)]">5. C Engine</div>
            <div className="bg-elevated border border-rose-500/30 rounded-lg p-3 text-rose-300 shadow-red-glow">6. Kernel</div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MemorySegmentVisualizer />
            <FDTopologyGraph />
          </div>

          {/* Syscalls Grid */}
          <div className="bg-elevated border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Code className="w-5 h-5 text-cyan-400" />
              Intercepted System Calls
            </h2>
            
            {traceRes ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {traceRes.syscalls.filter(s => s.importance !== 'BACKGROUND').map((s, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setActiveModalSyscall(s)}
                    className="bg-workspace border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl cursor-pointer transition-colors group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-cyan-400 font-bold">{s.syscall}()</span>
                        <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{s.category}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">{s.simple_explanation || s.args}</p>
                    </div>
                    <div className="mt-3 text-right">
                      <span className={`text-xs font-mono font-bold ${s.result.includes('-1') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {s.result.includes('-1') ? 'ERR' : 'OK'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-10 font-mono text-xs">Waiting for trace execution...</div>
            )}
          </div>

        </motion.div>
      )}

      <AnimatePresence>
        {activeModalSyscall && (
          <SyscallModal s={activeModalSyscall} onClose={() => setActiveModalSyscall(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};
