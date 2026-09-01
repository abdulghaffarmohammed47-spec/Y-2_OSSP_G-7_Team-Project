import json
import os

COMMANDS_RAW = {
    "Search": ["find", "grep", "locate", "which", "whereis", "awk", "sed"],
    "Files": ["mkdir", "rm", "rm -r", "rm -rf", "cp", "cp -r", "mv", "ln -s", "touch", "cat", "head", "tail", "more", "less", "nano", "vi", "vim", "gpg", "wc", "xargs", "cut", "shred", "diff", "source", "tee"],
    "Navigation": ["ls", "ls -a", "ls -l", "pwd", "cd", "cd ~", "cd ..", "cd -", "cd <path>", "dirs"],
    "Compression": ["tar", "gzip", "gunzip", "bzip2", "bunzip2"],
    "Processes": ["ps", "pstree", "pmap", "top", "htop", "kill", "pkill", "killall", "pidof", "bg", "fg", "lsof", "trap", "wait", "nohup"],
    "System": ["uname", "uptime", "hostname", "date", "timedatectl", "cal", "who", "whoami", "ulimit", "shutdown", "modprobe", "dmesg"],
    "Disk": ["df", "fdisk", "du", "mount", "findmnt"],
    "Network": ["ip", "ifconfig", "ping", "netstat", "whois", "dig", "host", "nslookup"],
    "Variables": ["export", "declare", "set", "unset", "echo"],
    "Shell": ["alias", "watch", "sleep", "at", "man", "history"],
    "Hardware": ["lscpu", "lsblk", "lspci", "lsusb", "lshw", "cat /proc/cpuinfo", "cat /proc/meminfo", "cat /proc/mounts", "free", "dmidecode", "hdparm", "badblocks", "fsck"],
    "Users and Groups": ["useradd", "adduser", "userdel", "usermod", "passwd", "groupadd", "groupdel", "groupmod", "su", "sudo"],
    "Packages": ["apt", "apt-get", "dpkg", "yum", "dnf", "rpm", "snap", "flatpak"],
    "Remote": ["ssh", "scp", "rsync", "sftp", "ftp", "telnet", "wget", "curl"],
    "Permissions": ["chmod", "chown", "chgrp"],
    "Shortcuts": ["Ctrl+C", "Ctrl+Z", "Ctrl+W", "Ctrl+U", "Ctrl+K", "Ctrl+Y", "Ctrl+R", "Ctrl+O", "Ctrl+G", "clear", "!!", "exit"]
}

def determine_danger(cmd, category):
    cmd_base = cmd.split()[0]
    
    if category == "Shortcuts":
        return "SAFE"
    
    dangerous = {"rm -rf", "shred", "badblocks", "fsck", "fdisk", "mount", "shutdown", "poweroff", "reboot"}
    if cmd in dangerous or cmd_base in dangerous:
        return "DANGEROUS"
    
    privileged = {"sudo", "su", "dmidecode", "hdparm", "useradd", "adduser", "userdel", "usermod", "passwd", "groupadd", "groupdel", "groupmod", "apt", "apt-get", "dpkg", "yum", "dnf", "rpm", "snap", "flatpak", "modprobe"}
    if cmd_base in privileged:
        return "PRIVILEGED"
        
    interactive = {"nano", "vi", "vim", "ftp", "sftp", "ssh", "telnet", "top", "htop", "watch", "man", "less", "more"}
    if cmd_base in interactive:
        return "INTERACTIVE"
        
    remote = {"ssh", "scp", "rsync", "sftp", "ftp", "telnet", "wget", "curl"}
    if cmd_base in remote:
        return "REMOTE"
        
    caution = {"rm", "rm -r", "cp", "mv", "ln -s", "touch", "mkdir", "chmod", "chown", "chgrp", "source", "tee", "gpg"}
    if cmd in caution or cmd_base in caution:
        return "CAUTION"
        
    return "SAFE"

def determine_testability(danger_level, category):
    if danger_level == "SAFE": return True
    if danger_level == "CAUTION": return True # Can test in sandbox
    return False

def requires_sudo(danger_level):
    return danger_level == "PRIVILEGED"

def requires_network(category):
    return category in ["Network", "Remote", "Packages"]

def build_catalog():
    catalog = []
    for category, cmds in COMMANDS_RAW.items():
        for cmd in cmds:
            danger = determine_danger(cmd, category)
            is_testable = determine_testability(danger, category)
            
            entry = {
                "command": cmd,
                "category": category,
                "description": f"Linux command: {cmd}",
                "arguments": " ".join(cmd.split()[1:]) if len(cmd.split()) > 1 else "",
                "danger_level": danger,
                "requires_sudo": requires_sudo(danger),
                "requires_network": requires_network(category),
                "requires_optional_package": category in ["Packages"] or cmd.split()[0] in ["htop", "tree", "curl", "wget"],
                "interactive": danger == "INTERACTIVE",
                "supported_by_shellforge": False,
                "testable_automatically": is_testable,
                "implementation_status": "MISSING",
                "notes": "Extracted from cheat sheet."
            }
            catalog.append(entry)
    return catalog

catalog = build_catalog()

os.makedirs("../docs", exist_ok=True)
with open("../docs/linux_command_catalog.json", "w") as f:
    json.dump(catalog, f, indent=2)

with open("../docs/linux_command_matrix.md", "w") as f:
    f.write("# Linux Command Matrix\n\n")
    f.write("| Command | Category | Danger Level | Testable | Status |\n")
    f.write("|---------|----------|--------------|----------|--------|\n")
    for c in catalog:
        f.write(f"| `{c['command']}` | {c['category']} | {c['danger_level']} | {'Yes' if c['testable_automatically'] else 'No'} | {c['implementation_status']} |\n")

print("Generated docs/linux_command_catalog.json and docs/linux_command_matrix.md")
