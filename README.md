# ShellForge Pro - Intelligent Unix Systems Console

ShellForge Pro is a modern, high-performance web-based terminal interface that safely bridges user inputs with native POSIX execution. Designed for Operating Systems and Systems Programming (OSSP), it demonstrates the seamless integration of a React frontend, a FastAPI backend, and a C-based native systems engine (`shellforge-engine`).

## 🚀 Features

- **Intelligent Terminal:** Interactively run Unix commands with real-time output streaming.
- **Safety First:** Built-in capability registry classifies commands (e.g., SAFE, CAUTION, DANGEROUS) and enforces strict execution policies.
- **Trace & Observability:** Detailed breakdown of system calls (`fork`, `execvp`, `pipe`, `waitpid`) used during command execution.
- **Command Compatibility Matrix:** Browse native POSIX commands supported by the engine, complete with safety classifications and handler mapping.
- **Native Execution:** Commands are executed natively by the `shellforge-engine` binary inside a Linux (WSL) sandbox.

## 🏗️ Architecture Stack

1. **Frontend (React, TypeScript, TailwindCSS, Vite):**
   - Provides a stunning, glassmorphism-inspired UI.
   - Communicates with the backend via REST APIs.
   - Provides multiple observability views: Terminal, Processes, Jobs, History, Trace, and Command Lab.

2. **Backend (Python, FastAPI, Uvicorn):**
   - Handles REST API requests and CORS.
   - Validates incoming commands using the `CommandCatalogService`.
   - Routes commands using the `CapabilityRegistry`.
   - Spawns the `shellforge-engine` via `subprocess` in a sandboxed directory.
   - Diagnoses kernel and execution errors to generate human-readable explanations.

3. **Engine (C, POSIX API):**
   - Implements native systems programming concepts.
   - Performs tokenization, parsing, and execution.
   - Handles advanced POSIX topologies like pipes (`|`) using `fork`, `execvp`, and `dup2`.

## ⚙️ Setup and Installation

### Prerequisites
- Node.js (v16+)
- Python (3.9+)
- WSL (Windows Subsystem for Linux) installed with `bash` available.
- GCC (inside WSL) to compile the engine.

### 1. Compile the Native Engine
Ensure the engine is compiled for Linux so it can be executed via WSL.
```bash
cd engine
gcc -o shellforge-engine main.c parser.c executor.c -Wall -Wextra
```

### 2. Start the Backend Server
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
*The backend runs on http://localhost:8000*

### 3. Start the Frontend App
```bash
cd frontend
npm install
npm run dev
```
*The frontend runs on http://localhost:5173*

## 🧪 Testing

An automated test suite verifies the execution of all commands in the catalog against the sandbox environment.

Run the test suite via the API:
```bash
curl -X POST http://localhost:8000/api/commands/test-all
```
This will generate a detailed markdown report at `docs/command_test_report.md`.
