import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ProcessItem } from '../types';
import { Cpu, RefreshCw, AlertCircle, Layers, X, Activity, Play, Square, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProcessTreeItem = ({ process, allProcesses, depth = 0 }: { process: ProcessItem, allProcesses: ProcessItem[], depth?: number }) => {
  const children = allProcesses.filter(p => p.ppid === process.pid);
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="font-mono text-xs">
      <div 
        className={`flex items-center gap-3 py-1.5 px-2 hover:bg-slate-800/50 rounded cursor-pointer transition-colors ${depth === 0 ? 'text-cyan-400 font-bold' : 'text-slate-300'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ width: depth * 20 }} className="flex-shrink-0" />
        {children.length > 0 ? (
          <span className="text-slate-500 w-4 text-center">{expanded ? '▼' : '▶'}</span>
        ) : (
          <span className="w-4" />
        )}
        <span className="text-slate-500">[{process.pid}]</span>
        <span className="truncate">{process.name}</span>
        <span className="ml-auto text-emerald-400 text-[10px] bg-emerald-950/30 px-1.5 rounded">{process.state}</span>
      </div>
      
      {expanded && children.length > 0 && (
        <div className="border-l border-slate-800 ml-4">
          {children.map(child => (
            <ProcessTreeItem key={child.pid} process={child} allProcesses={allProcesses} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ProcessesView: React.FC = () => {
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [selectedProc, setSelectedProc] = useState<ProcessItem | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'tree'>('table');
  const [loading, setLoading] = useState(false);

  const fetchProcesses = async () => {
    setLoading(true);
    try {
      const data = await api.getProcesses();
      setProcesses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendSignal = async (pid: number, sig: number) => {
    await api.sendProcessSignal(pid, sig);
    fetchProcesses();
  };

  // Find root processes (processes whose PPID is not in the current list, usually PPID 0 or 1 or just the lowest)
  const processIds = new Set(processes.map(p => p.pid));
  const rootProcesses = processes.filter(p => !processIds.has(p.ppid));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-elevated/80 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none transition-colors" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center gap-3">
              <Cpu className="w-7 h-7 text-cyan-400" />
              Process Telemetry
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-mono">
              Live htop-style monitoring & signal routing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-workspace border border-slate-800 rounded-xl p-1 shadow-inner">
              <button
                onClick={() => setActiveTab('table')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'table' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Table View
              </button>
              <button
                onClick={() => setActiveTab('tree')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'tree' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Hierarchy Tree
              </button>
            </div>

            <button
              onClick={fetchProcesses}
              className="p-2.5 bg-workspace hover:bg-slate-800 text-cyan-400 rounded-xl border border-slate-800 transition shadow"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div 
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-elevated border border-slate-800 rounded-2xl shadow-xl overflow-hidden"
      >
        {activeTab === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-workspace/80 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <th className="py-4 px-6 font-mono">PID</th>
                  <th className="py-4 px-6 font-mono">PPID</th>
                  <th className="py-4 px-6">State</th>
                  <th className="py-4 px-6">Command</th>
                  <th className="py-4 px-6 text-right font-mono">CPU %</th>
                  <th className="py-4 px-6 text-right font-mono">MEM %</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm font-mono">
                {processes.map((p) => (
                  <tr key={p.pid} className="hover:bg-workspace transition-colors group">
                    <td className="py-3 px-6 text-cyan-400">{p.pid}</td>
                    <td className="py-3 px-6 text-slate-500">{p.ppid}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded-md text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                        {p.state}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-300 truncate max-w-[200px] xl:max-w-[400px] opacity-80 group-hover:opacity-100 transition-opacity">
                      {p.cmdline}
                    </td>
                    <td className="py-3 px-6 text-right text-emerald-400">{p.cpu_percent.toFixed(1)}%</td>
                    <td className="py-3 px-6 text-right text-violet-400">{p.memory_percent.toFixed(1)}%</td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => setSelectedProc(p)}
                        className="px-3 py-1.5 rounded-lg bg-workspace border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 text-xs transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tree' && (
          <div className="p-6">
            <div className="flex items-center gap-2 text-slate-400 font-semibold mb-6 text-sm uppercase tracking-wider">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Process Ancestry Map</span>
            </div>
            <div className="bg-workspace p-4 rounded-xl border border-slate-800 overflow-x-auto">
              {rootProcesses.length > 0 ? (
                rootProcesses.map(p => (
                  <ProcessTreeItem key={p.pid} process={p} allProcesses={processes} />
                ))
              ) : (
                <div className="text-slate-500 font-mono text-sm text-center py-10">No processes found.</div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {selectedProc && (
          <div className="fixed inset-0 bg-workspace/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-elevated border border-slate-700 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 relative z-10">
                <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2 font-mono">
                  <Hash className="w-5 h-5 text-cyan-400" />
                  PID {selectedProc.pid}
                </h3>
                <button onClick={() => setSelectedProc(null)} className="text-slate-500 hover:text-slate-300 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-300 font-mono relative z-10 mb-6">
                <div className="flex items-center justify-between p-3 bg-workspace rounded-lg border border-slate-800">
                  <span className="text-slate-500">Parent (PPID)</span>
                  <span className="text-cyan-400 font-bold">{selectedProc.ppid}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-workspace rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-xs mb-1">CPU Usage</span>
                    <span className="text-emerald-400 font-bold text-lg">{selectedProc.cpu_percent.toFixed(1)}%</span>
                  </div>
                  <div className="p-3 bg-workspace rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-xs mb-1">Memory</span>
                    <span className="text-violet-400 font-bold text-lg">{selectedProc.memory_percent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-3 bg-workspace rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-xs mb-2">Command Array</span>
                  <div className="text-slate-300 text-xs break-all bg-slate-900 p-2 rounded">
                    {selectedProc.cmdline}
                  </div>
                </div>
              </div>

              {/* Signals Array */}
              <div className="border-t border-slate-800 pt-4 relative z-10">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 block">POSIX Signals</span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => { handleSendSignal(selectedProc.pid, 19); setSelectedProc(null); }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
                  >
                    <Square className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">SIGSTOP (19)</span>
                  </button>
                  <button
                    onClick={() => { handleSendSignal(selectedProc.pid, 18); setSelectedProc(null); }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                  >
                    <Play className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">SIGCONT (18)</span>
                  </button>
                  <button
                    onClick={() => { handleSendSignal(selectedProc.pid, 9); setSelectedProc(null); }}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                  >
                    <X className="w-4 h-4 mb-1" />
                    <span className="text-[10px] font-bold">SIGKILL (9)</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
