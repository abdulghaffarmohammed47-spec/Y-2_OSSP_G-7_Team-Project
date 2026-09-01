from pydantic import BaseModel
from typing import List, Optional, Any

class CommandInterpretRequest(BaseModel):
    natural_request: str

class CommandIntent(BaseModel):
    intent: str
    command: str
    arguments: List[str]
    safety_level: str  # SAFE, RISKY, BLOCKED
    explanation: str

class CommandValidateRequest(BaseModel):
    command: str

class ValidationResult(BaseModel):
    command: str
    is_safe: bool
    safety_level: str
    reason: str
    requires_confirmation: bool

class CommandExecuteRequest(BaseModel):
    command: str
    natural_request: Optional[str] = ""

class ExecutionResult(BaseModel):
    command: str
    stdout: str
    stderr: str
    pid: int
    ppid: int
    exit_code: int
    status: str
    signal: int
    execution_time: float
    working_directory: str
    explanation: Optional[List[str]] = []

class ProcessItem(BaseModel):
    pid: int
    ppid: int
    name: str
    state: str
    cpu_percent: float
    memory_percent: float
    cmdline: str

class JobItem(BaseModel):
    job_id: int
    pid: int
    pgid: int
    command: str
    state: str
    exit_status: int

class HistoryItem(BaseModel):
    id: Optional[int] = None
    user_request: str
    generated_command: str
    timestamp: str
    status: str
    exit_code: int
    working_directory: str

class SystemStats(BaseModel):
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    active_processes: int
    active_jobs: int
    kernel: str
    architecture: str
    hostname: str
    uptime_seconds: float

class SyscallItem(BaseModel):
    syscall: str
    category: str
    importance: str  # CORE, RELEVANT, BACKGROUND
    args: str
    result: str
    simple_explanation: str
    why: str
    os_concept: str

class TraceResult(BaseModel):
    command: str
    pid: int
    syscalls: List[SyscallItem]

class ExplainRequest(BaseModel):
    query: str
    level: str = "beginner"

class ExplainBreakdown(BaseModel):
    part: str
    meaning: str

class ExplainResponse(BaseModel):
    user_query: str
    normalized_intent: str
    generated_command: str
    summary: str
    breakdown: List[ExplainBreakdown]
    os_flow: List[str]
    relevant_syscalls: List[str]
    concepts: List[str]
    result: Optional[str] = None
    status: str = "completed"

class FileItem(BaseModel):
    name: str
    path: str
    is_dir: bool
    size: int
    permissions: str
    modified: str
