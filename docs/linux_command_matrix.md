# Linux Command Matrix

| Command | Category | Danger Level | Testable | Status |
|---------|----------|--------------|----------|--------|
| `find` | Search | SAFE | Yes | MISSING |
| `grep` | Search | SAFE | Yes | MISSING |
| `locate` | Search | SAFE | Yes | MISSING |
| `which` | Search | SAFE | Yes | MISSING |
| `whereis` | Search | SAFE | Yes | MISSING |
| `awk` | Search | SAFE | Yes | MISSING |
| `sed` | Search | SAFE | Yes | MISSING |
| `mkdir` | Files | CAUTION | Yes | MISSING |
| `rm` | Files | CAUTION | Yes | MISSING |
| `rm -r` | Files | CAUTION | Yes | MISSING |
| `rm -rf` | Files | DANGEROUS | No | MISSING |
| `cp` | Files | CAUTION | Yes | MISSING |
| `cp -r` | Files | CAUTION | Yes | MISSING |
| `mv` | Files | CAUTION | Yes | MISSING |
| `ln -s` | Files | CAUTION | Yes | MISSING |
| `touch` | Files | CAUTION | Yes | MISSING |
| `cat` | Files | SAFE | Yes | MISSING |
| `head` | Files | SAFE | Yes | MISSING |
| `tail` | Files | SAFE | Yes | MISSING |
| `more` | Files | INTERACTIVE | No | MISSING |
| `less` | Files | INTERACTIVE | No | MISSING |
| `nano` | Files | INTERACTIVE | No | MISSING |
| `vi` | Files | INTERACTIVE | No | MISSING |
| `vim` | Files | INTERACTIVE | No | MISSING |
| `gpg` | Files | CAUTION | Yes | MISSING |
| `wc` | Files | SAFE | Yes | MISSING |
| `xargs` | Files | SAFE | Yes | MISSING |
| `cut` | Files | SAFE | Yes | MISSING |
| `shred` | Files | DANGEROUS | No | MISSING |
| `diff` | Files | SAFE | Yes | MISSING |
| `source` | Files | CAUTION | Yes | MISSING |
| `tee` | Files | CAUTION | Yes | MISSING |
| `ls` | Navigation | SAFE | Yes | MISSING |
| `ls -a` | Navigation | SAFE | Yes | MISSING |
| `ls -l` | Navigation | SAFE | Yes | MISSING |
| `pwd` | Navigation | SAFE | Yes | MISSING |
| `cd` | Navigation | SAFE | Yes | MISSING |
| `cd ~` | Navigation | SAFE | Yes | MISSING |
| `cd ..` | Navigation | SAFE | Yes | MISSING |
| `cd -` | Navigation | SAFE | Yes | MISSING |
| `cd <path>` | Navigation | SAFE | Yes | MISSING |
| `dirs` | Navigation | SAFE | Yes | MISSING |
| `tar` | Compression | SAFE | Yes | MISSING |
| `gzip` | Compression | SAFE | Yes | MISSING |
| `gunzip` | Compression | SAFE | Yes | MISSING |
| `bzip2` | Compression | SAFE | Yes | MISSING |
| `bunzip2` | Compression | SAFE | Yes | MISSING |
| `ps` | Processes | SAFE | Yes | MISSING |
| `pstree` | Processes | SAFE | Yes | MISSING |
| `pmap` | Processes | SAFE | Yes | MISSING |
| `top` | Processes | INTERACTIVE | No | MISSING |
| `htop` | Processes | INTERACTIVE | No | MISSING |
| `kill` | Processes | SAFE | Yes | MISSING |
| `pkill` | Processes | SAFE | Yes | MISSING |
| `killall` | Processes | SAFE | Yes | MISSING |
| `pidof` | Processes | SAFE | Yes | MISSING |
| `bg` | Processes | SAFE | Yes | MISSING |
| `fg` | Processes | SAFE | Yes | MISSING |
| `lsof` | Processes | SAFE | Yes | MISSING |
| `trap` | Processes | SAFE | Yes | MISSING |
| `wait` | Processes | SAFE | Yes | MISSING |
| `nohup` | Processes | SAFE | Yes | MISSING |
| `uname` | System | SAFE | Yes | MISSING |
| `uptime` | System | SAFE | Yes | MISSING |
| `hostname` | System | SAFE | Yes | MISSING |
| `date` | System | SAFE | Yes | MISSING |
| `timedatectl` | System | SAFE | Yes | MISSING |
| `cal` | System | SAFE | Yes | MISSING |
| `who` | System | SAFE | Yes | MISSING |
| `whoami` | System | SAFE | Yes | MISSING |
| `ulimit` | System | SAFE | Yes | MISSING |
| `shutdown` | System | DANGEROUS | No | MISSING |
| `modprobe` | System | PRIVILEGED | No | MISSING |
| `dmesg` | System | SAFE | Yes | MISSING |
| `df` | Disk | SAFE | Yes | MISSING |
| `fdisk` | Disk | DANGEROUS | No | MISSING |
| `du` | Disk | SAFE | Yes | MISSING |
| `mount` | Disk | DANGEROUS | No | MISSING |
| `findmnt` | Disk | SAFE | Yes | MISSING |
| `ip` | Network | SAFE | Yes | MISSING |
| `ifconfig` | Network | SAFE | Yes | MISSING |
| `ping` | Network | SAFE | Yes | MISSING |
| `netstat` | Network | SAFE | Yes | MISSING |
| `whois` | Network | SAFE | Yes | MISSING |
| `dig` | Network | SAFE | Yes | MISSING |
| `host` | Network | SAFE | Yes | MISSING |
| `nslookup` | Network | SAFE | Yes | MISSING |
| `export` | Variables | SAFE | Yes | MISSING |
| `declare` | Variables | SAFE | Yes | MISSING |
| `set` | Variables | SAFE | Yes | MISSING |
| `unset` | Variables | SAFE | Yes | MISSING |
| `echo` | Variables | SAFE | Yes | MISSING |
| `alias` | Shell | SAFE | Yes | MISSING |
| `watch` | Shell | INTERACTIVE | No | MISSING |
| `sleep` | Shell | SAFE | Yes | MISSING |
| `at` | Shell | SAFE | Yes | MISSING |
| `man` | Shell | INTERACTIVE | No | MISSING |
| `history` | Shell | SAFE | Yes | MISSING |
| `lscpu` | Hardware | SAFE | Yes | MISSING |
| `lsblk` | Hardware | SAFE | Yes | MISSING |
| `lspci` | Hardware | SAFE | Yes | MISSING |
| `lsusb` | Hardware | SAFE | Yes | MISSING |
| `lshw` | Hardware | SAFE | Yes | MISSING |
| `cat /proc/cpuinfo` | Hardware | SAFE | Yes | MISSING |
| `cat /proc/meminfo` | Hardware | SAFE | Yes | MISSING |
| `cat /proc/mounts` | Hardware | SAFE | Yes | MISSING |
| `free` | Hardware | SAFE | Yes | MISSING |
| `dmidecode` | Hardware | PRIVILEGED | No | MISSING |
| `hdparm` | Hardware | PRIVILEGED | No | MISSING |
| `badblocks` | Hardware | DANGEROUS | No | MISSING |
| `fsck` | Hardware | DANGEROUS | No | MISSING |
| `useradd` | Users and Groups | PRIVILEGED | No | MISSING |
| `adduser` | Users and Groups | PRIVILEGED | No | MISSING |
| `userdel` | Users and Groups | PRIVILEGED | No | MISSING |
| `usermod` | Users and Groups | PRIVILEGED | No | MISSING |
| `passwd` | Users and Groups | PRIVILEGED | No | MISSING |
| `groupadd` | Users and Groups | PRIVILEGED | No | MISSING |
| `groupdel` | Users and Groups | PRIVILEGED | No | MISSING |
| `groupmod` | Users and Groups | PRIVILEGED | No | MISSING |
| `su` | Users and Groups | PRIVILEGED | No | MISSING |
| `sudo` | Users and Groups | PRIVILEGED | No | MISSING |
| `apt` | Packages | PRIVILEGED | No | MISSING |
| `apt-get` | Packages | PRIVILEGED | No | MISSING |
| `dpkg` | Packages | PRIVILEGED | No | MISSING |
| `yum` | Packages | PRIVILEGED | No | MISSING |
| `dnf` | Packages | PRIVILEGED | No | MISSING |
| `rpm` | Packages | PRIVILEGED | No | MISSING |
| `snap` | Packages | PRIVILEGED | No | MISSING |
| `flatpak` | Packages | PRIVILEGED | No | MISSING |
| `ssh` | Remote | INTERACTIVE | No | MISSING |
| `scp` | Remote | REMOTE | No | MISSING |
| `rsync` | Remote | REMOTE | No | MISSING |
| `sftp` | Remote | INTERACTIVE | No | MISSING |
| `ftp` | Remote | INTERACTIVE | No | MISSING |
| `telnet` | Remote | INTERACTIVE | No | MISSING |
| `wget` | Remote | REMOTE | No | MISSING |
| `curl` | Remote | REMOTE | No | MISSING |
| `chmod` | Permissions | CAUTION | Yes | MISSING |
| `chown` | Permissions | CAUTION | Yes | MISSING |
| `chgrp` | Permissions | CAUTION | Yes | MISSING |
| `Ctrl+C` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+Z` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+W` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+U` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+K` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+Y` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+R` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+O` | Shortcuts | SAFE | Yes | MISSING |
| `Ctrl+G` | Shortcuts | SAFE | Yes | MISSING |
| `clear` | Shortcuts | SAFE | Yes | MISSING |
| `!!` | Shortcuts | SAFE | Yes | MISSING |
| `exit` | Shortcuts | SAFE | Yes | MISSING |
