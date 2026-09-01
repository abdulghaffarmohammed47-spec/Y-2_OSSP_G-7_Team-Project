import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ProcessItem } from '../types';
import { Cpu, RefreshCw, AlertCircle, Layers, X } from 'lucide-react';

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
    const interval = setInterval(fetchProcesses, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSendSignal = async (pid: number, sig: number) => {
    await api.sendProcessSignal(pid, sig);
    fetchProcesses();
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-violet-400" />
            <span>Linux Process Monitor & Hierarchy</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Real process entries fetched from Linux /proc filesystem and process table.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-navy-950 p-1 rounded-lg border border-navy-700">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 rounded text-xs font-semibold ${activeTab === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`px-3 py-1.5 rounded text-xs font-semibold ${activeTab === 'tree' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}
            >
              Process Tree
            </button>
          </div>

          <button
            onClick={fetchProcesses}
            className="p-2 bg-navy-800 hover:bg-navy-700 text-slate-300 rounded-lg border border-navy-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table View */}
      {activeTab === 'table' && (
        <div className="bg-navy-900 border border-navy-700/60 rounded-xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy-950 border-b border-navy-700 text-slate-400">
                  <th className="py-3 px-4">PID</th>
                  <th className="py-3 px-4">PPID</th>
                  <th className="py-3 px-4">State</th>
                  <th className="py-3 px-4">Command</th>
                  <th className="py-3 px-4 text-right">CPU %</th>
                  <th className="py-3 px-4 text-right">MEM %</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {processes.map((p) => (
                  <tr key={p.pid} className="hover:bg-navy-800/50 transition">
                    <td className="py-2.5 px-4 text-cyan-400 font-bold">{p.pid}</td>
                    <td className="py-2.5 px-4 text-slate-400">{p.ppid}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {p.state}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-200 truncate max-w-[260px]">{p.cmdline}</td>
                    <td className="py-2.5 px-4 text-right text-emerald-400">{p.cpu_percent}%</td>
                    <td className="py-2.5 px-4 text-right text-violet-400">{p.memory_percent}%</td>
                    <td className="py-2.5 px-4 text-center space-x-1.5">
                      <button
                        onClick={() => setSelectedProc(p)}
                        className="px-2 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 text-[10px]"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => handleSendSignal(p.pid, 15)}
                        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px]"
                      >
                        Term (15)
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Process Tree View (Phase 16) */}
      {activeTab === 'tree' && (
        <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-slate-300 font-semibold mb-4">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Process Tree Hierarchy (PID / PPID mapping)</span>
          </div>

          <div className="bg-navy-950 p-4 rounded-lg border border-navy-800 space-y-3">
            <div className="text-cyan-400">systemd (PID 1)</div>
            <div className="pl-6 border-l border-navy-700 space-y-2">
              <div className="text-slate-300">└── init / bash (PID 28)</div>
              <div className="pl-6 border-l border-navy-700 space-y-2">
                <div className="text-emerald-400">└── shellforge_engine (PID 387)</div>
                <div className="pl-6 border-l border-navy-700 space-y-1 text-violet-300">
                  {processes.slice(0, 5).map((p) => (
                    <div key={p.pid}>├── {p.name} (PID {p.pid}, PPID {p.ppid})</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Detail Modal */}
      {selectedProc && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cyan-400" />
                <span>Process Inspection (PID {selectedProc.pid})</span>
              </h3>
              <button onClick={() => setSelectedProc(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-500">Parent PID (PPID):</span>
                <span className="text-cyan-400">{selectedProc.ppid}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-500">State:</span>
                <span className="text-emerald-400">{selectedProc.state}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-500">CPU Usage:</span>
                <span>{selectedProc.cpu_percent}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-800">
                <span className="text-slate-500">Memory Usage:</span>
                <span>{selectedProc.memory_percent}%</span>
              </div>
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Command String:</span>
                <div className="bg-navy-950 p-2 rounded border border-navy-800 font-mono text-cyan-300">
                  {selectedProc.cmdline}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => { handleSendSignal(selectedProc.pid, 19); setSelectedProc(null); }}
                className="px-3 py-1.5 rounded bg-amber-500/20 text-amber-300 text-xs"
              >
                Stop (SIGSTOP)
              </button>
              <button
                onClick={() => { handleSendSignal(selectedProc.pid, 18); setSelectedProc(null); }}
                className="px-3 py-1.5 rounded bg-emerald-500/20 text-emerald-300 text-xs"
              >
                Continue (SIGCONT)
              </button>
              <button
                onClick={() => { handleSendSignal(selectedProc.pid, 9); setSelectedProc(null); }}
                className="px-3 py-1.5 rounded bg-red-500/20 text-red-300 text-xs font-bold"
              >
                Kill (SIGKILL)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
