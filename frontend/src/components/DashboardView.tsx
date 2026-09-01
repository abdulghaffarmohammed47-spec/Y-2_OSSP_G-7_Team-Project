import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SystemStats, HistoryItem, ProcessItem } from '../types';
import { Cpu, HardDrive, Server, Activity, Terminal, ShieldCheck } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const s = await api.getSystemStats();
        setStats(s);
        const h = await api.getHistory();
        setHistory(h.slice(0, 5));
        const p = await api.getProcesses();
        setProcesses(p.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 border border-navy-700/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors duration-500">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/20 to-transparent pointer-events-none group-hover:from-cyan-400/30 transition-all duration-700" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center gap-3">
              <span>Linux Systems Telemetry & Control</span>
              <span className="text-xs font-bold px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono animate-pulse">
                REAL KERNEL ENGINE
              </span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2">
              Live monitoring of POSIX sub-processes, system memory, intent validation, and C engine executions.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-navy-950 px-4 py-2.5 rounded-xl border border-navy-700 font-mono text-xs md:text-sm text-slate-200 shadow-inner">
            <Server className="w-5 h-5 text-cyan-400 animate-float" />
            <span className="font-semibold">{stats?.kernel || 'Linux WSL2 Ubuntu'}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CPU */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">CPU Utilization</span>
            <div className="p-2.5 bg-cyan-500/15 rounded-xl text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">{stats ? `${stats.cpu_percent}%` : '--'}</span>
            <span className="text-xs md:text-sm font-mono text-cyan-400 font-bold">WSL Host</span>
          </div>
          <div className="w-full bg-navy-950 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-cyan-400 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(stats?.cpu_percent || 0, 100)}%` }} />
          </div>
        </div>

        {/* Memory */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Memory Allocation</span>
            <div className="p-2.5 bg-emerald-500/15 rounded-xl text-emerald-400">
              <HardDrive className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">{stats ? `${stats.memory_percent}%` : '--'}</span>
            <span className="text-xs md:text-sm font-mono text-slate-300 font-semibold">{stats ? `${stats.memory_used_mb} / ${stats.memory_total_mb} MB` : ''}</span>
          </div>
          <div className="w-full bg-navy-950 rounded-full h-2 mt-4 overflow-hidden">
            <div className="bg-emerald-400 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(stats?.memory_percent || 0, 100)}%` }} />
          </div>
        </div>

        {/* Active Processes */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Active Processes</span>
            <div className="p-2.5 bg-violet-500/15 rounded-xl text-violet-400">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">{stats ? stats.active_processes : '--'}</span>
            <span className="text-xs md:text-sm font-mono text-violet-400 font-bold">fork / exec</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">Monitored via /proc & ps API</p>
        </div>

        {/* Safety Guardrails */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 md:p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Safety Policy</span>
            <div className="p-2.5 bg-emerald-500/15 rounded-xl text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-extrabold text-emerald-400 font-mono">ACTIVE</span>
            <span className="text-xs md:text-sm font-mono text-slate-300 font-bold">Hardened</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">Destructive confirmation enabled</p>
        </div>

      </div>

      {/* Two Columns: Recent Commands & Active Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Commands Table */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Recent Executions</span>
            </h2>
            <span className="text-xs md:text-sm font-mono text-slate-400">{history.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs md:text-sm">
              <thead>
                <tr className="border-b border-navy-700 text-slate-400 font-bold">
                  <th className="py-3 px-3">Request</th>
                  <th className="py-3 px-3">Command</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {history.map((h, idx) => (
                  <tr key={idx} className="hover:bg-navy-800/60 transition">
                    <td className="py-3 px-3 text-slate-200 truncate max-w-[150px] font-medium">{h.user_request}</td>
                    <td className="py-3 px-3 text-cyan-400 truncate max-w-[180px] font-semibold">{h.generated_command}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        h.exit_code === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-400 text-sm">No commands executed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Telemetry */}
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base md:text-lg font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-violet-400" />
              <span>Process Activity</span>
            </h2>
            <span className="text-xs md:text-sm font-mono text-slate-400">Live /proc</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs md:text-sm">
              <thead>
                <tr className="border-b border-navy-700 text-slate-400 font-bold">
                  <th className="py-3 px-3">PID</th>
                  <th className="py-3 px-3">Command</th>
                  <th className="py-3 px-3 text-right">CPU %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {processes.map((p, idx) => (
                  <tr key={idx} className="hover:bg-navy-800/60 transition">
                    <td className="py-3 px-3 text-violet-400 font-bold">{p.pid}</td>
                    <td className="py-3 px-3 text-slate-200 truncate max-w-[200px]">{p.cmdline}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">{p.cpu_percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
