#ifndef PROCESS_H
#define PROCESS_H

#include <stddef.h>

#if defined(_WIN32) && !defined(__CYGWIN__)
#ifndef _PID_T_DEFINED
#define _PID_T_DEFINED
typedef int pid_t;
#endif
#else
#include <sys/types.h>
#endif

typedef struct {
    pid_t pid;
    pid_t ppid;
    int exit_code;
    int terminated_by_signal;
    int term_signal;
} process_result_t;

int process_spawn_and_wait(char **args, process_result_t *result);
void process_format_result(const process_result_t *res, char *buffer, size_t buf_size);

#endif /* PROCESS_H */
