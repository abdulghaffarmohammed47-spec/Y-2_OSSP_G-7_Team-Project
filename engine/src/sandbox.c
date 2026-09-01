#ifndef _GNU_SOURCE
#define _GNU_SOURCE
#endif

#if defined(__has_include)
#if __has_include(<stdio.h>)
#include <stdio.h>
#endif
#if __has_include(<stdlib.h>)
#include <stdlib.h>
#endif
#if __has_include(<string.h>)
#include <string.h>
#endif
#if __has_include(<unistd.h>)
#include <unistd.h>
#endif
#if __has_include(<fcntl.h>)
#include <fcntl.h>
#endif
#if __has_include(<sys/stat.h>)
#include <sys/stat.h>
#endif
#if __has_include(<sys/types.h>)
#include <sys/types.h>
#endif
#if __has_include(<sys/wait.h>)
#include <sys/wait.h>
#endif
#if __has_include(<errno.h>)
#include <errno.h>
#endif
#if __has_include(<sched.h>)
#include <sched.h>
#endif
#if __has_include(<sys/mount.h>)
#include <sys/mount.h>
#endif
#else
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <errno.h>
#if defined(__linux__) || defined(__unix__) || defined(__CYGWIN__)
#include <sched.h>
#include <sys/mount.h>
#endif
#endif

#include "sandbox.h"

/* Declarations and constants for environments without POSIX headers */
#ifndef O_RDONLY
#define O_RDONLY 0
#endif
#ifndef O_WRONLY
#define O_WRONLY 1
#endif
#ifndef O_TRUNC
#define O_TRUNC 512
#endif
#ifndef EEXIST
#define EEXIST 17
#endif
#ifndef EACCES
#define EACCES 13
#endif
#ifndef EPERM
#define EPERM 1
#endif
#ifndef ENOENT
#define ENOENT 2
#endif
#ifndef EROFS
#define EROFS 30
#endif
#ifndef ENOSYS
#define ENOSYS 38
#endif

#if defined(_WIN32) && !defined(__CYGWIN__)
#ifndef _SSIZE_T_DEFINED
#define _SSIZE_T_DEFINED
typedef long long ssize_t;
#endif
#ifndef CLONE_NEWUSER
#define CLONE_NEWUSER 0x10000000
#endif
#ifndef CLONE_NEWPID
#define CLONE_NEWPID 0x20000000
#endif
#ifndef CLONE_NEWNET
#define CLONE_NEWNET 0x40000000
#endif
#ifndef CLONE_NEWNS
#define CLONE_NEWNS 0x00020000
#endif
#ifndef CLONE_NEWUTS
#define CLONE_NEWUTS 0x04000000
#endif
#ifndef CLONE_NEWIPC
#define CLONE_NEWIPC 0x08000000
#endif
#ifndef MS_REC
#define MS_REC 16384
#endif
#ifndef MS_PRIVATE
#define MS_PRIVATE (1<<18)
#endif
#ifndef MS_NOSUID
#define MS_NOSUID 2
#endif
#ifndef MS_NODEV
#define MS_NODEV 4
#endif
#ifndef MS_NOEXEC
#define MS_NOEXEC 8
#endif
#endif

void sandbox_config_default(sandbox_config_t *config) {
    if (!config) return;
    config->isolate_pid = true;
    config->isolate_mount = true;
    config->isolate_net = true;
    config->isolate_uts = true;
    config->isolate_ipc = true;
    config->isolate_user = true;
    config->hostname = "shellforge-sandbox";
    
    config->enable_cgroups = true;
    config->cgroup_id = "default";
    config->memory_max = CGROUP_DEFAULT_MEMORY_MAX;
    config->memory_high = CGROUP_DEFAULT_MEMORY_HIGH;
    config->pids_max = CGROUP_DEFAULT_PIDS_MAX;
    config->cpu_max = CGROUP_DEFAULT_CPU_MAX;
}

bool sandbox_is_supported(void) {
#if defined(__linux__) || defined(__CYGWIN__)
    /* Test if unshare is supported in the current kernel */
    if (unshare(0) == 0) {
        return true;
    }
    return (errno != ENOSYS);
#else
    return false;
#endif
}

/* Helper to write a string into a path */
static int write_file(const char *path, const char *value) {
    int fd = open(path, O_WRONLY | O_TRUNC);
    if (fd < 0) {
        return -1;
    }
    ssize_t len = (ssize_t)strlen(value);
    ssize_t written = (ssize_t)write(fd, value, (size_t)len);
    close(fd);
    return (written == len) ? 0 : -1;
}

/*
 * cgroups v2 Sandboxing Controller
 * Binds target child PID to /sys/fs/cgroup/shellforge_<group_id>/
 * and sets resource limits:
 * - memory.max: 128 MB
 * - memory.high: 96 MB
 * - pids.max: 32 (prevent fork bombs)
 * - cpu.max: 20000 100000 (20% CPU quota)
 */
int configure_cgroup_sandbox(pid_t pid, const char *group_id, const sandbox_config_t *config) {
    if (!config || !config->enable_cgroups) return 0;

    const char *gid = group_id ? group_id : (config->cgroup_id ? config->cgroup_id : "default");
    char cgroup_dir[512];
    snprintf(cgroup_dir, sizeof(cgroup_dir), "/sys/fs/cgroup/shellforge_%.256s", gid);

    /* Create cgroup sub-hierarchy */
    if (mkdir(cgroup_dir, 0755) < 0 && errno != EEXIST) {
        /* If cgroup v2 root is not writable (e.g. non-root without delegated cgroup), log and skip */
        if (errno == EACCES || errno == EPERM || errno == ENOENT || errno == EROFS) {
            fprintf(stderr, "shellforge: [cgroups v2] Info: cgroup path %s unavailable (%s). Continuing...\n",
                    cgroup_dir, strerror(errno));
            return 0;
        }
        perror("shellforge: [cgroups v2] mkdir failed");
        return -1;
    }

    char path[1024];
    char val[64];

    /* 1. Memory hard limit */
    snprintf(path, sizeof(path), "%s/memory.max", cgroup_dir);
    snprintf(val, sizeof(val), "%lu\n", config->memory_max > 0 ? config->memory_max : CGROUP_DEFAULT_MEMORY_MAX);
    write_file(path, val);

    /* 2. Memory high threshold (throttling) */
    snprintf(path, sizeof(path), "%s/memory.high", cgroup_dir);
    snprintf(val, sizeof(val), "%lu\n", config->memory_high > 0 ? config->memory_high : CGROUP_DEFAULT_MEMORY_HIGH);
    write_file(path, val);

    /* 3. PIDs limit (caps fork bombs) */
    snprintf(path, sizeof(path), "%s/pids.max", cgroup_dir);
    snprintf(val, sizeof(val), "%d\n", config->pids_max > 0 ? config->pids_max : CGROUP_DEFAULT_PIDS_MAX);
    write_file(path, val);

    /* 4. CPU quota */
    snprintf(path, sizeof(path), "%s/cpu.max", cgroup_dir);
    write_file(path, config->cpu_max ? config->cpu_max : CGROUP_DEFAULT_CPU_MAX);

    /* 5. Attach target PID */
    if (pid > 0) {
        snprintf(path, sizeof(path), "%s/cgroup.procs", cgroup_dir);
        snprintf(val, sizeof(val), "%d\n", pid);
        if (write_file(path, val) < 0) {
            /* If writing fails due to permission or non-root, treat as non-fatal warning */
            if (errno == EACCES || errno == EPERM) {
                fprintf(stderr, "shellforge: [cgroups v2] Info: could not attach PID %d to %s (%s)\n",
                        pid, path, strerror(errno));
            }
        }
    }

    return 0;
}

int sandbox_cleanup_cgroup(const char *group_id) {
    if (!group_id) return 0;
    char cgroup_dir[512];
    snprintf(cgroup_dir, sizeof(cgroup_dir), "/sys/fs/cgroup/shellforge_%.256s", group_id);
    return rmdir(cgroup_dir);
}

/* Configure User Namespace UID/GID mappings */
static int setup_user_mappings(uid_t host_uid, gid_t host_gid) {
    /* 1. Deny setgroups to allow unprivileged GID mapping */
    int setgroups_fd = open("/proc/self/setgroups", O_WRONLY);
    if (setgroups_fd >= 0) {
        write(setgroups_fd, "deny", 4);
        close(setgroups_fd);
    }

    /* 2. Map container root (UID 0) to current host UID */
    char map_buf[128];
    int uid_fd = open("/proc/self/uid_map", O_WRONLY);
    if (uid_fd >= 0) {
        snprintf(map_buf, sizeof(map_buf), "0 %d 1\n", host_uid);
        write(uid_fd, map_buf, strlen(map_buf));
        close(uid_fd);
    }

    /* 3. Map container group 0 to current host GID */
    int gid_fd = open("/proc/self/gid_map", O_WRONLY);
    if (gid_fd >= 0) {
        snprintf(map_buf, sizeof(map_buf), "0 %d 1\n", host_gid);
        write(gid_fd, map_buf, strlen(map_buf));
        close(gid_fd);
    }

    return 0;
}

/*
 * Namespace Virtualization
 * Unshares requested kernel namespaces:
 * - CLONE_NEWUSER: Unprivileged namespace root mapping
 * - CLONE_NEWPID: Isolated process subtree
 * - CLONE_NEWNS: Mount namespace isolation & private /proc
 * - CLONE_NEWNET: Loopback-only network isolation
 * - CLONE_NEWUTS: Isolated hostname
 * - CLONE_NEWIPC: Isolated message queues / semaphores
 */
int sandbox_enter_namespaces(const sandbox_config_t *config) {
    if (!config) return 0;

    uid_t host_uid = getuid();
    gid_t host_gid = getgid();

    int unshare_flags = 0;
    if (config->isolate_user)  unshare_flags |= CLONE_NEWUSER;
    if (config->isolate_pid)   unshare_flags |= CLONE_NEWPID;
    if (config->isolate_mount) unshare_flags |= CLONE_NEWNS;
    if (config->isolate_net)   unshare_flags |= CLONE_NEWNET;
    if (config->isolate_uts)   unshare_flags |= CLONE_NEWUTS;
    if (config->isolate_ipc)   unshare_flags |= CLONE_NEWIPC;

    if (unshare_flags == 0) return 0;

#if defined(__linux__) || defined(__CYGWIN__)
    /* Execute unshare */
    if (unshare(unshare_flags) < 0) {
        /* If unshare failed with EPERM and CLONE_NEWUSER wasn't set, try adding CLONE_NEWUSER */
        if (errno == EPERM && !(unshare_flags & CLONE_NEWUSER)) {
            unshare_flags |= CLONE_NEWUSER;
            if (unshare(unshare_flags) < 0) {
                perror("shellforge: unshare failed");
                return -1;
            }
        } else {
            perror("shellforge: unshare failed");
            return -1;
        }
    }

    /* Configure UID/GID mappings if user namespace was requested */
    if (unshare_flags & CLONE_NEWUSER) {
        setup_user_mappings(host_uid, host_gid);
    }

    /* Configure UTS hostname */
    if (config->isolate_uts && config->hostname) {
        sethostname(config->hostname, strlen(config->hostname));
    }

    /* Configure mount isolation */
    if (config->isolate_mount) {
        /* Make mount propagations private */
        mount(NULL, "/", NULL, MS_REC | MS_PRIVATE, NULL);
    }
#endif

    return 0;
}

int spawn_sandboxed_process(char **argv, const sandbox_config_t *config, pid_t *child_pid) {
    if (!argv || !argv[0]) return -1;

    sandbox_config_t default_cfg;
    if (!config) {
        sandbox_config_default(&default_cfg);
        config = &default_cfg;
    }

    /* Fork parent / sandbox initiator */
    pid_t pid = fork();
    if (pid < 0) {
        perror("shellforge: sandbox fork failed");
        return -1;
    }

    if (pid == 0) {
        /* Child Sandbox Space */
        setpgid(0, 0);

        /* 1. Enter Linux Namespaces */
        if (sandbox_enter_namespaces(config) < 0) {
            fprintf(stderr, "shellforge: warning: failed to enter some namespaces, continuing...\n");
        }

        /* If CLONE_NEWPID was unshared, the actual PID 1 in the new namespace
         * is the child of this process. Let's fork the inner worker process. */
        if (config->isolate_pid) {
            pid_t inner_pid = fork();
            if (inner_pid < 0) {
                perror("shellforge: inner sandbox fork failed");
                _exit(1);
            }

            if (inner_pid == 0) {
                /* Inner Worker (PID 1 in new namespace) */
                if (config->isolate_mount) {
                    /* Mount isolated /proc filesystem */
#if defined(__linux__) || defined(__CYGWIN__)
                    mount("proc", "/proc", "proc", MS_NOSUID | MS_NODEV | MS_NOEXEC, NULL);
#endif
                }

                execvp(argv[0], argv);
                if (errno == ENOENT) {
                    fprintf(stderr, "shellforge: command not found: %s\n", argv[0]);
                    _exit(127);
                } else {
                    fprintf(stderr, "shellforge: exec failure (%s): %s\n", argv[0], strerror(errno));
                    _exit(126);
                }
            } else {
                /* Sandbox supervisor: wait for inner child */
                int inner_status = 0;
                waitpid(inner_pid, &inner_status, 0);
                if (WIFEXITED(inner_status)) {
                    _exit(WEXITSTATUS(inner_status));
                } else if (WIFSIGNALED(inner_status)) {
                    _exit(128 + WTERMSIG(inner_status));
                }
                _exit(0);
            }
        } else {
            /* Direct execution if not PID-isolated */
            execvp(argv[0], argv);
            if (errno == ENOENT) {
                fprintf(stderr, "shellforge: command not found: %s\n", argv[0]);
                _exit(127);
            } else {
                fprintf(stderr, "shellforge: exec failure (%s): %s\n", argv[0], strerror(errno));
                _exit(126);
            }
        }
    } else {
        /* Parent Space: apply cgroups v2 to the spawned child */
        if (config->enable_cgroups) {
            configure_cgroup_sandbox(pid, config->cgroup_id, config);
        }

        if (child_pid) {
            *child_pid = pid;
        }
        return 0;
    }
}
