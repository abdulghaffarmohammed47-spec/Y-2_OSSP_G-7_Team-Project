#ifndef SIGNALS_H
#define SIGNALS_H

#if defined(_WIN32) && !defined(__CYGWIN__)
#ifndef _PID_T_DEFINED
#define _PID_T_DEFINED
typedef int pid_t;
#endif
#else
#include <sys/types.h>
#endif

void signals_init(void);
void signals_set_foreground_pgrp(pid_t pgrp);
void signals_restore_shell_pgrp(void);
pid_t signals_get_shell_pgrp(void);

#endif /* SIGNALS_H */
