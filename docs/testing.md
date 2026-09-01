# Testing & Quality Assurance

## C Engine Tests
Compiled with `-Wall -Wextra -Wpedantic -g`.

Run diagnostic tests using:
```bash
wsl make -C ShellForge-Pro/engine test
```

Tests cover:
1. `pwd` built-in execution
2. External command execution (`whoami`, `date`)
3. Process creation & PID / exit status tracking
4. Pipeline creation (`echo hello | grep hello`)
5. Output file redirection (`echo test > /tmp/sf_test.txt`)
6. Input file redirection (`cat < /tmp/sf_test.txt`)
7. `cd` built-in working directory change (`chdir()`)
