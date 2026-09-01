#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/wait.h>
#include <errno.h>
#include <string.h>

#include "executor.h"
#include "builtin.h"
#include "process.h"
#include "jobs.h"
#include "redirect.h"
#include "signals.h"
#include "sandbox.h"

int execute_single_command(command_t *cmd, process_result_t *last_result, int *should_exit) {
    if (!cmd || !cmd->args || !cmd->args[0]) {
        return 0;
    }

    /* Check for built-in command without redirection executed directly in parent */
    if (is_builtin(cmd->args[0]) && !redirect_has_redirection(cmd) && !cmd->is_background) {
        int status = 0;
        execute_builtin(cmd->args, &status, should_exit);
        if (last_result) {
            last_result->pid = getpid();
            last_result->ppid = getppid();
            last_result->exit_code = status;
            last_result->terminated_by_signal = 0;
            last_result->term_signal = 0;
        }
        return status;
    }

    pid_t pid = fork();
    if (pid < 0) {
        perror("shellforge: fork failed");
        return -1;
    }

    if (pid == 0) {
        /* Child Process: isolate into dedicated process group */
        setpgid(0, 0);

        /* Apply file descriptor redirections */
        if (redirect_apply(cmd) < 0) {
            _exit(1);
        }

        /* Built-in executed in child space */
        if (is_builtin(cmd->args[0])) {
            int status = 0;
            int exit_flag = 0;
            execute_builtin(cmd->args, &status, &exit_flag);
            _exit(status);
        }

        execvp(cmd->args[0], cmd->args);

        /* Error handling on exec failure */
        if (errno == ENOENT) {
            fprintf(stderr, "shellforge: command not found: %s\n", cmd->args[0]);
            _exit(127);
        } else if (errno == EACCES) {
            fprintf(stderr, "shellforge: permission denied: %s\n", cmd->args[0]);
            _exit(126);
        } else {
            fprintf(stderr, "shellforge: exec error (%s): %s\n", cmd->args[0], strerror(errno));
            _exit(126);
        }
    } else {
        /* Parent Process: ensure PGID is set to avoid race condition */
        setpgid(pid, pid);

        if (cmd->is_background) {
            int jid = jobs_add(pid, pid, cmd->args[0], JOB_RUNNING);
            printf("[%d] %d\n", jid, pid);
            if (last_result) {
                last_result->pid = pid;
                last_result->ppid = getpid();
                last_result->exit_code = 0;
                last_result->terminated_by_signal = 0;
                last_result->term_signal = 0;
            }
            return 0;
        } else {
            /* Hand over terminal control to foreground child group */
            signals_set_foreground_pgrp(pid);

            int status = 0;
            waitpid(pid, &status, WUNTRACED);
            
            /* Restore terminal control back to shell */
            signals_restore_shell_pgrp();

            if (WIFSTOPPED(status)) {
                int jid = jobs_add(pid, pid, cmd->args[0], JOB_STOPPED);
                printf("\n[%d]+ Stopped  PID %d\n", jid, pid);
            }
            
            int exit_code = 0;
            int sig_num = 0;
            int term_by_sig = 0;

            if (WIFEXITED(status)) {
                exit_code = WEXITSTATUS(status);
            } else if (WIFSIGNALED(status)) {
                sig_num = WTERMSIG(status);
                exit_code = 128 + sig_num;
                term_by_sig = 1;
            }

            if (last_result) {
                last_result->pid = pid;
                last_result->ppid = getpid();
                last_result->exit_code = exit_code;
                last_result->terminated_by_signal = term_by_sig;
                last_result->term_signal = sig_num;
            }
            return exit_code;
        }
    }
}

/*
 * Arbitrary N-Stage Pipeline Execution
 * Dynamically allocates (N - 1) pipe descriptors (pipefds[2 * (N - 1)]).
 * Sets up non-blocking stream plumbing, closes unneeded descriptors in child space,
 * and maintains process group isolation across the entire pipeline.
 */
int execute_pipeline_cmd(pipeline_cmd_t *pipeline, process_result_t *last_result, int *should_exit) {
    if (!pipeline || pipeline->command_count == 0) return 0;

    if (pipeline->command_count == 1) {
        return execute_single_command(&pipeline->commands[0], last_result, should_exit);
    }

    int num_cmds = pipeline->command_count;
    int num_pipes = num_cmds - 1;
    int *pipefds = (int*)malloc(sizeof(int) * (2 * num_pipes));
    if (!pipefds) {
        perror("shellforge: pipeline malloc failed");
        return -1;
    }

    for (int i = 0; i < num_pipes; i++) {
        if (pipe(pipefds + i * 2) < 0) {
            perror("shellforge: pipe creation failed");
            for (int j = 0; j < i * 2; j++) close(pipefds[j]);
            free(pipefds);
            return -1;
        }
    }

    pid_t *pids = (pid_t*)malloc(sizeof(pid_t) * num_cmds);
    if (!pids) {
        perror("shellforge: pids malloc failed");
        for (int j = 0; j < 2 * num_pipes; j++) close(pipefds[j]);
        free(pipefds);
        return -1;
    }

    pid_t pgid = 0;

    for (int i = 0; i < num_cmds; i++) {
        command_t *cmd = &pipeline->commands[i];
        pids[i] = fork();

        if (pids[i] < 0) {
            perror("shellforge: fork failed in pipeline");
            for (int j = 0; j < 2 * num_pipes; j++) close(pipefds[j]);
            free(pipefds);
            free(pids);
            return -1;
        }

        if (pids[i] == 0) {
            /* Child process: group isolation */
            if (i == 0) {
                setpgid(0, 0);
            } else {
                setpgid(0, pgid);
            }

            /* Bind previous pipe read end to STDIN */
            if (i > 0) {
                if (dup2(pipefds[(i - 1) * 2], STDIN_FILENO) < 0) {
                    perror("shellforge: dup2 pipeline stdin failed");
                    _exit(1);
                }
            }

            /* Bind next pipe write end to STDOUT */
            if (i < num_cmds - 1) {
                if (dup2(pipefds[i * 2 + 1], STDOUT_FILENO) < 0) {
                    perror("shellforge: dup2 pipeline stdout failed");
                    _exit(1);
                }
            }

            /* Close all pipe descriptors in child space */
            for (int j = 0; j < 2 * num_pipes; j++) {
                close(pipefds[j]);
            }

            /* Apply file redirections if specified on this command */
            if (redirect_apply(cmd) < 0) {
                _exit(1);
            }

            /* Execute builtin */
            if (is_builtin(cmd->args[0])) {
                int status = 0;
                int exit_flag = 0;
                execute_builtin(cmd->args, &status, &exit_flag);
                _exit(status);
            }

            execvp(cmd->args[0], cmd->args);
            if (errno == ENOENT) {
                fprintf(stderr, "shellforge: command not found: %s\n", cmd->args[0]);
                _exit(127);
            } else {
                fprintf(stderr, "shellforge: exec failure (%s): %s\n", cmd->args[0], strerror(errno));
                _exit(126);
            }
        } else {
            /* Parent process: configure process group */
            if (i == 0) {
                pgid = pids[i];
                setpgid(pids[i], pids[i]);
            } else {
                setpgid(pids[i], pgid);
            }
        }
    }

    /* Parent process: close all pipe fds to allow EOF signaling */
    for (int i = 0; i < 2 * num_pipes; i++) {
        close(pipefds[i]);
    }
    free(pipefds);

    if (pipeline->is_background) {
        int jid = jobs_add(pgid, pgid, pipeline->raw_line, JOB_RUNNING);
        printf("[%d] %d\n", jid, pgid);
        if (last_result) {
            last_result->pid = pids[num_cmds - 1];
            last_result->ppid = getpid();
            last_result->exit_code = 0;
            last_result->terminated_by_signal = 0;
            last_result->term_signal = 0;
        }
        free(pids);
        return 0;
    }

    /* Hand over terminal control to pipeline process group */
    signals_set_foreground_pgrp(pgid);

    /* Wait for all child processes in the pipeline */
    int last_exit_code = 0;
    int last_term_sig = 0;
    int last_sig_terminated = 0;

    for (int i = 0; i < num_cmds; i++) {
        int status = 0;
        waitpid(pids[i], &status, WUNTRACED);
        
        if (i == num_cmds - 1) {
            if (WIFSTOPPED(status)) {
                int jid = jobs_add(pgid, pgid, pipeline->raw_line, JOB_STOPPED);
                printf("\n[%d]+ Stopped  PGID %d\n", jid, pgid);
            }
            
            if (WIFEXITED(status)) {
                last_exit_code = WEXITSTATUS(status);
            } else if (WIFSIGNALED(status)) {
                last_term_sig = WTERMSIG(status);
                last_exit_code = 128 + last_term_sig;
                last_sig_terminated = 1;
            }
        }
    }

    signals_restore_shell_pgrp();

    if (last_result) {
        last_result->pid = pids[num_cmds - 1];
        last_result->ppid = getpid();
        last_result->exit_code = last_exit_code;
        last_result->terminated_by_signal = last_sig_terminated;
        last_result->term_signal = last_term_sig;
    }

    free(pids);
    return last_exit_code;
}

int execute_sandboxed_line(const char *line, const sandbox_config_t *config, process_result_t *last_result, int *should_exit) {
    if (!line) return 0;
    (void)should_exit;

    pipeline_cmd_t *pipeline = parse_input_line(line);
    if (!pipeline || pipeline->command_count == 0) {
        free_pipeline_cmd(pipeline);
        return 0;
    }

    /* Spawn sandboxed execution */
    pid_t child_pid = 0;
    int status = 0;

    if (pipeline->command_count == 1) {
        command_t *cmd = &pipeline->commands[0];
        if (spawn_sandboxed_process(cmd->args, config, &child_pid) < 0) {
            free_pipeline_cmd(pipeline);
            return -1;
        }
    } else {
        /* If multi-stage in sandbox, run via /bin/sh -c */
        char *sh_args[] = { (char*)"/bin/sh", (char*)"-c", (char*)line, NULL };
        if (spawn_sandboxed_process(sh_args, config, &child_pid) < 0) {
            free_pipeline_cmd(pipeline);
            return -1;
        }
    }

    waitpid(child_pid, &status, 0);

    int exit_code = 0;
    int term_sig = 0;
    int is_sig = 0;

    if (WIFEXITED(status)) {
        exit_code = WEXITSTATUS(status);
    } else if (WIFSIGNALED(status)) {
        term_sig = WTERMSIG(status);
        exit_code = 128 + term_sig;
        is_sig = 1;
    }

    if (last_result) {
        last_result->pid = child_pid;
        last_result->ppid = getpid();
        last_result->exit_code = exit_code;
        last_result->terminated_by_signal = is_sig;
        last_result->term_signal = term_sig;
    }

    free_pipeline_cmd(pipeline);
    return exit_code;
}

int execute_line(const char *line, process_result_t *last_result, int *should_exit) {
    if (!line) return 0;
    pipeline_cmd_t *pipeline = parse_input_line(line);
    if (!pipeline) return 0;

    int res = execute_pipeline_cmd(pipeline, last_result, should_exit);
    free_pipeline_cmd(pipeline);
    return res;
}
