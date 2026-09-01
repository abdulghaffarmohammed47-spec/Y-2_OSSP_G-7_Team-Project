# Safety & Execution Policy

## Safety Principles
1. **Allowlist Policy**: Only safe Unix commands are permitted for automatic execution.
2. **Destructive Command Detection**: Potentially dangerous patterns (such as `rm -rf`, `mkfs`, `dd`, `shutdown`, `reboot`) trigger an explicit confirmation flow.
3. **No Unrestricted Elevation**: `sudo` and root administrative execution are prohibited.
4. **Execution Timeouts & Resource Boundaries**: Child processes operate under enforced timeout limits to prevent infinite loops.
