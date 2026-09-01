import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { FileItem } from '../types';
import { Folder, FileText, ArrowLeft, RefreshCw } from 'lucide-react';

export const FilesView: React.FC = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFiles = async (path: string) => {
    setLoading(true);
    try {
      const items = await api.getFiles(path);
      setFiles(items);
      setCurrentPath(path);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles('');
  }, []);

  const handleNavUp = () => {
    if (!currentPath) return;
    const parts = currentPath.split('/');
    parts.pop();
    fetchFiles(parts.join('/'));
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="bg-navy-900 border border-navy-700/60 rounded-xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Folder className="w-5 h-5 text-emerald-400" />
            <span>Workspace File Explorer</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Safe file system browser for project workspace directory: <span className="text-cyan-400">/{currentPath}</span>
          </p>
        </div>

        <div className="flex gap-2">
          {currentPath && (
            <button
              onClick={handleNavUp}
              className="px-3 py-1.5 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 flex items-center gap-1 border border-navy-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}
          <button
            onClick={() => fetchFiles(currentPath)}
            className="p-2 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-navy-900 border border-navy-700/60 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-navy-950 border-b border-navy-700 text-slate-400">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Size (Bytes)</th>
                <th className="py-3 px-4">Permissions</th>
                <th className="py-3 px-4">Modified Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {files.map((f, idx) => (
                <tr
                  key={idx}
                  onClick={() => f.is_dir && fetchFiles(f.path)}
                  className={`transition ${f.is_dir ? 'cursor-pointer hover:bg-navy-800/80' : 'hover:bg-navy-800/40'}`}
                >
                  <td className="py-2.5 px-4 flex items-center gap-2">
                    {f.is_dir ? <Folder className="w-4 h-4 text-amber-400" /> : <FileText className="w-4 h-4 text-cyan-400" />}
                    <span className={f.is_dir ? 'text-slate-100 font-bold' : 'text-slate-300'}>{f.name}</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400">{f.is_dir ? 'Directory' : 'File'}</td>
                  <td className="py-2.5 px-4 text-right text-emerald-400">{f.is_dir ? '-' : f.size}</td>
                  <td className="py-2.5 px-4 text-violet-300">{f.permissions}</td>
                  <td className="py-2.5 px-4 text-slate-400">{f.modified}</td>
                </tr>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 italic">Empty directory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
