import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SystemStats, HistoryItem, ProcessItem } from '../types';
import { Cpu, HardDrive, Server, Activity, Terminal, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export const DashboardView: React.FC = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsHistory, setStatsHistory] = useState<(SystemStats & { time: string })[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const s = await api.getSystemStats();
        setStats(s);
        setStatsHistory(prev => {
          const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          const newHistory = [...prev, { ...s, time: now }];
          return newHistory.length > 15 ? newHistory.slice(newHistory.length - 15) : newHistory;
        });
        
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-elevated border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none group-hover:from-cyan-400/20 transition-all duration-700" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center gap-3">
              <span>Linux Systems Telemetry & Control</span>
              <span className="text-xs font-bold px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono animate-pulse">
                REAL KERNEL ENGINE
              </span>
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-2 font-mono">
              Live monitoring of POSIX sub-processes, system memory, intent validation, and C engine executions.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-workspace px-4 py-2.5 rounded-xl border border-slate-700 font-mono text-xs md:text-sm text-slate-200 shadow-inner">
            <Server className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span className="font-semibold">{stats?.kernel || 'Linux WSL2 Ubuntu'}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CPU */}
        <div className="bg-elevated border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">CPU Utilization</span>
            <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between relative z-10">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">{stats ? `${stats.cpu_percent.toFixed(1)}%` : '--'}</span>
            <span className="text-xs md:text-sm font-mono text-cyan-400 font-bold">WSL Host</span>
          </div>
          <div className="w-full bg-workspace rounded-full h-2 mt-4 overflow-hidden relative z-10">
            <div className="bg-cyan-400 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${Math.min(stats?.cpu_percent || 0, 100)}%` }} />
          </div>
        </div>

        {/* Memory */}
        <div className="bg-elevated border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Memory Allocation</span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between relative z-10">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">{stats ? `${stats.memory_percent.toFixed(1)}%` : '--'}</span>
            <span className="text-xs font-mono text-slate-400 font-semibold">{stats ? `${stats.memory_used_mb} / ${stats.memory_total_mb} MB` : ''}</span>
          </div>
          <div className="w-full bg-workspace rounded-full h-2 mt-4 overflow-hidden relative z-10">
            <div className="bg-emerald-400 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${Math.min(stats?.memory_percent || 0, 100)}%` }} />
          </div>
        </div>

        {/* Active Processes */}
        <div className="bg-elevated border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Active Processes</span>
            <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between relative z-10">
            <span className="text-3xl md:text-4xl font-extrabold text-slate-100 font-mono">{stats ? stats.active_processes : '--'}</span>
            <span className="text-xs md:text-sm font-mono text-violet-400 font-bold">fork / exec</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono relative z-10">Monitored via /proc API</p>
        </div>

        {/* Safety Guardrails */}
        <div className="bg-elevated border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Safety Policy</span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between relative z-10">
            <span className="text-xl md:text-2xl font-extrabold text-amber-400 font-mono drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]">ENFORCING</span>
            <span className="text-xs md:text-sm font-mono text-slate-300 font-bold">Hardened</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono relative z-10">Destructive intent blocked</p>
        </div>

      </div>

      {/* Live System Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-elevated border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Live CPU Usage</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}%`} domain={[0, 100]} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Line type="monotone" dataKey="cpu_percent" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 5 }} name="CPU" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-elevated border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2.5 mb-4">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Live Memory Usage</h2>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={statsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickMargin={10} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}%`} domain={[0, 100]} fontFamily="monospace" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Line type="monotone" dataKey="memory_percent" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#0f172a', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Memory" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Commands & Active Processes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Commands Table */}
        <div className="bg-elevated border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2.5 font-mono">
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Recent Executions</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">{history.length} items</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Request</th>
                  <th className="py-3 px-3">Command</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((h, idx) => (
                  <tr key={idx} className="hover:bg-workspace transition">
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[150px] font-medium">{h.user_request}</td>
                    <td className="py-3 px-3 text-cyan-400 truncate max-w-[180px] font-semibold opacity-80">{h.generated_command}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        h.exit_code === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500 text-sm">No commands executed yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Telemetry */}
        <div className="bg-elevated border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2.5 font-mono">
              <Activity className="w-5 h-5 text-violet-400" />
              <span>Process Activity</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">Live /proc</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">PID</th>
                  <th className="py-3 px-3">Command</th>
                  <th className="py-3 px-3 text-right">CPU %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {processes.map((p, idx) => (
                  <tr key={idx} className="hover:bg-workspace transition group">
                    <td className="py-3 px-3 text-violet-400 font-bold">{p.pid}</td>
                    <td className="py-3 px-3 text-slate-300 truncate max-w-[200px] opacity-70 group-hover:opacity-100">{p.cmdline}</td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">{p.cpu_percent.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </motion.div>
  );
};
