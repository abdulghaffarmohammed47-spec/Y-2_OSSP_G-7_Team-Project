#ifndef BUILTIN_H
#define BUILTIN_H

int is_builtin(const char *cmd);
int execute_builtin(char **args, int *status, int *should_exit);

#endif /* BUILTIN_H */
