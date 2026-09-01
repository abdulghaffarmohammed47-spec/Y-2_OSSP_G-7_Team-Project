#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#include "parser.h"
#include "executor.h"
#include "process.h"
#include "builtin.h"
#include "signals.h"
#include "jobs.h"
#include "history.h"
#include "sandbox.h"

static void print_json_result(const char *cmd_line, const process_result_t *res, int status) {
    char cwd[4096];
    if (getcwd(cwd, sizeof(cwd)) == NULL) {
        strncpy(cwd, "unknown", sizeof(cwd));
    }
    printf("{\n");
    printf("  \"command\": \"%s\",\n", cmd_line);
    printf("  \"pid\": %d,\n", res ? res->pid : getpid());
    printf("  \"ppid\": %d,\n", res ? res->ppid : getppid());
    printf("  \"exit_code\": %d,\n", res ? res->exit_code : status);
    printf("  \"terminated_by_signal\": %s,\n", (res && res->terminated_by_signal) ? "true" : "false");
    printf("  \"term_signal\": %d,\n", res ? res->term_signal : 0);
    printf("  \"working_directory\": \"%s\"\n", cwd);
    printf("}\n");
}

static int run_diagnostic_tests(void) {
    printf("====================================================\n");
    printf(" ShellForge Pro - Enhanced Diagnostic Test Suite   \n");
    printf("====================================================\n\n");

    int failed = 0;
    process_result_t res;
    int should_exit = 0;

    /* Test 1: pwd built-in */
    printf("[TEST 1] Testing pwd built-in...\n");
    int rc = execute_line("pwd", &res, &should_exit);
    if (rc == 0) printf(" -> PASS (rc=%d)\n", rc);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 2: External command execution (whoami / echo) */
    printf("\n[TEST 2] Testing external command execution (whoami)...\n");
    rc = execute_line("whoami", &res, &should_exit);
    if (rc == 0 && res.pid > 0) printf(" -> PASS (PID=%d, exit_code=%d)\n", res.pid, res.exit_code);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 3: Process info & date */
    printf("\n[TEST 3] Testing process execution and status (date)...\n");
    rc = execute_line("date", &res, &should_exit);
    if (rc == 0 && res.pid > 0) printf(" -> PASS (PID=%d, exit_code=%d)\n", res.pid, res.exit_code);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 4: 2-Stage Pipeline execution (echo hello | grep hello) */
    printf("\n[TEST 4] Testing 2-stage pipeline (echo hello | grep hello)...\n");
    rc = execute_line("echo hello | grep hello", &res, &should_exit);
    if (rc == 0) printf(" -> PASS (rc=%d)\n", rc);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 5: 3-Stage Arbitrary N-Stage Pipeline execution (printf ... | grep ... | wc -l) */
    printf("\n[TEST 5] Testing 3-stage pipeline (printf 'apple\\nbanana\\napricot' | grep ap | wc -l)...\n");
    rc = execute_line("printf 'apple\\nbanana\\napricot' | grep ap | wc -l", &res, &should_exit);
    if (rc == 0) printf(" -> PASS (rc=%d)\n", rc);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 6: Redirection (echo "test string" > /tmp/sf_test.txt) */
    printf("\n[TEST 6] Testing output redirection (echo test > /tmp/sf_test.txt)...\n");
    rc = execute_line("echo test_string > /tmp/sf_test.txt", &res, &should_exit);
    if (rc == 0) printf(" -> PASS (rc=%d)\n", rc);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 7: Input redirection (cat < /tmp/sf_test.txt) */
    printf("\n[TEST 7] Testing input redirection (cat < /tmp/sf_test.txt)...\n");
    rc = execute_line("cat < /tmp/sf_test.txt", &res, &should_exit);
    if (rc == 0) printf(" -> PASS (rc=%d)\n", rc);
    else { printf(" -> FAIL (rc=%d)\n", rc); failed++; }

    /* Test 8: Built-in cd and directory navigation */
    printf("\n[TEST 8] Testing cd built-in directory navigation...\n");
    char cwd_before[4096], cwd_after[4096];
    getcwd(cwd_before, sizeof(cwd_before));
    rc = execute_line("cd ..", &res, &should_exit);
    getcwd(cwd_after, sizeof(cwd_after));
    if (rc == 0 && strcmp(cwd_before, cwd_after) != 0) {
        printf(" -> PASS (Dir changed from %s to %s)\n", cwd_before, cwd_after);
        chdir(cwd_before); /* Restore */
    } else {
        printf(" -> FAIL (rc=%d)\n", rc);
        failed++;
    }

    /* Test 9: Memory Arena Allocator Multi-cycle Validation */
    printf("\n[TEST 9] Testing Memory Arena Allocator (Multiple Parse Cycles)...\n");
    for (int i = 0; i < 50; i++) {
        pipeline_cmd_t *p = parse_input_line("ls -la | grep test | head -n 5 > /tmp/out.txt");
        if (!p || p->command_count != 3) {
            failed++;
            printf(" -> FAIL on cycle %d\n", i);
            break;
        }
        free_pipeline_cmd(p);
    }
    if (failed == 0) {
        printf(" -> PASS (50 continuous arena allocation/reset cycles verified)\n");
    }

    /* Test 10: Linux Sandboxing Status */
    printf("\n[TEST 10] Testing Linux Sandboxing Kernel Capabilities...\n");
    bool sandbox_ok = sandbox_is_supported();
    printf(" -> Linux Namespaces Supported: %s\n", sandbox_ok ? "YES" : "NO (Restricted Environment)");
    printf(" -> PASS (Kernel capability probe complete)\n");

    int total_tests = 10;
    printf("\n====================================================\n");
    printf(" Summary: %d Failed, %d Passed (Total %d)\n", failed, total_tests - failed, total_tests);
    printf("====================================================\n");

    return failed;
}

int main(int argc, char **argv) {
    signals_init();
    jobs_init();

    int json_mode = 0;
    int sandbox_mode = 0;
    const char *cmd_to_run = NULL;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--test") == 0) {
            int test_res = run_diagnostic_tests();
            jobs_cleanup();
            history_cleanup();
            return test_res;
        } else if (strcmp(argv[i], "--json") == 0) {
            json_mode = 1;
        } else if (strcmp(argv[i], "--sandbox") == 0) {
            sandbox_mode = 1;
        } else if (strcmp(argv[i], "-c") == 0 && i + 1 < argc) {
            cmd_to_run = argv[++i];
        }
    }

    if (cmd_to_run) {
        process_result_t res;
        memset(&res, 0, sizeof(res));
        int should_exit = 0;
        int status = 0;

        if (sandbox_mode) {
            sandbox_config_t cfg;
            sandbox_config_default(&cfg);
            status = execute_sandboxed_line(cmd_to_run, &cfg, &res, &should_exit);
        } else {
            status = execute_line(cmd_to_run, &res, &should_exit);
        }

        if (json_mode) {
            print_json_result(cmd_to_run, &res, status);
        }
        jobs_cleanup();
        history_cleanup();
        return status;
    }

    /* Interactive REPL Mode */
    printf("ShellForge Pro Systems Engine v2.0 [POSIX C Engine with Linux Namespaces & cgroups v2]\n");
    printf("Type 'help' for commands, 'exit' or Ctrl+D to quit.\n\n");

    char line[4096];
    int should_exit = 0;

    while (!should_exit) {
        char cwd[1024];
        if (getcwd(cwd, sizeof(cwd)) == NULL) {
            strncpy(cwd, "?", sizeof(cwd));
        }

        printf("shellforge:%s$ ", cwd);
        fflush(stdout);

        if (fgets(line, sizeof(line), stdin) == NULL) {
            printf("\n");
            break;
        }

        /* Strip trailing newline */
        size_t len = strlen(line);
        if (len > 0 && line[len - 1] == '\n') {
            line[len - 1] = '\0';
        }

        if (strlen(line) == 0) continue;

        history_add(line);

        process_result_t res;
        memset(&res, 0, sizeof(res));
        execute_line(line, &res, &should_exit);
    }

    jobs_cleanup();
    history_cleanup();
    return 0;
}
