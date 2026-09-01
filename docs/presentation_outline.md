# ShellForge Pro: Presentation Outline

This document provides a slide-by-slide outline for your project presentation.

---

### Slide 1: Title Slide
* **Title:** ShellForge Pro - Intelligent Unix Systems Console
* **Subtitle:** Translating Natural Language into Native POSIX Execution
* **Team:** Group 7 (Mohammed Abdul Ghaffar, G. Sai Ganesh Reddy, S. Manojna Sai, Sujal Yadav)
* **Course:** Operating Systems and Systems Programming (OSSP)

### Slide 2: The Problem
* **The CLI Barrier:** The Linux command line is incredibly powerful, but the learning curve is steep. 
* **Lack of Visibility:** Traditional terminals don't show you *how* the operating system is managing processes under the hood. 
* **The Danger:** It is easy to make catastrophic mistakes (e.g., deleting critical directories) without understanding the impact.

### Slide 3: Our Solution (ShellForge Pro)
* **What is it?** A visual, AI-augmented terminal environment.
* **Key Idea:** Users type what they want in plain English, and ShellForge Pro translates it, explains it, and runs it natively.
* **Focus:** Deep visibility into Linux kernel operations and POSIX system calls.

### Slide 4: System Architecture Overview
* **High-Level Diagram:** 
  `React UI` ↔ `FastAPI Backend` ↔ `Native C Engine` ↔ `Linux Kernel`
* **Separation of Concerns:**
  * UI is purely for observability.
  * Backend orchestrates logic and safety.
  * C Engine does the actual low-level OS work.

### Slide 5: The Frontend (Observability Viewport)
* **Stack:** React, TypeScript, Tailwind CSS.
* **Features:** 
  * Interactive terminal interface.
  * Dynamic dashboards showing processes, exit codes, and memory usage.
  * Auto-remediation banners (e.g., clicking "Fix & Run" when a directory doesn't exist).

### Slide 6: The Backend (Brain & Shield)
* **Stack:** Python, FastAPI, Groq (LLM API).
* **Translation:** Converts text to shell syntax.
* **Safety Guardrails:** Analyzes commands *before* they touch the C engine to prevent destructive OS actions.

### Slide 7: The Core Engine (Where the Magic Happens)
* **Stack:** Native C, Linux WSL.
* **The POSIX Layer:** How we interact with the kernel.
  * `fork()`: Spawning new processes.
  * `execvp()`: Replacing process images.
  * `waitpid()`: Process synchronization.
  * `pipe()` & `dup2()`: Inter-process communication and file descriptors.

### Slide 8: The "Anatomy of a Command"
* **Walkthrough:** What happens when a user types "list files"?
  1. UI sends text to Backend.
  2. Backend translates to `ls -la`.
  3. C Engine intercepts, calls `fork()`.
  4. Child calls `execvp("ls")`. Parent calls `waitpid()`.
  5. C Engine captures stdout and exit code `0`.
  6. Backend explains that `0` means success.
  7. UI updates the dashboard.

### Slide 9: Demo Time
* **Live Action:** Show the interface.
* **Scenario 1:** Run a successful command. 
* **Scenario 2:** Run a failing command (e.g., open a missing file) to show the kernel error diagnosis.
* **Scenario 3:** Show how the pipeline (e.g. `| grep`) creates multiple processes.

### Slide 10: Conclusion & Future Scope
* **Summary:** We successfully built a bridge between modern web architectures and low-level Linux systems programming.
* **Future Scope:** Adding eBPF telemetry, integrating cgroups v2 for resource limitation, and supporting persistent SSH connections.
* **Thank You & Q&A.**
