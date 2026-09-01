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

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('terminal');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header Navigation Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Console View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'terminal' && <TerminalView />}
        {activeTab === 'processes' && <ProcessesView />}
        {activeTab === 'jobs' && <JobsView />}
        {activeTab === 'history' && <HistoryView />}
        {activeTab === 'trace' && <TraceView />}
        {activeTab === 'files' && <FilesView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Footer System Bar */}
      <footer className="bg-navy-950 border-t border-navy-800/80 py-3 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>ShellForge Pro v1.0.0 — Native C/POSIX Systems Architecture</span>
          </div>
          <div>
            <span>Course: Operating Systems and Systems Programming (OSSP)</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
