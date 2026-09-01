#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "parser.h"

static int g_tests_run = 0;
static int g_tests_failed = 0;

#define ASSERT(cond, msg) do { \
    g_tests_run++; \
    if (!(cond)) { \
        printf(" [FAIL] Line %d: %s\n", __LINE__, msg); \
        g_tests_failed++; \
    } else { \
        printf(" [PASS] %s\n", msg); \
    } \
} while(0)

void test_basic_args(void) {
    printf("\n--- Test 1: Basic Command & Arguments ---\n");
    pipeline_cmd_t *p = parse_input_line("ls -la /tmp");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->command_count == 1, "Single command count == 1");
    ASSERT(p->is_background == 0, "Is not background");
    ASSERT(p->commands[0].arg_count == 3, "Arg count == 3");
    ASSERT(strcmp(p->commands[0].args[0], "ls") == 0, "args[0] == ls");
    ASSERT(strcmp(p->commands[0].args[1], "-la") == 0, "args[1] == -la");
    ASSERT(strcmp(p->commands[0].args[2], "/tmp") == 0, "args[2] == /tmp");
    free_pipeline_cmd(p);
}

void test_double_quotes(void) {
    printf("\n--- Test 2: Double Quotes ---\n");
    pipeline_cmd_t *p = parse_input_line("echo \"hello world\" \"foo bar\"");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->command_count == 1, "Command count == 1");
    ASSERT(p->commands[0].arg_count == 3, "Arg count == 3");
    ASSERT(strcmp(p->commands[0].args[0], "echo") == 0, "args[0] == echo");
    ASSERT(strcmp(p->commands[0].args[1], "hello world") == 0, "args[1] == hello world");
    ASSERT(strcmp(p->commands[0].args[2], "foo bar") == 0, "args[2] == foo bar");
    free_pipeline_cmd(p);
}

void test_single_quotes(void) {
    printf("\n--- Test 3: Single Quotes ---\n");
    pipeline_cmd_t *p = parse_input_line("echo 'hello $WORLD *' 'single quote'");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->commands[0].arg_count == 3, "Arg count == 3");
    ASSERT(strcmp(p->commands[0].args[1], "hello $WORLD *") == 0, "Preserves literal single quote content");
    ASSERT(strcmp(p->commands[0].args[2], "single quote") == 0, "args[2] == single quote");
    free_pipeline_cmd(p);
}

void test_backslash_escaping(void) {
    printf("\n--- Test 4: Backslash Escaping ---\n");
    pipeline_cmd_t *p = parse_input_line("echo hello\\ world file\\>name");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->commands[0].arg_count == 3, "Arg count == 3");
    ASSERT(strcmp(p->commands[0].args[1], "hello world") == 0, "Escaped space preserved");
    ASSERT(strcmp(p->commands[0].args[2], "file>name") == 0, "Escaped operator > preserved as arg");
    free_pipeline_cmd(p);
}

void test_pipeline_parsing(void) {
    printf("\n--- Test 5: Pipeline Structure Parsing ---\n");
    pipeline_cmd_t *p = parse_input_line("ls -la | grep \".c\" | sort -r");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->command_count == 3, "Command count == 3");
    ASSERT(strcmp(p->commands[0].args[0], "ls") == 0, "Command 1 == ls");
    ASSERT(strcmp(p->commands[1].args[0], "grep") == 0, "Command 2 == grep");
    ASSERT(strcmp(p->commands[1].args[1], ".c") == 0, "Grep arg == .c");
    ASSERT(strcmp(p->commands[2].args[0], "sort") == 0, "Command 3 == sort");
    free_pipeline_cmd(p);
}

void test_redirections(void) {
    printf("\n--- Test 6: I/O Redirection Operators ---\n");
    pipeline_cmd_t *p1 = parse_input_line("ls > output.txt");
    ASSERT(p1->commands[0].output_file != NULL, "Output file non-null");
    ASSERT(strcmp(p1->commands[0].output_file, "output.txt") == 0, "Output file == output.txt");
    ASSERT(p1->commands[0].append_output == 0, "Append output == 0");
    free_pipeline_cmd(p1);

    pipeline_cmd_t *p2 = parse_input_line("echo hello >> append.log");
    ASSERT(p2->commands[0].output_file != NULL, "Output file non-null");
    ASSERT(strcmp(p2->commands[0].output_file, "append.log") == 0, "Output file == append.log");
    ASSERT(p2->commands[0].append_output == 1, "Append output == 1");
    free_pipeline_cmd(p2);

    pipeline_cmd_t *p3 = parse_input_line("cat < input.txt 2> error.log");
    ASSERT(p3->commands[0].input_file != NULL, "Input file non-null");
    ASSERT(strcmp(p3->commands[0].input_file, "input.txt") == 0, "Input file == input.txt");
    ASSERT(p3->commands[0].error_file != NULL, "Error file non-null");
    ASSERT(strcmp(p3->commands[0].error_file, "error.log") == 0, "Error file == error.log");
    free_pipeline_cmd(p3);
}

void test_background(void) {
    printf("\n--- Test 7: Background Execution Operator & ---\n");
    pipeline_cmd_t *p = parse_input_line("sleep 10 &");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->is_background == 1, "is_background == 1");
    ASSERT(p->commands[0].is_background == 1, "command is_background == 1");
    ASSERT(p->commands[0].arg_count == 2, "Arg count == 2 (sleep 10)");
    free_pipeline_cmd(p);
}

void test_whitespace_handling(void) {
    printf("\n--- Test 8: Whitespace & Tabs Handling ---\n");
    pipeline_cmd_t *p = parse_input_line("   \t  ls  \t -la   /var/log  \t ");
    ASSERT(p != NULL, "Parsed pipeline is non-null");
    ASSERT(p->commands[0].arg_count == 3, "Trimmed whitespace properly");
    ASSERT(strcmp(p->commands[0].args[0], "ls") == 0, "args[0] == ls");
    ASSERT(strcmp(p->commands[0].args[1], "-la") == 0, "args[1] == -la");
    ASSERT(strcmp(p->commands[0].args[2], "/var/log") == 0, "args[2] == /var/log");
    free_pipeline_cmd(p);
}

int main(void) {
    printf("=========================================\n");
    printf(" ShellForge Pro - Command Parser Tests  \n");
    printf("=========================================\n");

    test_basic_args();
    test_double_quotes();
    test_single_quotes();
    test_backslash_escaping();
    test_pipeline_parsing();
    test_redirections();
    test_background();
    test_whitespace_handling();

    printf("\n=========================================\n");
    printf(" Parser Test Summary: %d Run, %d Failed\n", g_tests_run, g_tests_failed);
    printf("=========================================\n");

    return g_tests_failed;
}
