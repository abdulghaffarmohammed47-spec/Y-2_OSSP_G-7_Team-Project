#include <stdio.h>
#include <unistd.h>
#include <signal.h>
#include <sys/wait.h>
#include <errno.h>

#include "signals.h"
#include "jobs.h"

static pid_t g_shell_pgid = 0;
static pid_t g_foreground_pgid = 0;

/*
 * Asynchronous SIGCHLD Handler
 * Uses non-blocking waitpid with WNOHANG | WUNTRACED | WCONTINUED
 * to harvest terminated, stopped, or continued child processes without blocking
 * the interactive REPL or leaking zombie processes.
 */
static void sigchld_handler(int sig) {
    (void)sig;
    int saved_errno = errno;
    pid_t pid;
    int status;

    while ((pid = waitpid(-1, &status, WNOHANG | WUNTRACED | WCONTINUED)) > 0) {
        jobs_update_status(pid, status);
        if (WIFEXITED(status) || WIFSIGNALED(status)) {
            jobs_remove(pid);
        }
    }
    errno = saved_errno;
}

/*
 * SIGINT Handler (Ctrl+C)
 * Ignored in shell parent so the shell remains responsive.
 * Forwarded to foreground process group if one is active.
 */
static void sigint_handler(int sig) {
    int saved_errno = errno;
    if (g_foreground_pgid > 0 && g_foreground_pgid != g_shell_pgid) {
        kill(-g_foreground_pgid, sig);
    } else {
        /* Just reprint prompt newline */
        write(STDOUT_FILENO, "\n", 1);
    }
    errno = saved_errno;
}

/*
 * SIGTSTP Handler (Ctrl+Z)
 * Forwarded to foreground process group to stop it.
 */
static void sigtstp_handler(int sig) {
    int saved_errno = errno;
    if (g_foreground_pgid > 0 && g_foreground_pgid != g_shell_pgid) {
        kill(-g_foreground_pgid, sig);
    } else {
        write(STDOUT_FILENO, "\n", 1);
    }
    errno = saved_errno;
}

void signals_init(void) {
    g_shell_pgid = getpgrp();

    /* Put shell in its own process group if not already */
    if (isatty(STDIN_FILENO)) {
        while (tcgetpgrp(STDIN_FILENO) != (g_shell_pgid = getpgrp())) {
            kill(-g_shell_pgid, SIGTTIN);
        }

        /* Ignore interactive control signals in parent */
        signal(SIGINT, sigint_handler);
        signal(SIGTSTP, sigtstp_handler);
        signal(SIGTTIN, SIG_IGN);
        signal(SIGTTOU, SIG_IGN);
        signal(SIGQUIT, SIG_IGN);

        /* Set shell as foreground process group */
        g_shell_pgid = getpid();
        if (setpgid(g_shell_pgid, g_shell_pgid) < 0 && errno != EPERM) {
            /* May already be group leader */
        }
        tcsetpgrp(STDIN_FILENO, g_shell_pgid);
    }

    /* Configure SIGCHLD with SA_RESTART to avoid interrupting syscalls */
    struct sigaction sa_chld;
    sa_chld.sa_handler = sigchld_handler;
    sigemptyset(&sa_chld.sa_mask);
    sa_chld.sa_flags = SA_RESTART;
    if (sigaction(SIGCHLD, &sa_chld, NULL) < 0) {
        perror("shellforge: sigaction SIGCHLD failed");
    }
}

void signals_set_foreground_pgrp(pid_t pgrp) {
    g_foreground_pgid = pgrp;
    if (isatty(STDIN_FILENO) && pgrp > 0) {
        tcsetpgrp(STDIN_FILENO, pgrp);
    }
}

void signals_restore_shell_pgrp(void) {
    g_foreground_pgid = 0;
    if (isatty(STDIN_FILENO) && g_shell_pgid > 0) {
        tcsetpgrp(STDIN_FILENO, g_shell_pgid);
    }
}

pid_t signals_get_shell_pgrp(void) {
    return g_shell_pgid;
}
