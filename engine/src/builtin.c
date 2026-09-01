#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <errno.h>

#include "builtin.h"
#include "jobs.h"
#include "history.h"
#include "sandbox.h"
#include "signals.h"

int is_builtin(const char *cmd) {
    if (!cmd) return 0;
    return (strcmp(cmd, "cd") == 0 ||
            strcmp(cmd, "pwd") == 0 ||
            strcmp(cmd, "exit") == 0 ||
            strcmp(cmd, "quit") == 0 ||
            strcmp(cmd, "jobs") == 0 ||
            strcmp(cmd, "fg") == 0 ||
            strcmp(cmd, "bg") == 0 ||
            strcmp(cmd, "history") == 0 ||
            strcmp(cmd, "sandbox") == 0 ||
            strcmp(cmd, "help") == 0);
}

int execute_builtin(char **args, int *status, int *should_exit) {
    if (!args || !args[0]) return -1;
    *status = 0;

    if (strcmp(args[0], "exit") == 0 || strcmp(args[0], "quit") == 0) {
        if (args[1]) {
            *status = atoi(args[1]);
        }
        if (should_exit) *should_exit = 1;
        return 0;
    }

    if (strcmp(args[0], "cd") == 0) {
        const char *target = args[1];
        if (!target) {
            target = getenv("HOME");
            if (!target) target = "/";
        }
        if (chdir(target) != 0) {
            fprintf(stderr, "shellforge: cd: %s: %s\n", target, strerror(errno));
            *status = 1;
        }
        return 0;
    }

    if (strcmp(args[0], "pwd") == 0) {
        char cwd[4096];
        if (getcwd(cwd, sizeof(cwd)) != NULL) {
            printf("%s\n", cwd);
        } else {
            perror("shellforge: pwd failed");
            *status = 1;
        }
        return 0;
    }

    if (strcmp(args[0], "jobs") == 0) {
        jobs_list();
        return 0;
    }

    if (strcmp(args[0], "fg") == 0) {
        if (!args[1]) {
            fprintf(stderr, "shellforge: fg: job id required (e.g. fg 1)\n");
            *status = 1;
            return 0;
        }
        int jid = atoi(args[1]);
        job_t *job = jobs_find_by_id(jid);
        if (!job) {
            fprintf(stderr, "shellforge: fg: %d: no such job\n", jid);
            *status = 1;
            return 0;
        }

        pid_t pgid = job->pgid;
        signals_set_foreground_pgrp(pgid);

        /* Send SIGCONT if it was stopped */
        if (job->state == JOB_STOPPED) {
            kill(-pgid, SIGCONT);
            job->state = JOB_RUNNING;
        }

        printf("%s\n", job->command ? job->command : "");
        int wait_status = 0;
        waitpid(-pgid, &wait_status, WUNTRACED);

        if (WIFSTOPPED(wait_status)) {
            job->state = JOB_STOPPED;
            printf("\n[Job stopped] %d\n", jid);
        } else if (WIFEXITED(wait_status) || WIFSIGNALED(wait_status)) {
            jobs_remove(job->pid);
        }

        signals_restore_shell_pgrp();
        return 0;
    }

    if (strcmp(args[0], "bg") == 0) {
        if (!args[1]) {
            fprintf(stderr, "shellforge: bg: job id required (e.g. bg 1)\n");
            *status = 1;
            return 0;
        }
        int jid = atoi(args[1]);
        job_t *job = jobs_find_by_id(jid);
        if (!job) {
            fprintf(stderr, "shellforge: bg: %d: no such job\n", jid);
            *status = 1;
            return 0;
        }

        if (job->state == JOB_STOPPED) {
            kill(-job->pgid, SIGCONT);
            job->state = JOB_RUNNING;
            printf("[%d]+ %s &\n", job->job_id, job->command ? job->command : "");
        }
        return 0;
    }

    if (strcmp(args[0], "history") == 0) {
        history_print();
        return 0;
    }

    if (strcmp(args[0], "sandbox") == 0) {
        if (!args[1] || strcmp(args[1], "status") == 0) {
            printf("ShellForge Kernel Sandbox Status:\n");
            printf("  Linux Namespaces: %s\n", sandbox_is_supported() ? "Supported (Available)" : "Disabled / Unavailable");
            printf("  cgroups v2:       Enabled (Limits: 128MB Memory, 32 PIDs, 20%% CPU quota)\n");
            printf("  Default Isolation: CLONE_NEWPID, CLONE_NEWNS, CLONE_NEWNET, CLONE_NEWUTS, CLONE_NEWIPC, CLONE_NEWUSER\n");
            return 0;
        } else if (strcmp(args[1], "run") == 0 && args[2]) {
            sandbox_config_t cfg;
            sandbox_config_default(&cfg);
            pid_t s_pid = 0;
            if (spawn_sandboxed_process(&args[2], &cfg, &s_pid) == 0) {
                int s_status = 0;
                waitpid(s_pid, &s_status, 0);
                if (WIFEXITED(s_status)) {
                    *status = WEXITSTATUS(s_status);
                } else if (WIFSIGNALED(s_status)) {
                    *status = 128 + WTERMSIG(s_status);
                }
            } else {
                *status = 1;
            }
            return 0;
        } else {
            fprintf(stderr, "shellforge: sandbox: usage: sandbox [status | run <command ...>]\n");
            *status = 1;
            return 0;
        }
    }

    if (strcmp(args[0], "help") == 0) {
        printf("ShellForge Pro - Intelligent Unix Systems Console (POSIX Engine)\n");
        printf("Built-in commands:\n");
        printf("  cd [dir]              Change current working directory\n");
        printf("  pwd                   Print current working directory\n");
        printf("  jobs                  List active background and stopped jobs\n");
        printf("  fg <job_id>           Bring job to foreground\n");
        printf("  bg <job_id>           Resume job in background\n");
        printf("  history               Show recent command history\n");
        printf("  sandbox [status|run]  Inspect or run inside Linux namespace/cgroup sandbox\n");
        printf("  help                  Display this help message\n");
        printf("  exit [code]           Exit the shell\n");
        return 0;
    }

    return -1;
}
