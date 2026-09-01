import React, { useState } from 'react';
import { api } from '../services/api';
import { CommandIntent, ExecutionResult } from '../types';
import {
  Terminal, Play, Edit3, Copy, Trash2, HelpCircle,
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, Loader2,
  Wrench, ArrowRight, Sparkles, TerminalSquare, Info, ShieldAlert
} from 'lucide-react';

export const TerminalView: React.FC = () => {
  const [requestInput, setRequestInput] = useState('create file under folder');
  const [intent, setIntent] = useState<CommandIntent | null>(null);
  const [commandEdit, setCommandEdit] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [copyNotification, setCopyNotification] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pedagogyLevel, setPedagogyLevel] = useState<'beginner' | 'intermediate' | 'kernel'>('kernel');

  const samplePrompts = [
    { label: 'create file under folder', desc: 'Auto directory & file creation' },
    { label: 'create folder test', desc: 'Create directory hierarchy' },
    { label: 'Find all C files', desc: 'Search source & headers' },
    { label: 'show detailed files', desc: 'List permissions & sizes' },
    { label: 'show current directory', desc: 'Print working directory' },
    { label: 'show running processes', desc: 'List active OS tasks' },
    { label: 'show who I am', desc: 'Current effective user' },
    { label: 'show date', desc: 'System RTC timestamp' }
  ];

  const handleInterpret = async (reqText: string) => {
    setErrorMsg('');
    setResult(null);
    try {
      const res = await api.interpretCommand(reqText);
      setIntent(res);
      setCommandEdit(res.command);
    } catch (err: any) {
      setErrorMsg(err.message || 'Interpretation error');
    }
  };

  const handleExecute = async (cmdToRun?: string) => {
    const target = cmdToRun || commandEdit;
    if (!target) return;
    
    if (intent?.safety_level === 'RISKY') {
      const confirm = window.confirm(`WARNING: This command is flagged as RISKY.\nReason: ${intent.explanation}\n\nAre you sure you want to execute: ${target}?`);
      if (!confirm) return;
    }
    
    setExecuting(true);
    setErrorMsg('');
    try {
      const res = await api.executeCommand(target, requestInput);
      setResult(res);
      setShowExplanation(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution error');
    } finally {
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
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-navy-900/90 backdrop-blur-md border border-navy-700/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-violet-500 to-emerald-500" />
        <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-400 flex items-center gap-3">
          <TerminalSquare className="w-8 h-8 text-cyan-400 flex-shrink-0" />
          <span>Intelligent Unix Terminal Console</span>
        </h1>
        <p className="text-sm md:text-base text-slate-300 mt-2 font-normal">
          Express Linux operations in plain English. ShellForge Pro translates intent, hardens safety, and executes commands natively via POSIX system calls.
        </p>

        {/* Quick Prompts */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            <Sparkles className="w-4 h-4" />
            <span>Quick Prompt Presets (Click to Test):</span>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setRequestInput(p.label);
                  handleInterpret(p.label);
                }}
                className="text-xs md:text-sm font-mono font-semibold px-3.5 py-2 rounded-lg bg-navy-800/90 hover:bg-navy-700 text-cyan-300 border border-navy-600/60 hover:border-cyan-400/60 transition shadow-sm hover:shadow-cyan-500/10 active:scale-95 text-left"
                title={p.desc}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Natural Language Request Input Bar */}
      <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-5 md:p-6 shadow-xl space-y-3">
        <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Natural Language Request</span>
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={requestInput}
            onChange={(e) => setRequestInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleInterpret(requestInput)}
            placeholder="e.g. create file under folder, find all C files, show detailed files..."
            className="flex-1 bg-navy-950 border border-navy-700 focus:border-cyan-400 rounded-xl px-5 py-3.5 text-base md:text-lg font-mono text-slate-100 placeholder-slate-500 focus:outline-none transition shadow-inner"
          />
          <button
            onClick={() => handleInterpret(requestInput)}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-navy-950 font-bold text-sm md:text-base font-mono transition shadow-lg shadow-cyan-500/25 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Translate Intent</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Intent Understanding & Generated Command Box */}
      {intent && (
        <div className="bg-navy-900 border border-navy-700/80 rounded-2xl p-6 shadow-2xl space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-navy-800 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 font-mono">User Request</span>
              <span className="text-sm md:text-base text-slate-100 font-semibold">{requestInput}</span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 font-mono">Understanding</span>
              <span className="text-sm md:text-base text-cyan-300 font-bold">{intent.intent}</span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5 font-mono">Safety Classification</span>
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-extrabold ${
                intent.safety_level === 'SAFE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                intent.safety_level === 'RISKY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}>
                {intent.safety_level === 'SAFE' && <CheckCircle2 className="w-4 h-4" />}
                {intent.safety_level === 'RISKY' && <AlertTriangle className="w-4 h-4" />}
                {intent.safety_level === 'BLOCKED' && <XCircle className="w-4 h-4" />}
                <span>{intent.safety_level}</span>
              </span>
            </div>
          </div>

          {/* Generated Command Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-navy-950 p-4 md:p-5 rounded-xl border border-navy-800 shadow-inner">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 overflow-x-auto">
              <span className="text-xs md:text-sm font-mono font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
                Generated Command:
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={commandEdit}
                  onChange={(e) => setCommandEdit(e.target.value)}
                  className="flex-1 bg-navy-900 border-2 border-cyan-500 rounded-lg px-3 py-2 text-sm md:text-base font-mono font-bold text-cyan-300 focus:outline-none"
                />
              ) : (
                <span className="font-mono text-base md:text-lg font-extrabold text-emerald-400 tracking-wide bg-navy-900/90 px-3.5 py-1.5 rounded-lg border border-emerald-500/30">
                  {commandEdit}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 self-end lg:self-auto">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs md:text-sm font-mono font-semibold flex items-center gap-2 border border-navy-600 transition active:scale-95"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>{isEditing ? 'Done' : 'Edit Command'}</span>
              </button>

              <button
                onClick={() => handleExecute()}
                disabled={executing}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-extrabold text-xs md:text-sm font-mono flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50 active:scale-95"
              >
                {executing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>Execute in C Engine</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/40 rounded-2xl p-5 text-sm font-mono text-red-200 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Terminal Output Terminal Window */}
      {result && (
        <div className="bg-navy-950 border border-navy-700/80 rounded-2xl shadow-2xl overflow-hidden font-mono text-sm space-y-0">
          
          {/* Terminal Window Header */}
          <div className="bg-navy-900 px-5 py-3.5 border-b border-navy-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3.5">
              <div className="flex space-x-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500 block shadow" />
                <span className="w-3.5 h-3.5 rounded-full bg-amber-500 block shadow" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block shadow" />
              </div>
              <span className="text-slate-300 font-semibold text-xs md:text-sm">shellforge-engine — PID {result.pid}</span>
            </div>

            <div className="flex items-center gap-4 text-xs md:text-sm">
              <span className="text-slate-300">
                Exit Code: <strong className={`px-2 py-0.5 rounded text-xs font-bold ${result.exit_code === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>{result.exit_code}</strong>
              </span>
              <span className="text-slate-400 font-medium">{result.execution_time}s</span>
              
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-navy-800 text-slate-300 hover:text-cyan-300 transition"
                title="Copy Output"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg hover:bg-navy-800 text-slate-300 hover:text-red-300 transition"
                title="Clear Terminal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Copy Toast Notification */}
          {copyNotification && (
            <div className="bg-emerald-500/20 text-emerald-300 text-xs px-5 py-1.5 border-b border-emerald-500/40 font-semibold">
              ✓ Output copied to clipboard!
            </div>
          )}

          {/* Smart Auto-Remediation Banner if Error Occurred */}
          {suggestedFix && (
            <div className="bg-amber-950/50 border-b border-amber-500/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 text-amber-300">
                <Wrench className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold">Automated POSIX Remediation:</span>
                  <span className="ml-2 font-mono font-semibold text-amber-100 bg-amber-900/60 px-2.5 py-1 rounded border border-amber-500/30">{suggestedFix}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setCommandEdit(suggestedFix);
                  handleExecute(suggestedFix);
                }}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-navy-950 font-extrabold text-xs md:text-sm font-mono flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95 self-end sm:self-auto whitespace-nowrap"
              >
                <span>Fix & Run Command</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Terminal stdout / stderr Output Area */}
          <div className="p-5 md:p-6 space-y-3 max-h-[450px] overflow-y-auto bg-[#070b14] text-sm md:text-base font-mono">
            <div className="text-slate-400 font-bold text-sm">$ {result.command}</div>
            
            {result.stdout && (
              <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed font-mono font-medium">{result.stdout}</pre>
            )}

            {result.stderr && (
              <pre className="text-red-400 whitespace-pre-wrap leading-relaxed font-mono font-semibold">{result.stderr}</pre>
            )}

            {!result.stdout && !result.stderr && (
              <div className="text-slate-500 italic text-sm">[Command executed cleanly with no output (Exit Code 0)]</div>
            )}
          </div>

          {/* OS Explanation Mode Accordion Footer */}
          <div className="bg-navy-900 border-t border-navy-800 p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <button
                onClick={() => setShowExplanation(!showExplanation)}
                className="flex items-center gap-2.5 text-sm md:text-base text-cyan-300 hover:text-cyan-200 transition font-bold"
              >
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>OS Explanation Mode — What happened at the Kernel level?</span>
                {showExplanation ? <ChevronUp className="w-5 h-5 ml-1" /> : <ChevronDown className="w-5 h-5 ml-1" />}
              </button>

              {/* Pedagogy Mode Selector */}
              <div className="flex items-center gap-1 bg-navy-950 p-1 rounded-xl border border-navy-700 self-start sm:self-auto">
                <button
                  onClick={() => setPedagogyLevel('beginner')}
                  className={`px-3 py-1 rounded-lg text-xs md:text-sm font-mono font-bold transition ${pedagogyLevel === 'beginner' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Beginner
                </button>
                <button
                  onClick={() => setPedagogyLevel('intermediate')}
                  className={`px-3 py-1 rounded-lg text-xs md:text-sm font-mono font-bold transition ${pedagogyLevel === 'intermediate' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Intermediate
                </button>
                <button
                  onClick={() => setPedagogyLevel('kernel')}
                  className={`px-3 py-1 rounded-lg text-xs md:text-sm font-mono font-bold transition ${pedagogyLevel === 'kernel' ? 'bg-cyan-500 text-navy-950' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Kernel Deep Dive
                </button>
              </div>
            </div>

            {showExplanation && (
              <div className="mt-4 p-4 md:p-5 bg-navy-950 rounded-xl border border-navy-800 text-slate-200 text-sm md:text-base space-y-3.5">
                {pedagogyLevel === 'beginner' && (
                  <div className="p-3.5 bg-cyan-950/40 rounded-lg border border-cyan-500/30 text-cyan-200 text-sm leading-relaxed">
                    <p className="font-bold mb-1 flex items-center gap-2">
                      <Info className="w-4 h-4 text-cyan-400" />
                      <span>Plain English Concept:</span>
                    </p>
                    <p>The console translated your plain English into a validated Unix command and instructed the operating system kernel to launch and run it inside an isolated process.</p>
                  </div>
                )}
                {pedagogyLevel === 'intermediate' && (
                  <div className="p-3.5 bg-violet-950/40 rounded-lg border border-violet-500/30 text-violet-200 text-sm leading-relaxed">
                    <p className="font-bold mb-1 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-violet-400" />
                      <span>Process Lifecycle:</span>
                    </p>
                    <p>The C systems engine called <code>fork()</code> to clone the shell process, configured input/output descriptor redirection, and invoked <code>execvp()</code> to replace the process address space with the executable binary.</p>
                  </div>
                )}
                <div className="space-y-2 pt-1">
                  {result.explanation?.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <span className="text-cyan-400 font-bold mt-0.5 text-base">➔</span>
                      <span className={`text-sm md:text-base leading-relaxed ${
                        step.includes('[KERNEL ROOT CAUSE]') ? 'text-red-300 font-bold' :
                        step.includes('[REMEDIATION]') ? 'text-amber-300 font-bold' :
                        'text-slate-200 font-normal'
                      }`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
