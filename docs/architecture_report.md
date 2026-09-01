# ShellForge Pro - Architecture Report

## 1. Introduction

ShellForge Pro is an educational Unix system console designed to demonstrate the bridge between high-level web technologies and low-level POSIX systems programming. The objective is to safely and interactively execute commands, providing deep observability into the operating system's internal behaviors. 

## 2. System Components

The architecture is divided into three distinct layers: Frontend, Backend, and Native Engine.

### 2.1 Frontend (React + Vite)
- **Role:** Provides a responsive, dynamic user interface with detailed observability views (Terminal, System Calls, Processes).
- **Key Technologies:** React, TypeScript, TailwindCSS, Lucide-React.
- **Components:**
  - `TerminalView.tsx`: Simulates an interactive terminal prompt.
  - `CommandCompatibility.tsx` (Command Lab): Visualizes the command support matrix and safety categories.
  - `TraceView.tsx`: Displays a detailed breakdown of internal POSIX syscalls made by the native engine.

### 2.2 Backend (FastAPI)
- **Role:** Acts as the secure middleware and orchestrator. It is responsible for intent classification, safety validation, routing, and environment sandboxing.
- **Key Technologies:** Python, FastAPI, Uvicorn.
- **Key Services:**
  - `CommandCatalogService`: Loads the JSON matrix of supported POSIX commands, their safety levels, and handlers. Matches inputs against the catalog using longest-prefix matching.
  - `CapabilityRegistry`: Replaces brittle regex matching. Maps classified commands to specific handlers (Files, System, Network, Process, etc.).
  - `SafetyService`: Implements strict policies. Blocks `DANGEROUS` commands (e.g., `rm -rf /`) and flags `INTERACTIVE` or `PRIVILEGED` commands.
  - `EngineService`: Spawns the native C engine in a designated testing sandbox via `subprocess` in WSL. Handles JSON extraction from the engine's output.
  - `CommandTestService`: Automates catalog testing to verify endpoint integrity and generate reports.

### 2.3 Native Engine (C POSIX)
- **Role:** Directly interacts with the Linux Kernel to execute commands.
- **Key Technologies:** C, POSIX API (`unistd.h`, `sys/wait.h`, `fcntl.h`).
- **Functionality:**
  - Employs a custom lexer and recursive descent parser.
  - Maps pipelines (`|`), input/output redirection (`>`, `<`), and background jobs (`&`).
  - Utilizes system calls (`fork()`, `execvp()`, `dup2()`, `waitpid()`) to orchestrate execution.
  - Serializes metadata (PID, PPID, exit code) into JSON output to pass observability data back to the Python backend.

## 3. Data Flow Execution Pipeline

1. **User Input:** The user types `ls -la | grep "test"` in the React UI.
2. **REST POST:** The input is sent via `POST /api/command/execute`.
3. **Validation & Routing:** 
   - The FastAPI backend validates the command against `linux_command_catalog.json`.
   - The `CapabilityRegistry` categorizes it as a `Files` capability.
   - `SafetyService` flags it as `SAFE`.
4. **Execution:** 
   - `EngineService` wraps the command and invokes `wsl bash -c './shellforge-engine -c "ls -la | grep \"test\""'`.
5. **Kernel Execution:** 
   - The C engine allocates a pipe (`pipe()`).
   - It `fork()`s two child processes.
   - It hooks `dup2()` to connect the write end of `ls` to the read end of `grep`.
   - It calls `execvp()` to execute the binaries.
6. **Result Aggregation:**
   - The backend reads stdout, stderr, and the trailing JSON metadata block from the engine.
   - It generates an OS Explanation detailing the syscalls used.
7. **Frontend Rendering:** The JSON response is rendered in the UI, updating the Terminal, Trace, and Process views.

## 4. Security & Safety

- **Sandboxing:** Commands are forced to execute within `tests/sandbox`. Path traversal (`..`) is mitigated by the backend directory resolution.
- **Command Whitelisting:** If a command does not exist in the capability registry, it is classified as UNKNOWN and rejected by the SafetyService.
- **Interactive Blocking:** Programs like `nano` or `vim` are correctly identified and blocked to prevent hanging the subprocess pipeline.
