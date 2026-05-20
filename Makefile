# Variables
ZIP ?= zip
DIST_DIR = ./dist

.PHONY: all
all: build

.PHONY: build
build: clean
	@echo "Building $(DIST_DIR)..."
	mkdir -p ${DIST_DIR}
	${ZIP} -r ${DIST_DIR}/iscsiquickconnect@dmfs.org.zip . -x .idea/\* dist/\* Makefile .gitignore .git/\* screenshots/\* schemas/\*.compiled

.PHONY: clean
clean:
	@echo "Cleaning up..."
	rm -f $(DIST_DIR)/*

.PHONY: publish
publish: clean build
	gnome-extensions upload -u dmfs -p "${PASSWORD}" --accept-tos ${DIST_DIR}/iscsiquickconnect@dmfs.org.zip
