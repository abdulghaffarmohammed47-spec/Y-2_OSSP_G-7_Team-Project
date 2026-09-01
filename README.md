# ShellForge Pro — Intelligent Unix Shell

**Course**: Operating Systems and Systems Programming (OSSP)  
**Team**:
- 2510030369 – Mohammed Abdul Ghaffar
- 251003086 – G. Sai Ganesh Reddy
- 2510030070 – S. Manojna Sai
- 2510030116 – Sujal Yadav

---

## Vision & System Overview

ShellForge Pro is an intelligent Unix shell that translates natural-language requests into validated POSIX shell commands, executes them using a custom native C POSIX systems engine, and visualizes OS activity through a modern web console interface.

Unlike terminal simulators, ShellForge Pro interacts directly with the **Linux Kernel** via POSIX system calls (`fork`, `execvp`, `waitpid`, `pipe`, `dup2`, `open`, `sigaction`).

---

## Core Architecture

```
USER
  ↓
REACT FRONTEND (TypeScript + Vite + Tailwind)
  ↓
FASTAPI BACKEND (Python Orchestration & API)
  ↓
INTENT TRANSLATION & SAFETY VALIDATION
  ↓
NATIVE C SYSTEMS ENGINE (`shellforge_engine`)
  ↓
POSIX APIs (fork, execvp, waitpid, pipe, dup2, open)
  ↓
LINUX KERNEL
```

---

## Project Structure

- `engine/`: Native C Unix Shell engine implementation (`main.c`, `parser.c`, `executor.c`, `process.c`, `builtin.c`, etc.).
- `backend/`: FastAPI Python orchestration, natural-language intent parser, safety guardrails, process monitoring, and REST/WebSocket endpoints.
- `frontend/`: Modern React dashboard and interactive Linux systems engineering console.
- `docs/`: OSSP course alignment, system call reference, architecture specs, and safety documentation.

---

## Quick Start (C Engine)

```bash
# Build C engine
cd ShellForge-Pro/engine
make

# Run automated diagnostic tests
make test

# Start interactive shell
./shellforge_engine
```
