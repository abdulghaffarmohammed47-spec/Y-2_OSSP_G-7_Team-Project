#ifndef EXECUTOR_H
#define EXECUTOR_H

#include "parser.h"
#include "process.h"
#include "sandbox.h"

int execute_line(const char *line, process_result_t *last_result, int *should_exit);
int execute_pipeline_cmd(pipeline_cmd_t *pipeline, process_result_t *last_result, int *should_exit);
int execute_single_command(command_t *cmd, process_result_t *last_result, int *should_exit);
int execute_sandboxed_line(const char *line, const sandbox_config_t *config, process_result_t *last_result, int *should_exit);

#endif /* EXECUTOR_H */
