#ifndef SANDBOX_H
#define SANDBOX_H

#include <stdbool.h>
#include <stddef.h>

#if defined(_WIN32) && !defined(__CYGWIN__)
#ifndef _PID_T_DEFINED
#define _PID_T_DEFINED
typedef int pid_t;
typedef int uid_t;
typedef int gid_t;
#endif
#else
#include <sys/types.h>
#endif

/*
 * Linux Kernel Sandboxing Header
 * Supports namespace virtualization (CLONE_NEWPID, CLONE_NEWNS, CLONE_NEWNET,
 * CLONE_NEWUTS, CLONE_NEWIPC, CLONE_NEWUSER) and cgroups v2 resource bounding.
 */

#define CGROUP_DEFAULT_MEMORY_MAX    134217728  /* 128 MB hard limit */
#define CGROUP_DEFAULT_MEMORY_HIGH   100663296  /* 96 MB throttling threshold */
#define CGROUP_DEFAULT_PIDS_MAX      32         /* 32 max processes to stop fork bombs */
#define CGROUP_DEFAULT_CPU_MAX       "20000 100000" /* 20% CPU quota (20ms per 100ms) */

typedef struct {
    bool isolate_pid;      /* CLONE_NEWPID: Child becomes PID 1 in isolated tree */
    bool isolate_mount;    /* CLONE_NEWNS: Private mount namespace & /proc */
    bool isolate_net;      /* CLONE_NEWNET: Detach host network; loopback only */
    bool isolate_uts;      /* CLONE_NEWUTS: Isolate hostname */
    bool isolate_ipc;      /* CLONE_NEWIPC: Isolate SysV/POSIX IPC */
    bool isolate_user;     /* CLONE_NEWUSER: Map child root to unprivileged host UID */
    const char *hostname;  /* Custom hostname if UTS is isolated */
    
    /* cgroups v2 configuration */
    bool enable_cgroups;
    const char *cgroup_id;
    unsigned long memory_max;
    unsigned long memory_high;
    int pids_max;
    const char *cpu_max;
} sandbox_config_t;

/* Sandbox API */
void sandbox_config_default(sandbox_config_t *config);
int configure_cgroup_sandbox(pid_t pid, const char *group_id, const sandbox_config_t *config);
int sandbox_cleanup_cgroup(const char *group_id);
int spawn_sandboxed_process(char **argv, const sandbox_config_t *config, pid_t *child_pid);
int sandbox_enter_namespaces(const sandbox_config_t *config);
bool sandbox_is_supported(void);

#endif /* SANDBOX_H */
