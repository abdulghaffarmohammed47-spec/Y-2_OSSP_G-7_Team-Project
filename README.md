# ShellForge Pro 🚀

> **Intelligent Unix Systems Console & AI-Powered Terminal Emulator**

ShellForge Pro is an educational and highly advanced Unix shell environment designed to bridge the gap between complex Linux command-line interfaces and modern, accessible web interfaces. It translates natural-language requests into validated POSIX shell commands, executes them securely via a custom native C engine, and visualizes process activity in real-time.

---

## 👥 Team Members (Group 7)
* **2510030369** – Mohammed Abdul Ghaffar
* **251003086**  – G. Sai Ganesh Reddy
* **2510030070** – S. Manojna Sai
* **2510030116** – Sujal Yadav

**Course:** Operating Systems and Systems Programming (OSSP)

---

## ✨ Core Features
* **AI Command Translation:** Type "list all hidden files" and ShellForge Pro translates it to `ls -la`.
* **Kernel Error Remediation:** If a command fails (e.g., `ENOENT`), the UI explains why and offers a clickable "Fix & Run" solution.
* **Native Execution Engine:** Bypasses basic terminal wrappers by interacting directly with the Linux kernel using standard POSIX system calls.
* **Observability Viewport:** Real-time dashboards tracking CPU, memory, active processes, and background jobs.
* **Safety Guardrails:** Prevents destructive commands (like `rm -rf /`) from being executed on the host system.

## 🏗️ Technology Stack
* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend Integration:** Python 3.11+, FastAPI, Uvicorn, Groq API (LLM)
* **Systems Engine:** C (GCC), POSIX APIs, Linux Kernel (via WSL)

## 🚀 Quick Start

### 1. Build the C Engine
```bash
cd engine
make
```

### 2. Start the FastAPI Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # (or .venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Start the React Frontend
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` in your browser to access the ShellForge Pro UI.

---
*Built for the OSSP Course - Emphasizing POSIX standards, systems programming, and modern software architecture.*
