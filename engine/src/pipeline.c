#include <stddef.h>

#include "pipeline.h"

int pipeline_is_valid(const pipeline_cmd_t *pipeline) {
    if (!pipeline || pipeline->command_count == 0) return 0;
    for (int i = 0; i < pipeline->command_count; i++) {
        if (!pipeline->commands[i].args || !pipeline->commands[i].args[0]) {
            return 0;
        }
    }
    return 1;
}
