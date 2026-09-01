.PHONY: all engine backend frontend test clean docs

all: engine

engine:
	$(MAKE) -C engine all

test:
	$(MAKE) -C engine test

clean:
	$(MAKE) -C engine clean

docs:
	@echo "Documentation located in docs/"
