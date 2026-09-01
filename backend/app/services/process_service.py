import subprocess
from typing import List, Dict, Any
from app.schemas.command import ProcessItem

class ProcessService:
    @staticmethod
    def get_processes() -> List[ProcessItem]:
        # Execute ps command in Linux to fetch real PID, PPID, %CPU, %MEM, and COMMAND
        cmd = ["wsl", "ps", "-eo", "pid,ppid,state,%cpu,%mem,comm"]
        processes = []
        
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            lines = res.stdout.strip().splitlines()

            if len(lines) > 1:
                for line in lines[1:]:
                    parts = line.strip().split(maxsplit=5)
                    if len(parts) >= 6:
                        try:
                            pid = int(parts[0])
                            ppid = int(parts[1])
                            state = parts[2]
                            cpu = float(parts[3])
                            mem = float(parts[4])
                            comm = parts[5]

                            processes.append(ProcessItem(
                                pid=pid,
                                ppid=ppid,
                                name=comm,
                                state=state,
                                cpu_percent=cpu,
                                memory_percent=mem,
                                cmdline=comm
                            ))
                        except ValueError:
                            continue
        except Exception:
            pass

        return processes

    @staticmethod
    def send_signal(pid: int, sig: int) -> bool:
        cmd = ["wsl", "kill", f"-{sig}", str(pid)]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
            return res.returncode == 0
        except Exception:
            return False
