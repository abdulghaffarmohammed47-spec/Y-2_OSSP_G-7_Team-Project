import re
from app.schemas.command import ValidationResult

ALLOWED_COMMANDS = {
    "ls", "pwd", "date", "whoami", "echo", "ps", "find", "grep",
    "cat", "mkdir", "cd", "sleep", "sort", "head", "tail", "wc",
    "uname", "strace", "exit", "clear", "history", "who", "uptime",
    "sudo", "apt-get", "apt"
}

DANGEROUS_PATTERNS = [
    (r"\brm\s+-rf\b", "Recursive forced file deletion"),
    (r"\brm\b", "File unlinking / deletion operation"),
    (r"\bmkfs\b", "File system format operation"),
    (r"\bdd\b", "Raw disk or device write operation"),
    (r"\bshutdown\b", "System shutdown initiation"),
    (r"\breboot\b", "System restart initiation"),
    (r"\bpoweroff\b", "System power-off command"),
    (r"\bchmod\s+777\b", "Unsafe global permission modification"),
    (r">\s*/dev/sd", "Direct block device write overwrite")
]

class SafetyService:
    @staticmethod
    def validate(command_str: str) -> ValidationResult:
        cmd_trim = command_str.strip()
        
        # Check dangerous patterns
        for pattern, reason in DANGEROUS_PATTERNS:
            if re.search(pattern, cmd_trim, re.IGNORECASE):
                return ValidationResult(
                    command=command_str,
                    is_safe=False,
                    safety_level="RISKY",
                    reason=f"Potentially destructive operation: {reason}",
                    requires_confirmation=True
                )

        # Check primary binary allowlist
        first_word = cmd_trim.split()[0] if cmd_trim.split() else ""
        if first_word and first_word not in ALLOWED_COMMANDS:
            # Check if it's a relative/absolute path to executable
            if not (first_word.startswith("./") or first_word.startswith("/")):
                return ValidationResult(
                    command=command_str,
                    is_safe=False,
                    safety_level="RISKY",
                    reason=f"Command '{first_word}' is outside standard safe execution allowlist",
                    requires_confirmation=True
                )

        return ValidationResult(
            command=command_str,
            is_safe=True,
            safety_level="SAFE",
            reason="Command complies with workspace safety policy",
            requires_confirmation=False
        )
