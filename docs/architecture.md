# ShellForge Pro: Architecture Report

## 1. Executive Summary
ShellForge Pro is an n-tier application designed to demystify Unix systems programming. It intercepts natural language commands, safely translates them to POSIX-compliant system calls, and executes them in a native C environment. The system acts as both a functional shell and an educational observability platform, giving users direct visibility into how the Linux kernel manages processes.

## 2. System Components

### 2.1 The Frontend (Observability Viewport)
**Technology:** React, TypeScript, Vite, Tailwind CSS.
**Role:** The frontend acts purely as a display and interaction layer. It does not execute commands natively. Instead, it provides:
* An interactive terminal emulator for input/output.
* Live dashboards for process visualization, job tracking, and active file descriptors.
* Educational overlays that explain POSIX concepts in real-time.

### 2.2 The Backend (Orchestration & Translation)
**Technology:** Python 3.11, FastAPI, Groq API (LLMs), Uvicorn.
**Role:** Acts as the bridge between the web UI and the native OS. 
* **Intent Translation:** Parses user requests and converts natural language (e.g., "delete this folder") to precise shell commands (`rm -rf folder/`).
* **Safety Guardrails:** Analyzes translated commands against a strict blocklist to prevent destructive actions on the host machine.
* **Kernel Error Remediation:** Traps exit codes (e.g., `127 Command Not Found`, `13 Permission Denied`) and maps them to human-readable explanations and quick-fix suggestions.

### 2.3 The Systems Engine (Execution Layer)
**Technology:** C (GCC), POSIX System Calls.
**Role:** A compiled binary that interacts directly with the Linux kernel. It handles:
* **Process Lifecycle:** `fork()` for process creation, `execvp()` for binary execution, and `waitpid()` for process synchronization.
* **Inter-Process Communication (IPC):** Uses `pipe()` and `dup2()` to chain inputs and outputs across multiple processes (e.g., `ls -la | grep txt`).
* **Environment Management:** Modifies the execution environment using `chdir()`, `getcwd()`, and `setenv()`.
* **Signal Handling:** Gracefully traps and routes kernel signals (e.g., `SIGINT`, `SIGTERM`).

## 3. Data Flow Overview
1. **User Input:** User types "show me network ports" in the React UI.
2. **Translation:** FastAPI sends this to the LLM/Regex engine, returning `netstat -tuln`.
3. **Validation:** FastAPI verifies `netstat` is a safe command.
4. **Execution:** FastAPI executes the C engine via standard I/O (or directly calls the compiled binary). 
5. **Kernel Interaction:** The C engine calls `fork()` to spawn a child process, then `execvp()` to run `netstat`. The parent process waits using `waitpid()`.
6. **Telemetry Retrieval:** The C engine captures stdout, stderr, and the exit status, returning them to the Python backend.
7. **UI Update:** FastAPI pushes the result and a technical explanation of the syscalls back to the React UI.

## 4. Security & Safety Capabilities
Since ShellForge executes actual OS commands, strict boundaries are enforced:
* Path sanitization limits execution to authorized directories.
* Regex validation blocks shell metacharacters that could cause arbitrary injection.
* Elevated privilege attempts (`sudo`, `su`) are immediately discarded by the Intent Engine.

## 5. Future Enhancements
* Implementing full Linux cgroups v2 integration to limit memory and CPU consumption of spawned commands.
* Utilizing eBPF to gather microsecond-level telemetry on active processes.
* WebSocket integration for live, real-time streaming of standard output for long-running commands.
