import re
import subprocess
from typing import List
from app.schemas.command import SyscallItem, TraceResult

class TraceService:
    @staticmethod
    def trace_command(command_str: str) -> TraceResult:
        from app.services.engine_service import EngineService
        import os
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
        engine_dir_win = os.path.join(project_root, "engine")
        wsl_path = EngineService._win_to_wsl_path(engine_dir_win)
        
        # Trace the C engine!
        engine_cmd = f"cd {wsl_path} && ./shellforge_engine --json -c \\\"{command_str}\\\""
        cmd = ["wsl", "strace", "-f", "-s", "64", "sh", "-c", engine_cmd]
        
        syscalls: List[SyscallItem] = []
        pid = 0
        unfinished = {}
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
            stderr_out = res.stderr
            
            # The first execve will be /bin/sh (from wsl sh -c)
            # The second execve will be ./shellforge_engine
            # Everything before the execve for shellforge_engine is useless shell noise.
            # Everything between shellforge_engine execve and the first fork/clone is BACKGROUND.
            engine_started = False
            command_started = False

            for line in stderr_out.splitlines():
                line = line.strip()
                
                # Check for PID prefix
                pid_match = re.match(r"^\[pid\s+(\d+)\]\s+(.*)", line)
                if pid_match:
                    pid = int(pid_match.group(1))
                    content = pid_match.group(2)
                else:
                    pid = 0
                    content = line
                    
                # Check if resumed
                resumed_match = re.match(r"^<\.\.\.\s*([a-zA-Z0-9_]+)\s*resumed>\s*\)\s*=\s*(.*)", content)
                name, args, result = None, None, None
                
                if resumed_match:
                    name = resumed_match.group(1)
                    result = resumed_match.group(2)
                    if pid in unfinished and unfinished[pid][0] == name:
                        args = unfinished[pid][1]
                        del unfinished[pid]
                else:
                    # Check if unfinished
                    unfinished_match = re.match(r"^([a-zA-Z0-9_]+)\((.*)<unfinished \.\.\.>", content)
                    if unfinished_match:
                        u_name = unfinished_match.group(1)
                        u_args = unfinished_match.group(2).strip()
                        if u_args.endswith(','):
                            u_args = u_args[:-1]
                        unfinished[pid] = (u_name, u_args)
                        continue
                        
                    # Normal match
                    normal_match = re.match(r"^([a-zA-Z0-9_]+)\((.*)\)\s*=\s*(.*)$", content)
                    if normal_match:
                        name = normal_match.group(1)
                        args = normal_match.group(2)
                        result = normal_match.group(3)
                        
                if name and args is not None and result is not None:
                    # Ignore initial sh -c noise
                    if name == "execve" and "shellforge_engine" in args:
                        engine_started = True
                        
                    if not engine_started:
                        continue
                        
                    # Determine importance
                    importance = "BACKGROUND"
                    if name in ("clone", "fork", "vfork", "execve", "wait4", "waitpid"):
                        if name == "execve" and "shellforge_engine" not in args:
                            command_started = True
                        if command_started or name in ("clone", "fork", "vfork"):
                            importance = "CORE"
                    elif name in ("pipe", "pipe2", "dup2", "dup", "chdir"):
                        importance = "RELEVANT"
                    elif name in ("read", "write", "openat", "open"):
                        if command_started:
                            importance = "CORE"
                        else:
                            # Might be engine parsing/reading script
                            importance = "RELEVANT"
                            
                    category, simple, why, concept = TraceService._enrich_syscall(name)
                    
                    # Hard override: if it's openat but result is ENOENT, it's just checking
                    if "ENOENT" in result:
                        simple = "Linux checked for a file that was not present."
                        
                    syscalls.append(SyscallItem(
                        syscall=name,
                        category=category,
                        importance=importance,
                        args=args,
                        result=result,
                        simple_explanation=simple,
                        why=why,
                        os_concept=concept
                    ))
        except Exception as e:
            print("Trace Exception:", e)
            pass

        return TraceResult(
            command=command_str,
            pid=pid,
            syscalls=syscalls
        )

    @staticmethod
    def _enrich_syscall(name: str):
        mapping = {
            "execve": ("PROCESS", "Starts the requested program.", "The shell uses execve to replace the child process memory with the new program binary.", "Process Control"),
            "fork": ("PROCESS", "Creates a new child process.", "The shell forks so it doesn't terminate itself when running a command.", "Process Control"),
            "clone": ("PROCESS", "Creates a new child process/thread.", "The shell forks so it doesn't terminate itself when running a command.", "Process Control"),
            "wait4": ("PROCESS", "Waits for a process to finish.", "The parent shell waits for the child to finish so it knows when to prompt again.", "Process Control"),
            "pipe": ("IPC", "Creates a communication channel.", "Used to connect the output of one process to the input of another.", "Inter-Process Communication"),
            "pipe2": ("IPC", "Creates a communication channel.", "Used to connect the output of one process to the input of another.", "Inter-Process Communication"),
            "dup2": ("IPC", "Redirects file descriptors.", "Used to wire stdin/stdout to pipes or files.", "I/O Redirection"),
            "read": ("FILE I/O", "Linux read data.", "The process is reading input data or reading a file.", "File I/O"),
            "write": ("FILE I/O", "Linux sent output.", "The process is writing output to the terminal or a file.", "File I/O"),
            "openat": ("FILE I/O", "Linux opened or accessed a file.", "The process needs a file descriptor to interact with the file.", "File System"),
            "close": ("FILE I/O", "Linux closed a file.", "Cleans up the file descriptor so it can be reused.", "File System"),
            "mmap": ("MEMORY", "Linux mapped memory.", "Maps files or devices into memory, or allocates anonymous memory (e.g. for IPC shared memory).", "Memory Management"),
            "mprotect": ("MEMORY", "Linux protected memory.", "Setting read/write/execute permissions on memory pages.", "Memory Management"),
            "brk": ("MEMORY", "Linux adjusted the heap.", "Allocating or freeing process memory.", "Memory Management"),
            "setpgid": ("PROCESS", "Sets the process group ID.", "Groups processes together so they can be controlled or sent signals (like Ctrl+Z) as a single unit.", "Process Control"),
            "prlimit64": ("PROCESS", "Gets or sets resource limits.", "Enforces limits on things like memory usage or file size.", "Resource Management"),
            "ftruncate": ("FILE I/O", "Truncates a file to a specified length.", "Often used to set the size of a POSIX shared memory object after creation.", "File System"),
            "futex": ("IPC", "Fast User-Space Mutex.", "Used for thread/process synchronization (e.g. underlying mechanism for semaphores/mutexes).", "Synchronization")
        }
        
        if name in mapping:
            return mapping[name]
            
        if name in ("exit", "exit_group"):
            return ("PROCESS", "Ends the process.", "The program finished executing and tells the kernel it is done.", "Process Control")
        if name in ("access", "stat", "fstat", "lstat", "getcwd"):
            return ("FILE I/O", "Linux checked file/dir info.", "Looking up metadata or checking if a file exists.", "File System")
        if name in ("sigaction", "kill", "rt_sigaction", "rt_sigprocmask"):
            return ("IPC", "Signal handling.", "Setting up how the process responds to signals like Ctrl+C.", "Signals")
            
        return ("OTHER", "Linux executed a system call.", "Generic kernel interaction.", "Kernel Services")
