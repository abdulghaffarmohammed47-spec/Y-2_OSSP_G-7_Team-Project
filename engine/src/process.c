#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>
#include <errno.h>
#include <string.h>

#include "process.h"

int process_spawn_and_wait(char **args, process_result_t *result) {
    if (!args || !args[0]) {
        return -1;
    }

    pid_t pid = fork();

    if (pid < 0) {
        perror("shellforge: fork failed");
        return -1;
    }

    if (pid == 0) {
        /* Child process */
        execvp(args[0], args);

        /* Exec failed if we reach here */
        if (errno == ENOENT) {
            fprintf(stderr, "shellforge: command not found: %s\n", args[0]);
            _exit(127);
        } else if (errno == EACCES) {
            fprintf(stderr, "shellforge: permission denied: %s\n", args[0]);
            _exit(126);
        } else {
            fprintf(stderr, "shellforge: exec failure (%s): %s\n", args[0], strerror(errno));
            _exit(126);
        }
    } else {
        /* Parent process */
        int status = 0;
        if (waitpid(pid, &status, 0) < 0) {
            perror("shellforge: waitpid failed");
            return -1;
        }

        if (result) {
            result->pid = pid;
            result->ppid = getpid();
            if (WIFEXITED(status)) {
                result->exit_code = WEXITSTATUS(status);
                result->terminated_by_signal = 0;
                result->term_signal = 0;
            } else if (WIFSIGNALED(status)) {
                result->exit_code = 128 + WTERMSIG(status);
                result->terminated_by_signal = 1;
                result->term_signal = WTERMSIG(status);
            }
        }
        return 0;
    }
}

void process_format_result(const process_result_t *res, char *buffer, size_t buf_size) {
    if (!res || !buffer || buf_size == 0) return;
    if (res->terminated_by_signal) {
        snprintf(buffer, buf_size, "PID %d (PPID %d) terminated by signal %d (exit code %d)",
                 res->pid, res->ppid, res->term_signal, res->exit_code);
    } else {
        snprintf(buffer, buf_size, "PID %d (PPID %d) exited with code %d",
                 res->pid, res->ppid, res->exit_code);
    }
}
