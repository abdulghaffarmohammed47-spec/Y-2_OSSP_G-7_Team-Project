CC ?= gcc
CFLAGS = -Wall -Wextra -Wpedantic -g -Iinclude -Isrc -D_GNU_SOURCE
TARGET = shellforge-engine
COMPAT_TARGET = shellforge_engine

SRCS = src/main.c \
       src/parser.c \
       src/executor.c \
       src/process.c \
       src/pipeline.c \
       src/redirect.c \
       src/sandbox.c \
       src/jobs.c \
       src/signals.c \
       src/builtin.c \
       src/history.c

OBJS = $(SRCS:.c=.o)

TEST_PARSER_TARGET = test_parser
TEST_PARSER_SRCS = tests/test_parser.c src/parser.c
TEST_PARSER_OBJS = $(TEST_PARSER_SRCS:.c=.o)

.PHONY: all clean test valgrind trace debug test_parser

all: $(TARGET) $(COMPAT_TARGET) $(TEST_PARSER_TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $(OBJS)

$(COMPAT_TARGET): $(TARGET)
	cp $(TARGET) $(COMPAT_TARGET)

$(TEST_PARSER_TARGET): $(TEST_PARSER_OBJS)
	$(CC) $(CFLAGS) -o $@ $(TEST_PARSER_OBJS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

test: $(TARGET) $(TEST_PARSER_TARGET)
	./$(TEST_PARSER_TARGET)
	./$(TARGET) --test

valgrind: $(TARGET)
	valgrind --leak-check=full --show-leak-kinds=all ./$(TARGET) --test

trace: $(TARGET)
	strace -f ./$(TARGET) --test

debug: $(TARGET)
	gdb ./$(TARGET)

clean:
	rm -f $(OBJS) $(TEST_PARSER_OBJS) $(TARGET) $(COMPAT_TARGET) $(TEST_PARSER_TARGET)
