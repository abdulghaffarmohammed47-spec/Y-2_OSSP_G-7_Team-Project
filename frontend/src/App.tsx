import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TerminalView } from './components/TerminalView';
import { ProcessesView } from './components/ProcessesView';
import { JobsView } from './components/JobsView';
import { HistoryView } from './components/HistoryView';
import { TraceView } from './components/TraceView';
import { FilesView } from './components/FilesView';
import { SettingsView } from './components/SettingsView';
import CommandCompatibility from './components/CommandCompatibility';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('terminal');

  return (
    <div className="min-h-screen bg-workspace text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      
      {/* Ambient Glow Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none transform -translate-x-1/3 translate-y-1/3" />

      {/* Header Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Console View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'terminal' && <TerminalView />}
        {activeTab === 'processes' && <ProcessesView />}
        {activeTab === 'jobs' && <JobsView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'trace' && <TraceView />}
        {activeTab === 'files' && <FilesView />}
        {activeTab === 'compatibility' && <CommandCompatibility />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer System Bar */}
      <footer className="bg-elevated/80 backdrop-blur-md border-t border-cyan-500/10 py-3 text-xs font-mono text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-400">ShellForge Pro v2.0.0 — Enterprise Edition</span>
          </div>
          <div>
            <span>Native C/POSIX Systems Architecture</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
