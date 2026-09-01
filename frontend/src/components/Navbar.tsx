import React from 'react';
import {
  Terminal, Cpu, Activity, History, GitCommit,
  Folder, Shield, LayoutDashboard, Server, Search
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'terminal', label: 'Console', icon: Terminal },
    { id: 'processes', label: 'Processes', icon: Cpu },
    { id: 'jobs', label: 'Jobs', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'trace', label: 'Trace', icon: GitCommit },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'compatibility', label: 'Lab', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Server },
  ];

  return (
    <header className="bg-elevated/80 border-b border-cyan-500/10 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 w-1/4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-violet-500 p-px shadow-cyan-glow">
              <div className="w-full h-full bg-workspace rounded-[11px] flex items-center justify-center">
                <Terminal className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-slate-100 tracking-tight">ShellForge</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">PRO</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1 overflow-x-auto py-1 justify-center w-2/4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Global Search & Status */}
          <div className="flex items-center justify-end space-x-3 w-1/4">
            {/* Search Input Mockup */}
            <div className="hidden lg:flex items-center bg-slate-900/50 border border-slate-700/50 rounded-md px-2 py-1.5 group hover:border-cyan-500/50 transition-colors cursor-text">
              <Search className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 mr-2 transition-colors" />
              <span className="text-xs text-slate-500 font-mono">Search / Launch...</span>
              <div className="ml-4 flex items-center space-x-1">
                <kbd className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">Ctrl</kbd>
                <kbd className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">K</kbd>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="hidden xl:flex items-center space-x-3 bg-workspace/80 border border-slate-700/50 px-3 py-1.5 rounded-md text-[10px] font-mono shadow-inner">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_#22d3ee] animate-pulse"></span>
                <span className="text-cyan-300">C Engine: CONNECTED</span>
              </div>
              <div className="w-px h-3 bg-slate-700"></div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_#10b981]"></span>
                <span className="text-emerald-300">POSIX</span>
              </div>
              <div className="w-px h-3 bg-slate-700"></div>
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_5px_#8b5cf6]"></span>
                <span className="text-violet-300">cgroups v2</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
