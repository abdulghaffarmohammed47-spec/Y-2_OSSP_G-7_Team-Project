#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#include "parser.h"

/* Global Static Memory Arena for parsing cycles */
static arena_t g_parse_arena;
static int g_arena_initialized = 0;

void arena_init(arena_t *arena) {
    if (!arena) return;
    arena->offset = 0;
    arena->peak_usage = 0;
    memset(arena->buffer, 0, ARENA_BLOCK_SIZE);
}

void* arena_alloc(arena_t *arena, size_t size) {
    if (!arena) return NULL;
    
    /* 8-byte alignment */
    size_t aligned_size = (size + 7) & ~((size_t)7);
    if (arena->offset + aligned_size > ARENA_BLOCK_SIZE) {
        /* Fallback: if arena exhausted, print warning and use heap or cap */
        fprintf(stderr, "shellforge: memory arena limit exceeded (%zu bytes requested, %zu used)\n",
                size, arena->offset);
        return NULL;
    }

    void *ptr = &arena->buffer[arena->offset];
    arena->offset += aligned_size;
    if (arena->offset > arena->peak_usage) {
        arena->peak_usage = arena->offset;
    }
    return ptr;
}

char* arena_strdup(arena_t *arena, const char *str) {
    if (!arena || !str) return NULL;
    size_t len = strlen(str) + 1;
    char *copy = (char*)arena_alloc(arena, len);
    if (copy) {
        memcpy(copy, str, len);
    }
    return copy;
}

void arena_reset(arena_t *arena) {
    if (!arena) return;
    arena->offset = 0;
}

static void init_command(command_t *cmd) {
    cmd->args = NULL;
    cmd->arg_count = 0;
    cmd->input_file = NULL;
    cmd->output_file = NULL;
    cmd->append_output = 0;
    cmd->error_file = NULL;
    cmd->is_background = 0;
}

void free_command(command_t *cmd) {
    if (!cmd) return;
    /* If memory came from arena, reset handles it, but we zero fields */
    init_command(cmd);
}

void free_pipeline_cmd(pipeline_cmd_t *pipeline) {
    if (!pipeline) return;
    /* Reset arena for next parse cycle */
    if (g_arena_initialized) {
        arena_reset(&g_parse_arena);
    }
}

static void add_arg_arena(arena_t *arena, command_t *cmd, const char *arg) {
    int new_count = cmd->arg_count + 1;
    char **new_args = (char**)arena_alloc(arena, sizeof(char*) * (new_count + 1));
    if (!new_args) return;

    for (int i = 0; i < cmd->arg_count; i++) {
        new_args[i] = cmd->args[i];
    }
    new_args[cmd->arg_count] = arena_strdup(arena, arg);
    new_args[new_count] = NULL;

    cmd->args = new_args;
    cmd->arg_count = new_count;
}

/* Parse raw line into array of tokens using arena memory */
static char** tokenize_line_arena(arena_t *arena, const char *line, int *out_count) {
    int capacity = 32;
    int count = 0;
    char **tokens = (char**)arena_alloc(arena, sizeof(char*) * capacity);
    if (!tokens) {
        *out_count = 0;
        return NULL;
    }
    
    size_t len = strlen(line);
    size_t i = 0;
    
    while (i < len) {
        /* Skip whitespace */
        while (i < len && isspace((unsigned char)line[i])) i++;
        if (i >= len) break;

        /* Multi-character operators */
        if (i + 1 < len && line[i] == '>' && line[i+1] == '>') {
            if (count + 1 >= capacity) {
                /* In arena, allocate larger slice */
                int new_cap = capacity * 2;
                char **new_toks = (char**)arena_alloc(arena, sizeof(char*) * new_cap);
                if (new_toks) {
                    memcpy(new_toks, tokens, sizeof(char*) * count);
                    tokens = new_toks;
                    capacity = new_cap;
                }
            }
            tokens[count++] = arena_strdup(arena, ">>");
            i += 2;
            continue;
        }
        if (i + 1 < len && line[i] == '2' && line[i+1] == '>') {
            if (count + 1 >= capacity) {
                int new_cap = capacity * 2;
                char **new_toks = (char**)arena_alloc(arena, sizeof(char*) * new_cap);
                if (new_toks) {
                    memcpy(new_toks, tokens, sizeof(char*) * count);
                    tokens = new_toks;
                    capacity = new_cap;
                }
            }
            tokens[count++] = arena_strdup(arena, "2>");
            i += 2;
            continue;
        }

        /* Single character operators */
        if (line[i] == '|' || line[i] == '>' || line[i] == '<' || line[i] == '&') {
            if (count + 1 >= capacity) {
                int new_cap = capacity * 2;
                char **new_toks = (char**)arena_alloc(arena, sizeof(char*) * new_cap);
                if (new_toks) {
                    memcpy(new_toks, tokens, sizeof(char*) * count);
                    tokens = new_toks;
                    capacity = new_cap;
                }
            }
            char op[2] = { line[i], '\0' };
            tokens[count++] = arena_strdup(arena, op);
            i++;
            continue;
        }

        /* Token scanning with quote processing */
        char buf[4096];
        size_t buf_pos = 0;
        int in_single_quote = 0;
        int in_double_quote = 0;
        int had_quotes = 0;

        while (i < len) {
            char c = line[i];

            if (in_single_quote) {
                if (c == '\'') {
                    in_single_quote = 0;
                } else if (buf_pos + 1 < sizeof(buf)) {
                    buf[buf_pos++] = c;
                }
                i++;
            } else if (in_double_quote) {
                if (c == '"') {
                    in_double_quote = 0;
                } else if (c == '\\' && i + 1 < len) {
                    i++;
                    if (buf_pos + 1 < sizeof(buf)) buf[buf_pos++] = line[i];
                } else if (buf_pos + 1 < sizeof(buf)) {
                    buf[buf_pos++] = c;
                }
                i++;
            } else {
                if (isspace((unsigned char)c) || c == '|' || c == '>' || c == '<' || c == '&') {
                    break;
                }
                if (c == '\'') {
                    in_single_quote = 1;
                    had_quotes = 1;
                    i++;
                } else if (c == '"') {
                    in_double_quote = 1;
                    had_quotes = 1;
                    i++;
                } else if (c == '\\' && i + 1 < len) {
                    i++;
                    if (buf_pos + 1 < sizeof(buf)) buf[buf_pos++] = line[i];
                    i++;
                } else {
                    if (buf_pos + 1 < sizeof(buf)) buf[buf_pos++] = c;
                    i++;
                }
            }
        }
        buf[buf_pos] = '\0';
        if (buf_pos > 0 || had_quotes) {
            if (count + 1 >= capacity) {
                int new_cap = capacity * 2;
                char **new_toks = (char**)arena_alloc(arena, sizeof(char*) * new_cap);
                if (new_toks) {
                    memcpy(new_toks, tokens, sizeof(char*) * count);
                    tokens = new_toks;
                    capacity = new_cap;
                }
            }
            tokens[count++] = arena_strdup(arena, buf);
        }
    }

    tokens[count] = NULL;
    *out_count = count;
    return tokens;
}

pipeline_cmd_t* parse_input_line(const char *line) {
    if (!line) return NULL;

    if (!g_arena_initialized) {
        arena_init(&g_parse_arena);
        g_arena_initialized = 1;
    } else {
        arena_reset(&g_parse_arena);
    }

    arena_t *arena = &g_parse_arena;

    pipeline_cmd_t *pipeline = (pipeline_cmd_t*)arena_alloc(arena, sizeof(pipeline_cmd_t));
    if (!pipeline) return NULL;

    pipeline->commands = NULL;
    pipeline->command_count = 0;
    pipeline->is_background = 0;
    pipeline->raw_line = arena_strdup(arena, line);

    int token_count = 0;
    char **tokens = tokenize_line_arena(arena, line, &token_count);

    if (token_count == 0 || !tokens) {
        return pipeline;
    }

    /* Check trailing & */
    if (token_count > 0 && strcmp(tokens[token_count - 1], "&") == 0) {
        pipeline->is_background = 1;
        tokens[token_count - 1] = NULL;
        token_count--;
    }

    /* Parse pipeline commands separated by '|' */
    int cmd_capacity = 8;
    pipeline->commands = (command_t*)arena_alloc(arena, sizeof(command_t) * cmd_capacity);
    if (!pipeline->commands) return pipeline;
    
    command_t current_cmd;
    init_command(&current_cmd);

    for (int i = 0; i < token_count; i++) {
        char *tok = tokens[i];
        if (!tok) continue;

        if (strcmp(tok, "|") == 0) {
            if (pipeline->command_count >= cmd_capacity) {
                int new_cap = cmd_capacity * 2;
                command_t *new_cmds = (command_t*)arena_alloc(arena, sizeof(command_t) * new_cap);
                if (new_cmds) {
                    memcpy(new_cmds, pipeline->commands, sizeof(command_t) * pipeline->command_count);
                    pipeline->commands = new_cmds;
                    cmd_capacity = new_cap;
                }
            }
            pipeline->commands[pipeline->command_count++] = current_cmd;
            init_command(&current_cmd);
        } else if (strcmp(tok, ">") == 0) {
            if (i + 1 < token_count) {
                current_cmd.output_file = arena_strdup(arena, tokens[++i]);
                current_cmd.append_output = 0;
            }
        } else if (strcmp(tok, ">>") == 0) {
            if (i + 1 < token_count) {
                current_cmd.output_file = arena_strdup(arena, tokens[++i]);
                current_cmd.append_output = 1;
            }
        } else if (strcmp(tok, "<") == 0) {
            if (i + 1 < token_count) {
                current_cmd.input_file = arena_strdup(arena, tokens[++i]);
            }
        } else if (strcmp(tok, "2>") == 0) {
            if (i + 1 < token_count) {
                current_cmd.error_file = arena_strdup(arena, tokens[++i]);
            }
        } else {
            add_arg_arena(arena, &current_cmd, tok);
        }
    }

    if (current_cmd.arg_count > 0 || current_cmd.input_file || current_cmd.output_file || current_cmd.error_file) {
        if (pipeline->command_count >= cmd_capacity) {
            int new_cap = cmd_capacity * 2;
            command_t *new_cmds = (command_t*)arena_alloc(arena, sizeof(command_t) * new_cap);
            if (new_cmds) {
                memcpy(new_cmds, pipeline->commands, sizeof(command_t) * pipeline->command_count);
                pipeline->commands = new_cmds;
                cmd_capacity = new_cap;
            }
        }
        current_cmd.is_background = pipeline->is_background;
        pipeline->commands[pipeline->command_count++] = current_cmd;
    }

    return pipeline;
}
