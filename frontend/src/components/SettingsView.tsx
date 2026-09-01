import React from 'react';
import { Shield, Lock, AlertTriangle, Terminal, CheckCircle2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-6 shadow-xl">
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span>Safety Policies & Configuration</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Configure execution guardrails, dangerous command detection policies, and timeout limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Allowlist & Restrictions */}
        <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-5 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Supported Command Allowlist</span>
          </h2>
          <p className="text-slate-400 text-[11px]">
            Commands listed below are permitted for direct natural-language execution:
          </p>

          <div className="flex flex-wrap gap-1.5 bg-navy-950 p-3 rounded-lg border border-navy-800">
            {['ls', 'pwd', 'date', 'whoami', 'echo', 'ps', 'find', 'grep', 'cat', 'mkdir', 'cd', 'sleep', 'sort', 'head', 'tail', 'wc', 'uname', 'strace'].map((cmd) => (
              <span key={cmd} className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                {cmd}
              </span>
            ))}
          </div>
        </div>

        {/* Prohibited Administrative Commands */}
        <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-5 shadow-md space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Dangerous Operation Guardrails</span>
          </h2>
          <p className="text-slate-400 text-[11px]">
            Operations that destroy data or modify administrative rights trigger an explicit confirmation flow:
          </p>

          <div className="space-y-2 bg-navy-950 p-3 rounded-lg border border-navy-800 text-[11px]">
            <div className="flex items-center justify-between text-amber-300">
              <span>rm -rf / rm file</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">Confirmation Required</span>
            </div>
            <div className="flex items-center justify-between text-red-400">
              <span>sudo / mkfs / dd / shutdown</span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30">Strictly Prohibited</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
