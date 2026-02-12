# ──────────────────────────────────────────────────────────────
# GridEx Indexer – Makefile
# ──────────────────────────────────────────────────────────────

# Project metadata
MODULE   := github.com/gridex/indexer
BINARY   := indexer
VERSION  ?= $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT   ?= $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME := $(shell date -u '+%Y-%m-%dT%H:%M:%SZ')

# Go toolchain
GO       := go
GOFLAGS  ?=
LDFLAGS  := -s -w \
	-X main.version=$(VERSION) \
	-X main.commit=$(COMMIT) \
	-X main.buildTime=$(BUILD_TIME)

# Directories
SRC_DIR  := .
OUT_DIR  := bin

# All Go source files (for dependency tracking)
GO_FILES := $(shell find . -name '*.go' -not -path './vendor/*')

# ──────────────────────────────────────────────────────────────
# Default target
# ──────────────────────────────────────────────────────────────
.PHONY: all
all: check build ## Run all checks and build

# ──────────────────────────────────────────────────────────────
# Build
# ──────────────────────────────────────────────────────────────
.PHONY: build
build: ## Build the indexer binary
	@echo "==> Building $(BINARY)..."
	@mkdir -p $(OUT_DIR)
	$(GO) build $(GOFLAGS) -ldflags '$(LDFLAGS)' -o $(OUT_DIR)/$(BINARY) $(SRC_DIR)

.PHONY: build-linux
build-linux: ## Cross-compile for Linux amd64
	@echo "==> Cross-compiling for linux/amd64..."
	@mkdir -p $(OUT_DIR)
	GOOS=linux GOARCH=amd64 $(GO) build $(GOFLAGS) -ldflags '$(LDFLAGS)' -o $(OUT_DIR)/$(BINARY)-linux-amd64 $(SRC_DIR)

.PHONY: build-linux-arm64
build-linux-arm64: ## Cross-compile for Linux arm64
	@echo "==> Cross-compiling for linux/arm64..."
	@mkdir -p $(OUT_DIR)
	GOOS=linux GOARCH=arm64 $(GO) build $(GOFLAGS) -ldflags '$(LDFLAGS)' -o $(OUT_DIR)/$(BINARY)-linux-arm64 $(SRC_DIR)

# ──────────────────────────────────────────────────────────────
# Quality checks (individual)
# ──────────────────────────────────────────────────────────────
.PHONY: fmt
fmt: ## Run gofmt and report files that differ
	@echo "==> Checking gofmt..."
	@DIFF=$$(gofmt -l $(GO_FILES)); \
	if [ -n "$$DIFF" ]; then \
		echo "The following files are not formatted:"; \
		echo "$$DIFF"; \
		exit 1; \
	fi
	@echo "    gofmt OK"

.PHONY: fmt-fix
fmt-fix: ## Auto-fix formatting with gofmt
	@echo "==> Formatting code..."
	gofmt -w $(GO_FILES)
	@echo "    Done"

.PHONY: goimports
goimports: ## Check import ordering with goimports (install: go install golang.org/x/tools/cmd/goimports@latest)
	@echo "==> Checking goimports..."
	@if command -v goimports >/dev/null 2>&1; then \
		DIFF=$$(goimports -l $(GO_FILES)); \
		if [ -n "$$DIFF" ]; then \
			echo "The following files have import issues:"; \
			echo "$$DIFF"; \
			exit 1; \
		fi; \
		echo "    goimports OK"; \
	else \
		echo "    goimports not installed, skipping (go install golang.org/x/tools/cmd/goimports@latest)"; \
	fi

.PHONY: goimports-fix
goimports-fix: ## Auto-fix imports with goimports
	@echo "==> Fixing imports..."
	@if command -v goimports >/dev/null 2>&1; then \
		goimports -w $(GO_FILES); \
		echo "    Done"; \
	else \
		echo "    goimports not installed (go install golang.org/x/tools/cmd/goimports@latest)"; \
	fi

.PHONY: vet
vet: ## Run go vet
	@echo "==> Running go vet..."
	$(GO) vet ./...
	@echo "    go vet OK"

.PHONY: lint
lint: ## Run golangci-lint (install: https://golangci-lint.run/welcome/install/)
	@echo "==> Running golangci-lint..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run ./...; \
		echo "    golangci-lint OK"; \
	else \
		echo "    golangci-lint not installed, skipping"; \
		echo "    Install: https://golangci-lint.run/welcome/install/"; \
	fi

.PHONY: staticcheck
staticcheck: ## Run staticcheck (install: go install honnef.co/go/tools/cmd/staticcheck@latest)
	@echo "==> Running staticcheck..."
	@if command -v staticcheck >/dev/null 2>&1; then \
		staticcheck ./...; \
		echo "    staticcheck OK"; \
	else \
		echo "    staticcheck not installed, skipping (go install honnef.co/go/tools/cmd/staticcheck@latest)"; \
	fi

.PHONY: errcheck
errcheck: ## Check for unchecked errors (install: go install github.com/kisielk/errcheck@latest)
	@echo "==> Running errcheck..."
	@if command -v errcheck >/dev/null 2>&1; then \
		errcheck ./...; \
		echo "    errcheck OK"; \
	else \
		echo "    errcheck not installed, skipping (go install github.com/kisielk/errcheck@latest)"; \
	fi

# ──────────────────────────────────────────────────────────────
# Aggregate check targets
# ──────────────────────────────────────────────────────────────
.PHONY: check
check: fmt vet lint staticcheck errcheck ## Run all checks (fmt + vet + lint + staticcheck + errcheck)

.PHONY: fix
fix: fmt-fix goimports-fix ## Auto-fix formatting and imports

# ──────────────────────────────────────────────────────────────
# Test
# ──────────────────────────────────────────────────────────────
.PHONY: test
test: ## Run tests
	@echo "==> Running tests..."
	$(GO) test -race -count=1 ./...

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	@echo "==> Running tests (verbose)..."
	$(GO) test -race -count=1 -v ./...

.PHONY: test-cover
test-cover: ## Run tests with coverage report
	@echo "==> Running tests with coverage..."
	@mkdir -p $(OUT_DIR)
	$(GO) test -race -count=1 -coverprofile=$(OUT_DIR)/coverage.out ./...
	$(GO) tool cover -html=$(OUT_DIR)/coverage.out -o $(OUT_DIR)/coverage.html
	@echo "    Coverage report: $(OUT_DIR)/coverage.html"

# ──────────────────────────────────────────────────────────────
# Dependencies
# ──────────────────────────────────────────────────────────────
.PHONY: tidy
tidy: ## Tidy and verify module dependencies
	@echo "==> Tidying modules..."
	$(GO) mod tidy
	$(GO) mod verify
	@echo "    Modules OK"

.PHONY: deps
deps: ## Download dependencies
	@echo "==> Downloading dependencies..."
	$(GO) mod download

# ──────────────────────────────────────────────────────────────
# Tools installation
# ──────────────────────────────────────────────────────────────
.PHONY: tools
tools: ## Install development tools
	@echo "==> Installing development tools..."
	$(GO) install golang.org/x/tools/cmd/goimports@latest
	$(GO) install honnef.co/go/tools/cmd/staticcheck@latest
	$(GO) install github.com/kisielk/errcheck@latest
	@echo "    Tools installed"
	@echo "    Note: Install golangci-lint separately: https://golangci-lint.run/welcome/install/"

# ──────────────────────────────────────────────────────────────
# Clean
# ──────────────────────────────────────────────────────────────
.PHONY: clean
clean: ## Remove build artifacts
	@echo "==> Cleaning..."
	rm -rf $(OUT_DIR)
	rm -f main
	@echo "    Clean"

# ──────────────────────────────────────────────────────────────
# CI target (suitable for CI pipelines)
# ──────────────────────────────────────────────────────────────
.PHONY: ci
ci: check test build ## Full CI pipeline: check + test + build

# ──────────────────────────────────────────────────────────────
# Help
# ──────────────────────────────────────────────────────────────
.PHONY: help
help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
