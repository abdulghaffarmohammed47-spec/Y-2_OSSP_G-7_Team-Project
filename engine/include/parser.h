#ifndef PARSER_H
#define PARSER_H

#include <stddef.h>

/*
 * Memory Arena Allocator Definition
 * Provides fast, contiguous bump-allocation per parse cycle, eliminating
 * heap fragmentation and ensuring deterministic zero-leak cleanup.
 */
#define ARENA_BLOCK_SIZE (64 * 1024) /* 64 KB static arena buffer */

typedef struct {
    char buffer[ARENA_BLOCK_SIZE];
    size_t offset;
    size_t peak_usage;
} arena_t;

/* Arena API */
void arena_init(arena_t *arena);
void* arena_alloc(arena_t *arena, size_t size);
char* arena_strdup(arena_t *arena, const char *str);
void arena_reset(arena_t *arena);

/* Command Redirection and Arguments Structure */
typedef struct {
    char **args;          /* NULL-terminated argument array */
    int arg_count;
    char *input_file;     /* < */
    char *output_file;    /* > or >> */
    int append_output;    /* 1 if >>, 0 if > */
    char *error_file;     /* 2> */
    int is_background;    /* & */
} command_t;

/* Pipeline Command Definition */
typedef struct {
    command_t *commands;  /* Array of commands in pipeline */
    int command_count;
    int is_background;
    char *raw_line;
} pipeline_cmd_t;

/* Parser API */
pipeline_cmd_t* parse_input_line(const char *line);
void free_pipeline_cmd(pipeline_cmd_t *pipeline);
void free_command(command_t *cmd);

#endif /* PARSER_H */
