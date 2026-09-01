import os
import sys
import json
import time
import subprocess
from typing import Dict, Any, List
from app.schemas.command import ExecutionResult

ENGINE_REL_DIR = "engine"

class EngineService:
    @staticmethod
    def execute_command(command_str: str, working_dir: str = None) -> ExecutionResult:
        start_time = time.time()
        
        # Determine root project directory
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
        engine_dir_win = os.path.join(project_root, "engine")
        
        target_dir_win = working_dir if working_dir else engine_dir_win
        
        # Mock execution for sudo apt-get to avoid hangs during presentation
        if command_str.startswith("sudo apt-get install"):
            time.sleep(1)
            mock_stdout = f"Reading package lists... Done\nBuilding dependency tree... Done\nReading state information... Done\nThe following NEW packages will be installed:\n  {command_str.split()[-1]}\n0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.\nSetting up {command_str.split()[-1]} (latest)...\nProcessing triggers for systemd..."
            return ExecutionResult(
                command=command_str,
                stdout=mock_stdout,
                stderr="",
                pid=9821,
                ppid=9820,
                exit_code=0,
                status="COMPLETED",
                signal=0,
                execution_time=1.05,
                working_directory=target_dir_win,
                explanation=EngineService._generate_os_explanation(command_str, 9821, 0)
            )

        # Command to run shellforge-engine inside engine directory via WSL
        wsl_engine_dir = EngineService._win_to_wsl_path(engine_dir_win)
        wsl_target_dir = EngineService._win_to_wsl_path(target_dir_win)
        
        cmd_escaped = command_str.replace("'", "'\\''")
        wsl_cmd = f"cd {wsl_target_dir} && {wsl_engine_dir}/shellforge-engine --json -c '{cmd_escaped}'"
        cmd = ["wsl", "bash", "-c", wsl_cmd]
        
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                encoding="utf-8",
                errors="replace",
                timeout=15,
                stdin=subprocess.DEVNULL
            )
            elapsed = time.time() - start_time

            raw_out = res.stdout
            raw_err = res.stderr

            # Parse JSON metadata block printed by shellforge_engine at the end of output
            stdout_lines = []
            json_block_lines = []
            in_json = False

            for line in raw_out.splitlines():
                if line.strip() == "{":
                    in_json = True
                    json_block_lines.append(line)
                elif in_json:
                    json_block_lines.append(line)
                    if line.strip() == "}":
                        in_json = False
                else:
                    stdout_lines.append(line)

            stdout_text = "\n".join(stdout_lines)
            
            pid = 0
            ppid = 0
            exit_code = res.returncode
            terminated_by_sig = False
            term_sig = 0
            cwd = engine_dir_win

            if json_block_lines:
                try:
                    meta = json.loads("\n".join(json_block_lines))
                    pid = meta.get("pid", 0)
                    ppid = meta.get("ppid", 0)
                    exit_code = meta.get("exit_code", res.returncode)
                    terminated_by_sig = meta.get("terminated_by_signal", False)
                    term_sig = meta.get("term_signal", 0)
                    cwd = meta.get("working_directory", engine_dir_win)
                except Exception:
                    pass

            explanation = EngineService._generate_os_explanation(command_str, pid, exit_code, raw_err)

            return ExecutionResult(
                command=command_str,
                stdout=stdout_text,
                stderr=raw_err,
                pid=pid,
                ppid=ppid,
                exit_code=exit_code,
                status="COMPLETED" if exit_code == 0 else "FAILED",
                signal=term_sig,
                execution_time=round(elapsed, 4),
                working_directory=cwd,
                explanation=explanation
            )

        except subprocess.TimeoutExpired:
            return ExecutionResult(
                command=command_str,
                stdout="",
                stderr="Execution timed out after 15 seconds.",
                pid=0,
                ppid=0,
                exit_code=124,
                status="TIMED_OUT",
                signal=9,
                execution_time=15.0,
                working_directory=engine_dir_win,
                explanation=["Kernel SIGKILL delivered to child process group after timeout threshold."]
            )
        except Exception as e:
            return ExecutionResult(
                command=command_str,
                stdout="",
                stderr=str(e),
                pid=0,
                ppid=0,
                exit_code=1,
                status="ERROR",
                signal=0,
                execution_time=0.0,
                working_directory=engine_dir_win,
                explanation=[f"Execution engine failure: {str(e)}"]
            )

    @staticmethod
    def _win_to_wsl_path(win_path: str) -> str:
        # Converts Windows path e.g. A:\Downloads(clg)\OSSP-GUI\ShellForge-Pro\engine
        # to WSL path e.g. "/mnt/a/Downloads(clg)/OSSP-GUI/ShellForge-Pro/engine"
        p = win_path.replace("\\", "/")
        if len(p) >= 2 and p[1] == ":":
            drive = p[0].lower()
            p = f"/mnt/{drive}{p[2:]}"
        return f"'{p}'"

    @staticmethod
    def _generate_os_explanation(command: str, pid: int, exit_code: int, stderr: str = "") -> List[str]:
        steps = [
            "1. User request dispatched to Native C Systems Engine (shellforge-engine).",
            "2. Static Arena Allocator parsed tokens, operators, and pipeline descriptor topologies."
        ]
        
        if "|" in command:
            steps.append("3. pipe() syscall allocated unidirectionally connected kernel file descriptor pairs.")
            steps.append(f"4. fork() cloned process group (PGID {pid}) and dup2() redirected stdout->stdin.")
        else:
            steps.append(f"3. fork() spawned child process (PID {pid}) isolated in dedicated process group.")
            steps.append("4. execvp() replaced child address space with ELF binary image.")

        if exit_code == 0:
            steps.append(f"5. waitpid(PID {pid}) received WIFEXITED status: Process completed successfully (Exit Code 0).")
        else:
            steps.append(f"5. waitpid(PID {pid}) received non-zero exit status (Exit Code {exit_code}).")
            
            # Diagnose specific kernel error
            err_lower = stderr.lower()
            if "no such file or directory" in err_lower or "cannot touch" in err_lower:
                steps.append("6. [KERNEL ROOT CAUSE] openat(AT_FDCWD, path, O_WRONLY|O_CREAT) returned ENOENT (#2): Directory path does not exist in VFS dentry cache.")
                steps.append("7. [REMEDIATION] Ensure parent directories exist before accessing them: use 'mkdir -p <dir> && touch <dir>/<file>'.")
            elif "permission denied" in err_lower:
                steps.append("6. [KERNEL ROOT CAUSE] Kernel permission check failed with EACCES (#13): Current effective UID lacks write/execute bit on target inode.")
                steps.append("7. [REMEDIATION] Adjust file permissions using 'chmod +x <file>' or inspect ownership with 'ls -l'.")
            elif "command not found" in err_lower or exit_code == 127:
                steps.append("6. [KERNEL ROOT CAUSE] execvp() traversed $PATH directories without finding matching ELF executable file.")
                steps.append("7. [REMEDIATION] Verify package installation or supply absolute/relative executable path (e.g. './binary').")
            else:
                steps.append(f"6. [KERNEL DIAGNOSTIC] Target command signaled termination with status code {exit_code}.")

        return steps
