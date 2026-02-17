# ──────────────────────────────────────────────────────────────
# GridEx Backend – Multi-stage Dockerfile
# ──────────────────────────────────────────────────────────────
# Build:
#   docker build -t gridex-backend .
#
# Run:
#   docker run --rm \
#     -v $(pwd)/.env.production.local:/app/.env.production.local:ro \
#     -v $(pwd)/logs:/app/logs \
#     -p 3001:3001 \
#     gridex-backend
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────
FROM node:24-alpine AS deps

WORKDIR /app

# Copy package manifests first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
# RUN corepack enable && corepack prepare pnpm@latest --activate \
    # && pnpm install --frozen-lockfile
RUN npm install -g pnpm@10 && pnpm install --frozen-lockfile

# ── Stage 2: Build TypeScript ────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml tsconfig.json ./
COPY src ./src
COPY drizzle ./drizzle

# RUN corepack enable && corepack prepare pnpm@latest --activate \
#     && pnpm run build
RUN npm install -g pnpm@10 && pnpm run build

# ── Stage 3: Production runtime ──────────────────────────────
FROM node:24-alpine AS runtime

# Accept proxy build arguments (passed from docker-compose)
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

# Set proxy environment variables for apk if provided
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}
ENV NO_PROXY=${NO_PROXY}

# Use Chinese mirror for Alpine packages (more reliable in China)
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# Install tini for proper PID 1 signal handling
RUN apk add --no-cache tini tzdata

# Create non-root user
RUN addgroup -S backend && adduser -S backend -G backend

WORKDIR /app

# Copy package manifests
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only
# RUN corepack enable && corepack prepare pnpm@latest --activate \
#     && pnpm install --frozen-lockfile --prod
RUN npm install -g pnpm@10 && pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy drizzle migrations (needed for db:migrate at startup)
COPY --from=builder /app/drizzle ./drizzle
COPY drizzle.config.ts ./

# Create logs directory and set ownership
RUN mkdir -p /app/logs && chown -R backend:backend /app/logs

# The .env.production.local file is mounted at runtime, not baked into the image.
# Mount point: /app/.env.production.local

# Log directory is also mounted from host for persistence.
# Mount point: /app/logs

# Switch to non-root user
USER backend

# Expose the API port
EXPOSE 5001

# Use tini as entrypoint for proper signal forwarding
ENTRYPOINT ["/sbin/tini", "--"]

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["node", "dist/index.js"]
