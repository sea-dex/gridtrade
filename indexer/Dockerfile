# ──────────────────────────────────────────────────────────────
# GridEx Indexer – Multi-stage Dockerfile
# ──────────────────────────────────────────────────────────────
# Build:  docker build -t gridex-indexer .
# Run (dev):  docker run --rm -e ENV=dev gridex-indexer
# Run (prod): docker run --rm -e ENV=prod gridex-indexer
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

# Copy config files for different environments
# config.yaml is the default (dev settings)
COPY config.yaml /app/config.yaml
COPY config.prod.yaml /app/config.prod.yaml

# Switch to non-root user
USER indexer

# Environment variable to select config (dev or prod)
# Default is "prod" for Docker deployments
ENV ENV=prod

# Create a wrapper script to select config based on ENV
USER root
RUN echo '#!/bin/sh' > /app/entrypoint.sh && \
    echo 'if [ "$ENV" = "prod" ]; then' >> /app/entrypoint.sh && \
    echo '  CONFIG_FILE="/app/config.prod.yaml"' >> /app/entrypoint.sh && \
    echo 'else' >> /app/entrypoint.sh && \
    echo '  CONFIG_FILE="/app/config.yaml"' >> /app/entrypoint.sh && \
    echo 'fi' >> /app/entrypoint.sh && \
    echo 'echo "Using config: $CONFIG_FILE"' >> /app/entrypoint.sh && \
    echo 'exec /app/indexer -config "$CONFIG_FILE" "$@"' >> /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh && \
    chown indexer:indexer /app/entrypoint.sh
USER indexer

ENTRYPOINT ["/app/entrypoint.sh"]
CMD []
