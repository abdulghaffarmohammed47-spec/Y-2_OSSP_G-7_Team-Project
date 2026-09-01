import React from 'react';
import { X, ShieldAlert, ShieldCheck, Cpu, TerminalSquare, Info } from 'lucide-react';

export default function CommandDetails({ command, onClose }: { command: any, onClose: () => void }) {
  if (!command) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in">
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-gray-900 to-black">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <TerminalSquare className="text-cyan-400" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-mono font-bold text-white tracking-wide">{command.command}</h2>
              <p className="text-cyan-400/80 text-sm">{command.category} Capability Handler</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
              <Info size={16} /> Description
            </h3>
            <p className="text-gray-200">{command.description}</p>
            {command.notes && (
              <p className="text-sm text-gray-500 mt-2 italic">{command.notes}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Safety Classification</h3>
              <div className="flex items-center gap-2 text-lg font-bold">
                {command.danger_level === 'SAFE' || command.danger_level === 'CAUTION' ? (
                  <ShieldCheck className="text-green-500" />
                ) : (
                  <ShieldAlert className="text-red-500" />
                )}
                <span className={command.danger_level === 'SAFE' ? 'text-green-400' : 'text-red-400'}>
                  {command.danger_level}
                </span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Execution Pipeline</h3>
              <div className="flex items-center gap-2 text-lg font-bold text-blue-400">
                <Cpu className="text-blue-500" />
                {command.requires_network ? 'Network Required' : 'Local POSIX Execution'}
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">System Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {command.requires_sudo && (
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-md text-xs font-semibold">
                  Requires Root / Sudo
                </span>
              )}
              {command.interactive && (
                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-md text-xs font-semibold">
                  Interactive TTY Required
                </span>
              )}
              {command.requires_optional_package && (
                <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-md text-xs font-semibold">
                  Optional Package
                </span>
              )}
              {!command.requires_sudo && !command.interactive && !command.requires_optional_package && (
                <span className="px-3 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-400 rounded-md text-xs font-semibold">
                  Standard POSIX Utility
                </span>
              )}
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50 text-right">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
