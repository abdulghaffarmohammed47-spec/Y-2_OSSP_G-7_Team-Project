#ifndef JOBS_H
#define JOBS_H

#include <stddef.h>

#if defined(_WIN32) && !defined(__CYGWIN__)
#ifndef _PID_T_DEFINED
#define _PID_T_DEFINED
typedef int pid_t;
#endif
#else
#include <sys/types.h>
#endif

typedef enum {
    JOB_RUNNING,
    JOB_STOPPED,
    JOB_DONE,
    JOB_FAILED
} job_state_t;

typedef struct {
    int job_id;
    pid_t pid;
    pid_t pgid;
    char *command;
    job_state_t state;
    int exit_status;
} job_t;

void jobs_init(void);
int jobs_add(pid_t pid, pid_t pgid, const char *command, job_state_t state);
void jobs_list(void);
job_t* jobs_find_by_id(int job_id);
job_t* jobs_find_by_pid(pid_t pid);
int jobs_update_status(pid_t pid, int status);
void jobs_remove(pid_t pid);
void jobs_cleanup(void);

#endif /* JOBS_H */
