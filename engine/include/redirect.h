#ifndef REDIRECT_H
#define REDIRECT_H

#include "parser.h"

int redirect_has_redirection(const command_t *cmd);
int redirect_apply(const command_t *cmd);

#endif /* REDIRECT_H */
