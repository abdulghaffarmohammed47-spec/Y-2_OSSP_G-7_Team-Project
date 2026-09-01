#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <stddef.h>

#if defined(_WIN32) && !defined(__CYGWIN__)
#ifndef _PID_T_DEFINED
#define _PID_T_DEFINED
typedef int pid_t;
#endif
#else
#include <sys/types.h>
#endif

/*
 * System Call Telemetry & Metrics Hook
 * Supports strace logging, ptrace register inspection fallback,
 * and /proc status serialization.
 */

typedef struct {
    pid_t pid;
    long syscall_number;
    unsigned long args[6];
    long return_value;
    char timestamp[32];
} syscall_event_t;

int telemetry_init(void);
void telemetry_log_syscall(const syscall_event_t *event);
void telemetry_cleanup(void);

#endif /* TELEMETRY_H */
