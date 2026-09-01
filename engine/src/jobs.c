#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/wait.h>

#include "jobs.h"

#define MAX_JOBS 64

static job_t g_jobs[MAX_JOBS];
static int g_job_count = 0;
static int g_next_job_id = 1;

void jobs_init(void) {
    for (int i = 0; i < MAX_JOBS; i++) {
        g_jobs[i].job_id = 0;
        g_jobs[i].pid = 0;
        g_jobs[i].pgid = 0;
        g_jobs[i].command = NULL;
        g_jobs[i].state = JOB_DONE;
        g_jobs[i].exit_status = 0;
    }
    g_job_count = 0;
    g_next_job_id = 1;
}

int jobs_add(pid_t pid, pid_t pgid, const char *command, job_state_t state) {
    if (g_job_count >= MAX_JOBS) {
        fprintf(stderr, "shellforge: job table full\n");
        return -1;
    }

    /* Find empty slot */
    for (int i = 0; i < MAX_JOBS; i++) {
        if (g_jobs[i].job_id == 0) {
            g_jobs[i].job_id = g_next_job_id++;
            g_jobs[i].pid = pid;
            g_jobs[i].pgid = pgid;
            g_jobs[i].command = command ? strdup(command) : strdup("unknown");
            g_jobs[i].state = state;
            g_jobs[i].exit_status = 0;
            g_job_count++;
            return g_jobs[i].job_id;
        }
    }
    return -1;
}

static const char* job_state_str(job_state_t state) {
    switch (state) {
        case JOB_RUNNING: return "Running";
        case JOB_STOPPED: return "Stopped";
        case JOB_DONE:    return "Done";
        case JOB_FAILED:  return "Failed";
        default:          return "Unknown";
    }
}

void jobs_list(void) {
    for (int i = 0; i < MAX_JOBS; i++) {
        if (g_jobs[i].job_id != 0) {
            printf("[%d]  PID %d (PGID %d)  %-10s  %s\n",
                   g_jobs[i].job_id,
                   g_jobs[i].pid,
                   g_jobs[i].pgid,
                   job_state_str(g_jobs[i].state),
                   g_jobs[i].command ? g_jobs[i].command : "");
        }
    }
}

job_t* jobs_find_by_id(int job_id) {
    for (int i = 0; i < MAX_JOBS; i++) {
        if (g_jobs[i].job_id == job_id) {
            return &g_jobs[i];
        }
    }
    return NULL;
}

job_t* jobs_find_by_pid(pid_t pid) {
    for (int i = 0; i < MAX_JOBS; i++) {
        if (g_jobs[i].job_id != 0 && (g_jobs[i].pid == pid || g_jobs[i].pgid == pid)) {
            return &g_jobs[i];
        }
    }
    return NULL;
}

int jobs_update_status(pid_t pid, int status) {
    job_t *job = jobs_find_by_pid(pid);
    if (!job) return -1;

    if (WIFSTOPPED(status)) {
        job->state = JOB_STOPPED;
    } else if (WIFCONTINUED(status)) {
        job->state = JOB_RUNNING;
    } else if (WIFEXITED(status)) {
        job->exit_status = WEXITSTATUS(status);
        job->state = (job->exit_status == 0) ? JOB_DONE : JOB_FAILED;
    } else if (WIFSIGNALED(status)) {
        job->exit_status = 128 + WTERMSIG(status);
        job->state = JOB_FAILED;
    }

    return 0;
}

void jobs_remove(pid_t pid) {
    for (int i = 0; i < MAX_JOBS; i++) {
        if (g_jobs[i].job_id != 0 && g_jobs[i].pid == pid) {
            if (g_jobs[i].command) {
                free(g_jobs[i].command);
                g_jobs[i].command = NULL;
            }
            g_jobs[i].job_id = 0;
            g_jobs[i].pid = 0;
            g_jobs[i].pgid = 0;
            g_jobs[i].state = JOB_DONE;
            g_job_count--;
            break;
        }
    }
}

void jobs_cleanup(void) {
    for (int i = 0; i < MAX_JOBS; i++) {
        if (g_jobs[i].job_id != 0 && g_jobs[i].command) {
            free(g_jobs[i].command);
            g_jobs[i].command = NULL;
        }
        g_jobs[i].job_id = 0;
    }
    g_job_count = 0;
}
