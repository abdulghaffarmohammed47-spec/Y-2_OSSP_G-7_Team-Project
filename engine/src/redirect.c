#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <string.h>

#include "redirect.h"

int redirect_has_redirection(const command_t *cmd) {
    if (!cmd) return 0;
    return (cmd->input_file != NULL || cmd->output_file != NULL || cmd->error_file != NULL);
}

int redirect_apply(const command_t *cmd) {
    if (!cmd) return 0;

    if (cmd->input_file) {
        int fd_in = open(cmd->input_file, O_RDONLY);
        if (fd_in < 0) {
            fprintf(stderr, "shellforge: %s: %s\n", cmd->input_file, strerror(errno));
            return -1;
        }
        if (dup2(fd_in, STDIN_FILENO) < 0) {
            perror("shellforge: dup2 stdin failed");
            close(fd_in);
            return -1;
        }
        close(fd_in);
    }

    if (cmd->output_file) {
        int flags = O_WRONLY | O_CREAT | (cmd->append_output ? O_APPEND : O_TRUNC);
        int fd_out = open(cmd->output_file, flags, 0644);
        if (fd_out < 0) {
            fprintf(stderr, "shellforge: %s: %s\n", cmd->output_file, strerror(errno));
            return -1;
        }
        if (dup2(fd_out, STDOUT_FILENO) < 0) {
            perror("shellforge: dup2 stdout failed");
            close(fd_out);
            return -1;
        }
        close(fd_out);
    }

    if (cmd->error_file) {
        int flags = O_WRONLY | O_CREAT | O_TRUNC;
        int fd_err = open(cmd->error_file, flags, 0644);
        if (fd_err < 0) {
            fprintf(stderr, "shellforge: %s: %s\n", cmd->error_file, strerror(errno));
            return -1;
        }
        if (dup2(fd_err, STDERR_FILENO) < 0) {
            perror("shellforge: dup2 stderr failed");
            close(fd_err);
            return -1;
        }
        close(fd_err);
    }

    return 0;
}
