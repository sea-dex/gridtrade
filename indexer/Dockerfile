# ──────────────────────────────────────────────────────────────
# GridEx Indexer – Multi-stage Dockerfile
# ──────────────────────────────────────────────────────────────
# Build:  docker build -t gridex-indexer .
# Run:    docker run --rm -v $(pwd)/config.yaml:/app/config.yaml gridex-indexer
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────
FROM golang:1.24-alpine AS builder

# Install build dependencies (git for go modules, ca-certs for HTTPS)
RUN apk add --no-cache git ca-certificates tzdata

WORKDIR /src

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build arguments for version info
ARG VERSION=dev
ARG COMMIT=unknown
ARG BUILD_TIME=unknown

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags "-s -w \
      -X main.version=${VERSION} \
      -X main.commit=${COMMIT} \
      -X main.buildTime=${BUILD_TIME}" \
    -o /bin/indexer .

# ── Stage 2: Runtime ─────────────────────────────────────────
FROM alpine:3.21

# Install runtime dependencies
RUN apk add --no-cache ca-certificates tzdata

# Create non-root user
RUN addgroup -S indexer && adduser -S indexer -G indexer

WORKDIR /app

# Copy binary from builder
COPY --from=builder /bin/indexer /app/indexer

# Copy ABI file (needed at runtime for event decoding)
COPY GridEx.json /app/GridEx.json

# Copy migration files
COPY migrations/ /app/migrations/

# Switch to non-root user
USER indexer

# Default config path (mount or override via -config flag)
ENV CONFIG_PATH=/app/config.yaml

ENTRYPOINT ["/app/indexer"]
CMD ["-config", "/app/config.yaml"]
