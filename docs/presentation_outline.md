# ShellForge Pro - PowerPoint Presentation Outline

## Slide 1: Title Slide
- **Title:** ShellForge Pro - Intelligent Unix Systems Console
- **Subtitle:** Bridging High-Level UI with Native C Systems Programming
- **Presenters:** [Your Name / Team Name]
- **Course:** Operating Systems and Systems Programming (OSSP)

## Slide 2: Project Overview & Objectives
- **What is ShellForge Pro?** An educational sandbox for Unix commands.
- **Goal:** Visualize and manage OS concepts interactively.
- **Core Value:** Move beyond raw terminals to an environment that explains *how* the kernel handles requests.

## Slide 3: The Tri-Layer Architecture
*Visual: A vertical stack diagram showing Frontend -> Backend -> Engine.*
- **Frontend:** React, TypeScript, Vite. (UI, Observability, Command Lab).
- **Backend:** Python, FastAPI. (Routing, Safety Policies, Execution Wrapper).
- **Engine:** C, POSIX API. (Native execution, Kernel Syscalls).

## Slide 4: The React Frontend
- **Design Philosophy:** Premium, glassmorphism-inspired dark mode UI.
- **Key Views:**
  - **Intelligent Terminal:** Live execution.
  - **Trace View:** Real-time logging of kernel syscalls.
  - **Command Lab (Compatibility Matrix):** Visualizes the command catalog and safety categories.

## Slide 5: The FastAPI Backend & Middleware
- **Capability Registry:** Moved from brittle Regex to a structured capability routing system.
- **Safety Service:** Strictly enforces execution boundaries based on a central JSON catalog.
- **Command Categories:** `SAFE`, `CAUTION`, `DANGEROUS`, `INTERACTIVE`. 

## Slide 6: The Native C POSIX Engine
- **Direct Kernel Interaction:** Demonstrates core OSSP concepts.
- **Process Creation:** `fork()` and `execvp()`.
- **Inter-Process Communication (IPC):** `pipe()` and `dup2()` for handling complex topologies like `ls -la | grep "test"`.
- **Process Management:** `waitpid()` for status and exit codes.

## Slide 7: Security & Sandboxing (The "rm -rf" Problem)
- **Problem:** Executing native commands from a web app is inherently dangerous.
- **Solution:**
  1. All execution is confined to a `/sandbox` directory.
  2. The catalog explicitly flags and blocks destructive commands like `rm -rf /` (Flagged as `DANGEROUS`).
  3. Interactive tools (`nano`, `vim`) are gracefully blocked to prevent process hanging.

## Slide 8: Demonstration / Live Demo Flow
1. Run a basic command (`ls -la`).
2. Show the "Trace View" explaining the `fork()` and `execvp()` calls.
3. Attempt to run a dangerous command (`rm -rf /`) and show the UI blocking it.
4. Open the "Command Lab" to browse the capability matrix.

## Slide 9: Challenges & Learnings
- **Challenge:** Safely bridging Windows (development) and Linux execution (WSL).
- **Challenge:** Extracting structured JSON metadata from raw C stdout.
- **Learning:** Robust system design requires strict separation of concerns (Engine for execution, Python for safety/orchestration).

## Slide 10: Q&A
- "Thank you!"
- Open floor for questions.
