import {
  CommandIntent, ValidationResult, ExecutionResult,
  ProcessItem, JobItem, HistoryItem, SystemStats,
  TraceResult, FileItem,
  ExplainResponse, ExplainRequest
} from '../types';

const API_BASE = '/api';

export const api = {
  async explainCommand(query: string, level: string = 'beginner'): Promise<ExplainResponse> {
    const res = await fetch(`${API_BASE}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, level })
    });
    if (!res.ok) throw new Error('Failed to explain command');
    return res.json();
  },

  async interpretCommand(naturalRequest: string): Promise<CommandIntent> {
    const res = await fetch(`${API_BASE}/command/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ natural_request: naturalRequest })
    });
    if (!res.ok) throw new Error('Failed to interpret command');
    return res.json();
  },

  async validateCommand(command: string): Promise<ValidationResult> {
    const res = await fetch(`${API_BASE}/command/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    if (!res.ok) throw new Error('Failed to validate command');
    return res.json();
  },

  async executeCommand(command: string, naturalRequest: string = ''): Promise<ExecutionResult> {
    const res = await fetch(`${API_BASE}/command/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, natural_request: naturalRequest })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Execution failed');
    }
    return res.json();
  },

  async getProcesses(): Promise<ProcessItem[]> {
    const res = await fetch(`${API_BASE}/processes`);
    if (!res.ok) return [];
    return res.json();
  },

  async sendProcessSignal(pid: number, signal: number = 15): Promise<boolean> {
    const res = await fetch(`${API_BASE}/processes/${pid}/signal?signal=${signal}`, {
      method: 'POST'
    });
    return res.ok;
  },

  async getJobs(): Promise<JobItem[]> {
    const res = await fetch(`${API_BASE}/jobs`);
    if (!res.ok) return [];
    return res.json();
  },

  async getHistory(): Promise<HistoryItem[]> {
    const res = await fetch(`${API_BASE}/history`);
    if (!res.ok) return [];
    return res.json();
  },

  async deleteHistory(id: number): Promise<boolean> {
    const res = await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  async getSystemStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/system/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async traceCommand(command: string): Promise<TraceResult> {
    const res = await fetch(`${API_BASE}/trace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    if (!res.ok) throw new Error('Failed to trace command');
    return res.json();
  },

  async getFiles(path: string = ''): Promise<FileItem[]> {
    const res = await fetch(`${API_BASE}/files?path=${encodeURIComponent(path)}`);
    if (!res.ok) return [];
    return res.json();
  }
};
