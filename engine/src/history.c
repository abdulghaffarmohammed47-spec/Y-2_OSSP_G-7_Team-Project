#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "history.h"

#define MAX_HISTORY 100

static char *g_history[MAX_HISTORY];
static int g_history_count = 0;

void history_add(const char *cmd) {
    if (!cmd || strlen(cmd) == 0) return;

    if (g_history_count < MAX_HISTORY) {
        g_history[g_history_count++] = strdup(cmd);
    } else {
        free(g_history[0]);
        for (int i = 1; i < MAX_HISTORY; i++) {
            g_history[i - 1] = g_history[i];
        }
        g_history[MAX_HISTORY - 1] = strdup(cmd);
    }
}

void history_print(void) {
    for (int i = 0; i < g_history_count; i++) {
        printf("%4d  %s\n", i + 1, g_history[i]);
    }
}

void history_cleanup(void) {
    for (int i = 0; i < g_history_count; i++) {
        if (g_history[i]) {
            free(g_history[i]);
            g_history[i] = NULL;
        }
    }
    g_history_count = 0;
}
