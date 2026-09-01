import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { JobItem } from '../types';
import { Activity, Play, XCircle, TerminalSquare, AlertCircle, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const JobsView: React.FC = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await api.getJobs();
        setJobs(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchJobs();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-elevated border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center gap-3 relative z-10">
          <Activity className="w-7 h-7 text-cyan-400" />
          Background Job Control & Concurrent Processes
        </h1>
        <p className="text-slate-400 text-sm mt-2 relative z-10 max-w-2xl font-mono">
          Monitor jobs started with the <code className="text-cyan-300 font-bold bg-workspace px-1 rounded">&amp;</code> operator or managed via <code className="text-violet-300 font-bold bg-workspace px-1 rounded">fg</code>, <code className="text-violet-300 font-bold bg-workspace px-1 rounded">bg</code>, and <code className="text-emerald-300 font-bold bg-workspace px-1 rounded">waitpid</code> synchronization.
        </p>
      </div>

      {/* Main Content */}
      <div className="bg-elevated border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm relative">
        <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {jobs.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 relative z-10">
             <div className="w-16 h-16 rounded-full bg-workspace flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
               <AlertCircle className="w-8 h-8 text-slate-500" />
             </div>
             <p className="text-sm font-bold text-slate-400 font-mono">No active background jobs.</p>
             <p className="text-xs mt-1 text-slate-500 font-mono">Run a command with '&' to start a background job.</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse font-mono">
              <thead>
                <tr className="bg-workspace/80 border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 font-bold">Job ID</th>
                  <th className="py-4 px-6 font-bold">PID</th>
                  <th className="py-4 px-6 font-bold">State</th>
                  <th className="py-4 px-6 font-bold">Command</th>
                  <th className="py-4 px-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {jobs.map((j) => (
                  <tr key={j.job_id} className="hover:bg-workspace transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                          <TerminalSquare className="w-4 h-4 text-cyan-400" />
                        </div>
                        <span className="text-cyan-400 font-bold text-sm">[{j.job_id}]</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-300 text-sm bg-workspace px-2.5 py-1 rounded-md border border-slate-700">{j.pid}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        {j.state === 'RUNNING' && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                        {j.state === 'STOPPED' && <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />}
                        {j.state === 'DONE' && <span className="w-2 h-2 rounded-full bg-slate-400" />}
                        
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                          j.state === 'RUNNING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          j.state === 'STOPPED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                          'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}>
                          {j.state}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{j.command}</span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 hover:scale-105 active:scale-95 transition-all border border-cyan-500/20 shadow-sm">
                          <Zap className="w-3.5 h-3.5" />
                          fg
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-bold hover:bg-violet-500/20 hover:scale-105 active:scale-95 transition-all border border-violet-500/20 shadow-sm">
                          <Play className="w-3.5 h-3.5" />
                          bg
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-bold hover:bg-rose-500/20 hover:scale-105 active:scale-95 transition-all border border-rose-500/20 shadow-sm">
                          <XCircle className="w-3.5 h-3.5" />
                          Kill
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};
