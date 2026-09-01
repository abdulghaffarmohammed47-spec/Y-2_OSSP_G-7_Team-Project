# ShellForge Pro Architecture

## Conceptual Flow
1. **User Presentation Layer**: React + Vite frontend providing live telemetry, terminal interface, process tree, and system-call timeline.
2. **Backend Orchestration Layer**: FastAPI service managing natural language translation, safety policies, SQLite persistence, and IPC with the C engine.
3. **Execution Layer**: Native C POSIX Systems Engine (`shellforge_engine`) executing commands using system calls:
   - Process Creation & Replacement: `fork()`, `execvp()`
   - Synchronization: `waitpid()`
   - Inter-Process Communication: `pipe()`
   - File Descriptor Manipulation: `dup2()`, `open()`, `close()`
   - Environment & Working Directory: `chdir()`, `getcwd()`, `setenv()`
