import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { HistoryItem } from '../types';
import { History, Search, Trash2, RotateCcw } from 'lucide-react';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');

  const fetchHistory = async () => {
    try {
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id?: number) => {
    if (!id) return;
    await api.deleteHistory(id);
    fetchHistory();
  };

  const filteredHistory = history.filter(
    (h) =>
      h.user_request.toLowerCase().includes(search.toLowerCase()) ||
      h.generated_command.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-violet-400" />
            <span>Execution & Intent History Log</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            SQLite persistent records of natural language requests, generated POSIX commands, and exit codes.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="w-full bg-navy-950 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-700/60 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy-950 border-b border-navy-700 text-slate-400">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">User Request</th>
                <th className="py-3 px-4">Generated Command</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Exit Code</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {filteredHistory.map((h) => (
                <tr key={h.id} className="hover:bg-navy-800/50 transition">
                  <td className="py-2.5 px-4 text-slate-500">#{h.id}</td>
                  <td className="py-2.5 px-4 text-slate-200">{h.user_request}</td>
                  <td className="py-2.5 px-4 text-cyan-400 font-bold">{h.generated_command}</td>
                  <td className="py-2.5 px-4 text-slate-400 text-[11px]">{h.timestamp}</td>
                  <td className="py-2.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${h.exit_code === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                      {h.exit_code}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center space-x-2">
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="p-1 rounded text-red-400 hover:bg-red-500/20 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 italic">No history records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
