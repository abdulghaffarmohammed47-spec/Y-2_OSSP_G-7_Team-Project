import React, { useState } from 'react';
import { api } from '../services/api';
import { CommandIntent, ExecutionResult } from '../types';
import {
  Terminal, Play, Edit3, Copy, Trash2, HelpCircle,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Loader2,
  Wrench, ArrowRight, Sparkles, TerminalSquare, Info, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TerminalView: React.FC = () => {
  const [requestInput, setRequestInput] = useState('');
  const [inputMode, setInputMode] = useState<'NL' | 'RAW'>('NL');
  const [intent, setIntent] = useState<CommandIntent | null>(null);
  const [commandEdit, setCommandEdit] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [copyNotification, setCopyNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pedagogyLevel, setPedagogyLevel] = useState<'beginner' | 'intermediate' | 'kernel'>('kernel');
  const [isFocused, setIsFocused] = useState(false);

  // Safety Interceptor State
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);

  const samplePrompts = [
    { label: 'create file under folder', desc: 'Auto directory & file creation' },
    { label: 'Find all C files', desc: 'Search source & headers' },
    { label: 'show detailed files', desc: 'List permissions & sizes' },
    { label: 'show running processes', desc: 'List active OS tasks' }
  ];

  const handleInterpret = async (reqText: string) => {
    if (!reqText.trim()) return;
    setErrorMsg('');
    setResult(null);

    if (inputMode === 'RAW') {
      // Bypass intent, directly execute
      setCommandEdit(reqText);
      handleExecuteIntent(reqText, 'UNKNOWN');
      return;
    }

    try {
      const res = await api.interpretCommand(reqText);
      setIntent(res);
      setCommandEdit(res.command);
    } catch (err: any) {
      setErrorMsg(err.message || 'Interpretation error');
    }
  };

  const handleExecuteIntent = (cmdToRun: string, safetyLevel?: string) => {
    const target = cmdToRun || commandEdit;
    if (!target) return;
    
    const level = safetyLevel || intent?.safety_level;

    if (level === 'RISKY' || level === 'UNKNOWN') {
      setPendingCommand(target);
      setShowSafetyModal(true);
      return;
    }
    
    executeCommand(target);
  };

  const executeCommand = (target: string) => {
    setShowSafetyModal(false);
    setPendingCommand(null);
    setExecuting(true);
    setErrorMsg('');
    setShowExplanation(true);
    
    setResult({
      command: target,
      stdout: '',
      stderr: '',
      pid: 0,
      ppid: 0,
      exit_code: -1,
      status: 'STARTING',
      signal: 0,
      execution_time: 0,
      working_directory: '',
      explanation: []
    });

    try {
      const ws = new WebSocket(`ws://${window.location.host}/api/ws/execute`);
      
      ws.onopen = () => {
        ws.send(target);
      };
      
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        
        setResult(prev => {
          if (!prev) return prev;
          
          if (msg.type === 'status') {
            return { ...prev, status: msg.data, pid: msg.pid };
          } else if (msg.type === 'stdout') {
            return { ...prev, stdout: prev.stdout + (prev.stdout ? '\n' : '') + msg.data };
          } else if (msg.type === 'stderr') {
            return { ...prev, stderr: prev.stderr + (prev.stderr ? '\n' : '') + msg.data };
          } else if (msg.type === 'completed') {
            return { 
              ...prev, 
              exit_code: msg.exit_code, 
              pid: msg.pid,
              ppid: msg.ppid,
              execution_time: msg.execution_time,
              explanation: msg.explanation || [],
              status: msg.exit_code === 0 ? 'COMPLETED' : 'FAILED'
            };
          }
          return prev;
        });
        
        if (msg.type === 'completed') {
          ws.close();
          setExecuting(false);
        }
      };
      
      ws.onerror = () => {
        setErrorMsg('WebSocket connection error');
        setExecuting(false);
      };
      
      ws.onclose = () => {
        setExecuting(false);
      };
      
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution error');
      setExecuting(false);
    }
  };

  const computeSuggestedFix = (res: ExecutionResult): string | null => {
    if (res.exit_code === 0) return null;
    const stderr = res.stderr.toLowerCase();
    if (stderr.includes('no such file or directory') || stderr.includes('cannot touch')) {
      if (res.command.startsWith('touch ')) {
        const fileTarget = res.command.replace('touch ', '').trim();
        const parts = fileTarget.split('/');
        if (parts.length > 1) {
          const dir = parts.slice(0, -1).join('/');
          return `mkdir -p ${dir} && touch ${fileTarget}`;
        }
      }
    }
    return null;
  };

  const handleCopy = () => {
    if (result?.stdout) {
      navigator.clipboard.writeText(result.stdout);
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 2000);
    }
  };

  const handleClear = () => {
    setRequestInput('');
    setIntent(null);
    setCommandEdit('');
    setResult(null);
    setErrorMsg('');
    setShowExplanation(false);
  };

  const suggestedFix = result ? computeSuggestedFix(result) : null;

  return (
    <div className="space-y-6 relative">
      
      {/* Header Banner */}
      <div className="bg-elevated/80 backdrop-blur-md border border-cyan-500/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-violet-500 opacity-70 group-hover:opacity-100 transition-opacity" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-emerald-400 flex items-center gap-3">
          <TerminalSquare className="w-8 h-8 text-cyan-400 flex-shrink-0" />
          <span>Intelligent Systems Console</span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 mt-2 font-normal">
          Warp-speed command execution. Express operations in plain English or drop into raw Bash.
        </p>
      </div>

      {/* Unified Warp-style Input Console */}
      <div className="relative">
        {/* Glow effect underneath */}
        {isFocused && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur opacity-30" 
          />
        )}
        <div className="relative bg-elevated border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl space-y-4">
          
          {/* Mode Toggle */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex bg-workspace border border-slate-700/50 rounded-lg p-1">
              <button
                onClick={() => setInputMode('NL')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-colors ${
                  inputMode === 'NL' ? 'bg-cyan-500/20 text-cyan-300 shadow-cyan-glow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                NL Intent
              </button>
              <button
                onClick={() => setInputMode('RAW')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono transition-colors ${
                  inputMode === 'RAW' ? 'bg-emerald-500/20 text-emerald-300 shadow-emerald-glow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Raw Bash
              </button>
            </div>
            {inputMode === 'NL' && (
              <span className="text-xs font-mono text-cyan-500/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Engine Active
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 relative">
            <div className="absolute left-4 top-4 text-cyan-400 font-mono font-bold mt-[2px]">
              {inputMode === 'NL' ? '❯' : '$'}
            </div>
            <input
              type="text"
              value={requestInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onChange={(e) => setRequestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInterpret(requestInput)}
              placeholder={inputMode === 'NL' ? "Describe what you want to do..." : "Type your bash command here..."}
              className="flex-1 bg-workspace/50 border border-slate-700 focus:border-cyan-400/50 rounded-xl pl-10 pr-5 py-4 text-base md:text-lg font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleInterpret(requestInput)}
              className="px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-workspace font-bold text-sm md:text-base font-mono transition shadow-[0_0_15px_rgba(34,211,238,0.3)] active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{inputMode === 'NL' ? 'Translate' : 'Execute'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts Pills */}
          {inputMode === 'NL' && (
            <div className="flex flex-wrap gap-2 pt-2">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRequestInput(p.label);
                    handleInterpret(p.label);
                  }}
                  className="text-[11px] md:text-xs font-mono font-semibold px-3 py-1.5 rounded-full bg-workspace hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-cyan-500/50 transition-colors shadow-sm"
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Intent Understanding & Generated Command Box */}
      <AnimatePresence>
        {intent && inputMode === 'NL' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-elevated border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-mono">Understanding</span>
                <span className="text-sm md:text-base text-cyan-300 font-bold">{intent.intent}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-mono">Safety Classification</span>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                  intent.safety_level === 'SAFE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  intent.safety_level === 'RISKY' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-glow' :
                  'bg-red-500/20 text-red-400 border border-red-500/40 shadow-red-glow'
                }`}>
                  {intent.safety_level === 'SAFE' && <CheckCircle2 className="w-4 h-4" />}
                  {intent.safety_level === 'RISKY' && <AlertTriangle className="w-4 h-4" />}
                  {intent.safety_level === 'BLOCKED' && <XCircle className="w-4 h-4" />}
                  <span>{intent.safety_level}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-mono">Target Filesystem</span>
                <span className="text-sm font-mono text-slate-300">Local POSIX Env</span>
              </div>
            </div>

            {/* Generated Command Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-workspace p-4 rounded-xl border border-slate-800 shadow-inner">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 overflow-x-auto">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                  AST Compiled:
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={commandEdit}
                    onChange={(e) => setCommandEdit(e.target.value)}
                    className="flex-1 bg-elevated border border-cyan-500/50 rounded-lg px-3 py-2 text-sm md:text-base font-mono font-bold text-cyan-300 focus:outline-none"
                  />
                ) : (
                  <span className="font-mono text-base font-extrabold text-emerald-400 tracking-wide bg-elevated px-3 py-1.5 rounded-md border border-emerald-500/20">
                    {commandEdit}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 self-end lg:self-auto">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold flex items-center gap-2 transition"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditing ? 'Done' : 'Edit'}</span>
                </button>

                <button
                  onClick={() => handleExecuteIntent(commandEdit)}
                  disabled={executing || intent.safety_level === 'BLOCKED'}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-workspace font-extrabold text-xs font-mono flex items-center gap-2 shadow-[0_0_10px_rgba(16,185,129,0.2)] transition disabled:opacity-50 active:scale-95"
                >
                  {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>Run Command</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-sm font-mono text-red-300 flex items-center gap-3 shadow-red-glow">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Terminal Window Frame */}
      {result && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-workspace border border-slate-700/50 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden font-mono text-sm"
        >
          {/* macOS Style Top Bar */}
          <div className="bg-elevated px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-500" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-500" />
              </div>
              <span className="text-slate-400 font-semibold text-xs ml-2">sys-console — PID {result.pid}</span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500">
                Exit Code: <strong className={`px-2 py-0.5 rounded text-[10px] font-bold ml-1 ${result.exit_code === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>{result.exit_code}</strong>
              </span>
              <span className="text-slate-600 font-medium">{result.execution_time}s</span>
              
              <div className="flex gap-1 ml-2">
                <button onClick={handleCopy} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition" title="Copy Output"><Copy className="w-4 h-4" /></button>
                <button onClick={handleClear} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition" title="Clear Terminal"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>

          {copyNotification && (
            <div className="bg-emerald-500/10 text-emerald-400 text-xs px-5 py-1 border-b border-emerald-500/20 text-center">
              Output copied to clipboard
            </div>
          )}

          {/* Terminal Output Area */}
          <div className="p-5 min-h-[150px] max-h-[500px] overflow-y-auto bg-workspace text-sm font-mono relative">
            <div className="text-slate-500 font-bold text-xs mb-3 flex items-center gap-2">
              <span className="text-cyan-500">❯</span> {result.command}
            </div>
            
            {result.stdout && (
              <pre className="text-emerald-400/90 whitespace-pre-wrap leading-relaxed">{result.stdout}</pre>
            )}

            {result.stderr && (
              <pre className="text-red-400/90 whitespace-pre-wrap leading-relaxed mt-2">{result.stderr}</pre>
            )}

            {!result.stdout && !result.stderr && (
              <div className="text-slate-600 italic text-xs mt-2">[Executed with no standard output]</div>
            )}
          </div>
        </motion.div>
      )}

      {/* Safety Interceptor Modal */}
      <AnimatePresence>
        {showSafetyModal && pendingCommand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-workspace/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-elevated border border-amber-500/30 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.15)] max-w-lg w-full overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4 text-amber-400">
                  <ShieldAlert className="w-10 h-10" />
                  <div>
                    <h3 className="text-xl font-bold font-sans">Safety Interceptor</h3>
                    <p className="text-xs font-mono text-amber-500/70">COMMAND FLAGGED AS RISKY</p>
                  </div>
                </div>
                
                <div className="bg-workspace p-4 rounded-xl border border-slate-800 mb-6 font-mono text-sm">
                  <span className="text-slate-500 block mb-1 text-xs uppercase tracking-wider">Target Command:</span>
                  <span className="text-amber-300 font-bold">{pendingCommand}</span>
                </div>

                <div className="space-y-2 mb-8">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AST Capability Breakdown:</span>
                  <div className="bg-amber-950/20 border border-amber-900/50 p-3 rounded-lg text-sm text-slate-300">
                    {intent?.explanation || "This command exhibits potentially destructive behavior according to the POSIX safety catalog."}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 font-mono text-sm">
                  <button
                    onClick={() => { setShowSafetyModal(false); setPendingCommand(null); }}
                    className="px-5 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                  >
                    Cancel Execution
                  </button>
                  <button
                    onClick={() => executeCommand(pendingCommand)}
                    className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-workspace font-bold transition shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                  >
                    Proceed Anyway
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
