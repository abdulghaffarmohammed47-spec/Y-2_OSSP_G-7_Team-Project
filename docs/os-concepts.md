# OSSP Course Outcome Alignment

This document outlines how ShellForge Pro demonstrates core Operating Systems and Systems Programming (OSSP) concepts:

### CO1: Shell Architecture & System Call Interface
- Demonstrates user vs. kernel mode transitions during execution of commands.
- Implements interactive REPL and system call invocation wrapper (`process_spawn_and_wait`).

### CO2: Process Lifecycle Management
- Uses `fork()` to clone parent shell into child process.
- Uses `execvp()` to load new binary image into child process memory.
- Uses `waitpid()` for parent-child status synchronization and process cleanup.

### CO3: Inter-Process Communication & Signals
- Uses `pipe()` and `dup2()` to connect stdout of upstream process to stdin of downstream process in pipelines.
- Handles `SIGINT` and `SIGTSTP` using POSIX `sigaction()`.

### CO4: Memory Observation & Process Inspection
- Reads `/proc` filesystem and process tables to report CPU, memory, and PPID/PID hierarchies.

### CO5: File Systems & File Descriptors
- Manipulates standard file descriptors (`STDIN_FILENO`, `STDOUT_FILENO`, `STDERR_FILENO`) via `open()`, `dup2()`, and `close()`.
- Implements I/O redirection (`>`, `>>`, `<`, `2>`).

### CO6: Concurrency & Job Control
- Supports background process execution with `&` operator and non-blocking process management.
