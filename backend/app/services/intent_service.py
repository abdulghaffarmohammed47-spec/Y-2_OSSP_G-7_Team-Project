import os
import re
import json
from dotenv import load_dotenv
from groq import AsyncGroq
from app.schemas.command import CommandIntent

load_dotenv()

# Built-in high-accuracy deterministic pattern mappings for shell operations
COMMON_PATTERNS = [
    # Creating files in folders / subfolders
    (
        r"(?i)^(?:create|make|touch|add)\s+(?:a\s+)?file\s+(?:under|in|inside|into)\s+(?:folder|dir|directory)\s*([a-zA-Z0-9_\-\./]*)$",
        lambda m: (
            f"mkdir -p {m.group(1).strip() or 'folder'} && touch {m.group(1).strip() or 'folder'}/newfile.txt",
            f"Create parent directory '{m.group(1).strip() or 'folder'}' if it doesn't exist and create newfile.txt inside it",
            "SAFE",
            "Creates directory using mkdir -p, then creates an empty file using touch."
        )
    ),
    (
        r"(?i)^(?:create|make|touch)\s+(?:a\s+)?file\s+(?:under|in|inside)\s+folder$",
        lambda m: (
            "mkdir -p folder && touch folder/newfile.txt",
            "Create 'folder' directory and touch 'newfile.txt' inside it",
            "SAFE",
            "Creates the target directory structure and touches the file."
        )
    ),
    (
        r"(?i)^(?:create|make)\s+(?:a\s+)?(?:folder|directory|dir)\s+([a-zA-Z0-9_\-\./]+)$",
        lambda m: (
            f"mkdir -p {m.group(1).strip()}",
            f"Create directory '{m.group(1).strip()}' and any needed parent directories",
            "SAFE",
            f"Uses mkdir -p to safely allocate directory inodes for '{m.group(1).strip()}'."
        )
    ),
    (
        r"(?i)^(?:create|make|touch)\s+(?:a\s+)?file\s+([a-zA-Z0-9_\-\./]+)$",
        lambda m: (
            f"touch {m.group(1).strip()}",
            f"Create file '{m.group(1).strip()}'",
            "SAFE",
            f"Calls touch to create '{m.group(1).strip()}' or update its access timestamp."
        )
    ),
    (
        r"(?i)^(?:find|search|show)\s+(?:all\s+)?c\s+files.*$",
        lambda m: (
            "find . -name \"*.c\" -o -name \"*.h\"",
            "Find all C source and header files in the current working directory",
            "SAFE",
            "Recursively walks filesystem tree searching for .c and .h files."
        )
    ),
    (
        r"(?i)^(?:show|list)\s+detailed\s+files.*$",
        lambda m: (
            "ls -la",
            "List all files with permissions, owner, size, and modification timestamps",
            "SAFE",
            "Executes ls with long format and hidden files included."
        )
    ),
    (
        r"(?i)^(?:show|get|print)\s+current\s+directory.*$",
        lambda m: (
            "pwd",
            "Print current working directory absolute path",
            "SAFE",
            "Returns absolute POSIX path of current working directory."
        )
    ),
    (
        r"(?i)^(?:show|list)\s+running\s+processes.*$",
        lambda m: (
            "ps aux",
            "Display list of all active processes and resource consumption",
            "SAFE",
            "Reads /proc filesystem to aggregate process table entries."
        )
    ),
    (
        r"(?i)^(?:show|who)\s+(?:am\s+i|whoami).*$",
        lambda m: (
            "whoami",
            "Display current logged-in user name",
            "SAFE",
            "Retrieves username corresponding to current effective UID."
        )
    ),
    (
        r"(?i)^(?:show|get)\s+date.*$",
        lambda m: (
            "date",
            "Display current system date and time",
            "SAFE",
            "Queries system RTC clock and formats date output."
        )
    ),
    (
        r"(?i)^(?:show|check)\s+disk\s+(?:space|usage).*$",
        lambda m: (
            "df -h",
            "Display human-readable disk space usage by filesystem",
            "SAFE",
            "Inspects statvfs() for all mounted filesystems."
        )
    ),
    (
        r"(?i)^(?:show|check)\s+memory\s+(?:usage|stats).*$",
        lambda m: (
            "free -h",
            "Display total, used, and available RAM and Swap space",
            "SAFE",
            "Parses /proc/meminfo to show system RAM allocation."
        )
    )
]

def sanitize_and_fix_placeholders(cmd: str) -> str:
    """Removes invalid placeholders like /path/to/ and makes paths locally runnable."""
    fixed = cmd.strip()
    
    # Replace /path/to/folder/file with mkdir -p folder && touch folder/file
    if "/path/to/" in fixed:
        fixed = fixed.replace("/path/to/", "./")
    if "/path/to" in fixed:
        fixed = fixed.replace("/path/to", ".")
        
    # If touch target has a subdirectory that might not exist, ensure mkdir -p
    touch_match = re.match(r"^touch\s+([a-zA-Z0-9_\-\./]+)$", fixed)
    if touch_match:
        target = touch_match.group(1)
        if "/" in target and not target.startswith("/tmp") and not target.startswith("/dev"):
            parent_dir = os.path.dirname(target)
            if parent_dir and parent_dir != ".":
                fixed = f"mkdir -p {parent_dir} && touch {target}"

    return fixed

class IntentService:
    @staticmethod
    async def interpret(natural_request: str) -> CommandIntent:
        req = natural_request.strip()
        
        # 1. First check deterministic fast-path patterns
        for pattern, handler in COMMON_PATTERNS:
            match = re.match(pattern, req)
            if match:
                cmd, intent_desc, safety, expl = handler(match)
                return CommandIntent(
                    intent=intent_desc,
                    command=sanitize_and_fix_placeholders(cmd),
                    arguments=cmd.split(),
                    safety_level=safety,
                    explanation=expl
                )

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            # Fallback if no API key
            sanitized = sanitize_and_fix_placeholders(req)
            return CommandIntent(
                intent=f"Execute command '{sanitized}'",
                command=sanitized,
                arguments=sanitized.split(),
                safety_level="SAFE",
                explanation="Deterministic heuristic translation (No LLM key required)."
            )

        try:
            client = AsyncGroq(api_key=api_key)
            system_prompt = """You are a Principal Unix Systems Engineer and POSIX Shell translator.
Translate the user's natural language request into a valid, single-line POSIX-compliant shell command.

CRITICAL RULES:
1. NEVER use dummy placeholders like '/path/to/...', '<placeholder>', or non-existent absolute paths.
2. If creating files in a subfolder or directory, ALWAYS make sure the directory exists using 'mkdir -p <dir> && touch <dir>/<file>'.
3. Always generate clean, immediately runnable commands relative to the current working directory.
4. If the command deletes, removes, or overwrites files/directories (e.g. rm, dd, >), mark safety_level as "RISKY" or "BLOCKED". Otherwise "SAFE".

Respond ONLY with a valid JSON object matching this schema:
{
  "intent": "Concise summary of what the command does",
  "command": "The exact shell command without markdown",
  "arguments": ["arg1", "arg2"],
  "safety_level": "SAFE" | "RISKY" | "BLOCKED",
  "explanation": "Technical explanation of how the command operates"
}
Do not wrap response in markdown code blocks. Output plain JSON only."""

            chat_completion = await client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": req}
                ],
                model="qwen/qwen3.8-27b",
                temperature=0,
                response_format={"type": "json_object"},
            )
            
            response_json = json.loads(chat_completion.choices[0].message.content)
            raw_cmd = response_json.get("command", req)
            fixed_cmd = sanitize_and_fix_placeholders(raw_cmd)
            
            return CommandIntent(
                intent=response_json.get("intent", "Execute command"),
                command=fixed_cmd,
                arguments=fixed_cmd.split(),
                safety_level=response_json.get("safety_level", "SAFE"),
                explanation=response_json.get("explanation", "Generated by POSIX translator")
            )
            
        except Exception as e:
            # Fallback on any LLM or network error
            sanitized = sanitize_and_fix_placeholders(req)
            return CommandIntent(
                intent=f"Execute: {sanitized}",
                command=sanitized,
                arguments=sanitized.split(),
                safety_level="SAFE",
                explanation=f"Fallback translator used ({str(e)})"
            )
