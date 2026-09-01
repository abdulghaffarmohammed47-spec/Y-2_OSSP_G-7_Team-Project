import React, { useState } from 'react';
import catalog from '../data/linux_command_catalog.json';
import { Terminal, ShieldAlert, ShieldCheck, Zap, Server, HardDrive, Network, Users, HelpCircle } from 'lucide-react';
import CommandDetails from './CommandDetails';

export default function CommandCompatibility() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedCommand, setSelectedCommand] = useState<any>(null);

  const categories = ['All', ...Array.from(new Set(catalog.map(c => c.category)))];

  const filteredCatalog = catalog.filter(cmd => {
    const matchesSearch = cmd.command.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'All' || cmd.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getDangerColor = (level: string) => {
    switch(level) {
      case 'SAFE': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'CAUTION': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'DANGEROUS': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'PRIVILEGED': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'INTERACTIVE': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'REMOTE': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Files': return <HardDrive size={16} />;
      case 'System': return <Server size={16} />;
      case 'Network': return <Network size={16} />;
      case 'Users and Groups': return <Users size={16} />;
      default: return <Terminal size={16} />;
    }
  };

  return (
    <div className="min-h-screen p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Zap className="text-cyan-400" size={32} />
          </div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Linux Command Laboratory
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            A comprehensive matrix of natively supported POSIX commands mapped to their safety, interactivity, and capability handlers.
          </p>
        </header>

        <div className="glass-panel p-6 mb-8 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative w-full md:w-1/2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Terminal className="text-gray-400" size={18} />
            </div>
            <input
              type="text"
              placeholder="Search commands (e.g., 'ls', 'rm -rf', 'grep')..."
              className="w-full pl-10 pr-4 py-3 bg-[#0a0a0f]/80 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full md:w-auto min-w-[200px]">
            <select
              className="w-full px-4 py-3 bg-[#0a0a0f]/80 border border-white/10 rounded-lg text-sm appearance-none focus:outline-none focus:border-cyan-500/50 transition-all text-gray-300 cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCatalog.map((cmd, idx) => (
            <div 
              key={idx} 
              onClick={() => setSelectedCommand(cmd)}
              className="glass-panel p-5 rounded-xl border border-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-mono text-lg font-bold text-gray-100 group-hover:text-cyan-400 transition-colors">
                  {cmd.command}
                </h3>
                <span className={`text-xs px-2 py-1 rounded border font-semibold tracking-wide ${getDangerColor(cmd.danger_level)}`}>
                  {cmd.danger_level}
                </span>
              </div>
              
              <p className="text-sm text-gray-400 mb-4 flex-grow line-clamp-2">
                {cmd.description}
              </p>
              
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                <div className="flex items-center text-xs text-gray-500 gap-1.5">
                  {getCategoryIcon(cmd.category)}
                  <span>{cmd.category}</span>
                </div>
                {cmd.testable_automatically ? (
                  <ShieldCheck size={16} className="text-green-500 opacity-80" />
                ) : (
                  <ShieldAlert size={16} className="text-yellow-500 opacity-80" />
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredCatalog.length === 0 && (
          <div className="text-center py-20">
            <HelpCircle size={48} className="mx-auto text-gray-600 mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">No commands found matching your criteria.</p>
          </div>
        )}
      </div>

      {selectedCommand && (
        <CommandDetails 
          command={selectedCommand} 
          onClose={() => setSelectedCommand(null)} 
        />
      )}
    </div>
  );
}
