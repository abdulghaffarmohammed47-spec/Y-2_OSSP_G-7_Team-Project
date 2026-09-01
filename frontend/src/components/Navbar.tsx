import React from 'react';
import {
  Terminal, Cpu, Activity, History, GitCommit,
  Folder, Shield, LayoutDashboard, Server
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'terminal', label: 'Intelligent Terminal', icon: Terminal },
    { id: 'processes', label: 'Processes', icon: Cpu },
    { id: 'jobs', label: 'Jobs', icon: Activity },
    { id: 'history', label: 'History', icon: History },
    { id: 'trace', label: 'System Calls', icon: GitCommit },
    { id: 'files', label: 'Files', icon: Folder },
    { id: 'settings', label: 'Settings & Safety', icon: Shield },
  ];

  return (
    <header className="bg-navy-900/95 border-b border-navy-700/80 sticky top-0 z-50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-emerald-500 to-violet-500 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-navy-950 rounded-[9px] flex items-center justify-center">
                <Terminal className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-slate-100 tracking-tight">ShellForge</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">PRO</span>
              </div>
              <p className="text-xs text-slate-400 font-mono tracking-tight font-medium">C/POSIX SYSTEMS ENGINE • OSSP</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-1.5 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-navy-800/80'
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* POSIX Status Badge */}
          <div className="hidden lg:flex items-center space-x-2 bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-emerald-300 tracking-wide">POSIX READY</span>
          </div>

        </div>
      </div>
    </header>
  );
};
