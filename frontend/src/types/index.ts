export interface CommandIntent {
  intent: string;
  command: string;
  arguments: string[];
  safety_level: 'SAFE' | 'RISKY' | 'BLOCKED';
  explanation: string;
}

export interface ValidationResult {
  command: string;
  is_safe: boolean;
  safety_level: 'SAFE' | 'RISKY' | 'BLOCKED';
  reason: string;
  requires_confirmation: boolean;
}

export interface ExecutionResult {
  command: string;
  stdout: string;
  stderr: string;
  pid: number;
  ppid: number;
  exit_code: number;
  status: string;
  signal: number;
  execution_time: number;
  working_directory: string;
  explanation?: string[];
}

export interface ProcessItem {
  pid: number;
  ppid: number;
  name: string;
  state: string;
  cpu_percent: number;
  memory_percent: number;
  cmdline: string;
}

export interface JobItem {
  job_id: number;
  pid: number;
  pgid: number;
  command: string;
  state: 'RUNNING' | 'STOPPED' | 'DONE' | 'FAILED';
  exit_status: number;
}

export interface HistoryItem {
  id?: number;
  user_request: string;
  generated_command: string;
  timestamp: string;
  status: string;
  exit_code: number;
  working_directory: string;
}

export interface SystemStats {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  active_processes: number;
  active_jobs: number;
  kernel: string;
  architecture: string;
  hostname: string;
  uptime_seconds: number;
}

export interface SyscallItem {
  syscall: string;
  category: string;
  importance: string;
  args: string;
  result: string;
  simple_explanation: string;
  why: string;
  os_concept: string;
}

export interface TraceResult {
  command: string;
  pid: number;
  syscalls: SyscallItem[];
}

export interface ExplainBreakdown {
  part: string;
  meaning: string;
}

export interface ExplainResponse {
  user_query: string;
  normalized_intent: string;
  generated_command: string;
  summary: string;
  breakdown: ExplainBreakdown[];
  os_flow: string[];
  relevant_syscalls: string[];
  concepts: string[];
  result?: string;
  status: string;
}

export interface ExplainRequest {
  query: string;
  level?: string;
}

export interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  permissions: string;
  modified: string;
}
