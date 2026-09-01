# Current Command Support - Gap Analysis

This document analyzes the gap between ShellForge Pro's current command execution logic and the required capabilities defined in the `linux_command_catalog.json`.

## Current State

Currently, ShellForge Pro uses a monolithic heuristic intent matcher (`backend/app/services/intent_service.py`) and a basic allow/deny list in `safety_service.py`.

### 1. `intent_service.py` (The Pattern Matcher)
The `IntentService` relies on a hardcoded list of regex patterns (`COMMON_PATTERNS`) to translate natural language into commands. 
- It handles very basic commands: `ls`, `ps`, `pwd`, `mkdir`, `rm`, `date`, `whoami`, `echo`.
- It fails for the vast majority of commands (Networking, Remote, Hardware, User Management, Package Management).
- Natural language that falls outside these regex patterns attempts a direct execution or requires AI generation which may fail safety checks.

### 2. `safety_service.py` (The Validator)
The `SafetyService` has a whitelist (`ALLOWED_COMMANDS`) and a blacklist (`DANGEROUS_PATTERNS`).
- **Whitelist**: `ls`, `pwd`, `date`, `whoami`, `echo`, `ps`, `find`, `grep`, `cat`, `mkdir`, `cd`, `sleep`, `sort`, `head`, `tail`, `wc`, `uname`, `strace`, `exit`, `clear`, `history`, `who`, `uptime`, `sudo`, `apt-get`, `apt`.
- Any command outside this whitelist is flagged as `RISKY` and requires user confirmation.

### 3. Engine execution (`parser.c` & `executor.c`)
- Supports simple piping (`|`) and redirection (`>`, `>>`, `<`).
- Supports background execution (`&`).
- Lacks proper handling of PTY for Interactive commands (like `nano` or `top`).

## Gap Analysis & Action Plan

### Missing Categories
The following entire categories are currently completely unsupported or instantly flagged as risky/dangerous and cannot execute safely:
- **Hardware & System Metrics**: `lscpu`, `lsblk`, `free`, `dmidecode`
- **Network & Remote**: `ping`, `ip`, `ssh`, `curl`
- **Compression**: `tar`, `gzip`
- **User & Group**: `useradd`, `passwd`
- **File Parsing & advanced**: `awk`, `sed`

### The Solution: Capability Registry
To solve this, we will move away from `COMMON_PATTERNS` regex. We will introduce a modular **Capability Registry**. 
Each command category from our JSON catalog will map to a Python handler (e.g., `HardwareCapability`, `NetworkCapability`). When a user types a command (or natural language), the `intent_service.py` will route it to the appropriate Capability handler, which understands the specific constraints, safety levels, and arguments required for that domain.
