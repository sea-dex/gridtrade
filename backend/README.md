# GridEx Backend API

Backend API for GridEx Decentralized Grid Trading Protocol, built with Fastify, TypeScript, Drizzle ORM, and PostgreSQL.

## Features

- 🚀 **Fastify** - High-performance web framework
- 📝 **TypeScript** - Type-safe development
- 🗃️ **Drizzle ORM** - Type-safe database operations with PostgreSQL
- ✅ **Zod** - Runtime type validation
- 📚 **Swagger/OpenAPI** - Auto-generated API documentation
- 🌍 **i18n** - Multi-language support (EN, ZH, JA, KO, ES, RU, PT, FR, DE)
- 🔒 **Security** - Helmet, CORS, Rate limiting
- 🧪 **Testing** - Vitest for unit and integration tests

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- pnpm (recommended) or npm

## Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

## Database Setup

```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Or push schema directly (development)
pnpm db:push

# Seed database with sample data
pnpm db:seed

# Open Drizzle Studio (database GUI)
pnpm db:studio
```

## Development

```bash
# Start development server with hot reload
pnpm dev
```

The server will start at `http://localhost:3001` by default.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint errors |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check code formatting |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed database with sample data |

## Project Structure

```
backend-ts/
├── drizzle/              # Database migrations
├── src/
│   ├── config/           # Configuration files
│   │   ├── env.ts        # Environment variables
│   │   └── chains.ts     # Blockchain chain configs
│   ├── db/               # Database
│   │   ├── index.ts      # Database connection
│   │   ├── schema.ts     # Drizzle schema
│   │   └── seed.ts       # Database seeding
│   ├── i18n/             # Internationalization
│   │   ├── index.ts      # i18n utilities
│   │   └── locales/      # Translation files
│   ├── routes/           # API routes
│   │   ├── grids.ts      # Grid endpoints
│   │   ├── orders.ts     # Order endpoints
│   │   ├── stats.ts      # Statistics endpoints
│   │   └── leaderboard.ts # Leaderboard endpoints
│   ├── schemas/          # Zod validation schemas
│   ├── services/         # Business logic
│   └── index.ts          # Application entry point
├── .env.example          # Environment template
├── drizzle.config.ts     # Drizzle configuration
├── package.json
├── tsconfig.json
└── README.md
```

## API Endpoints

### Grids
- `GET /api/v1/grids` - List grid orders
- `GET /api/v1/grids/:grid_id` - Get grid details
- `GET /api/v1/grids/:grid_id/profits` - Get grid profits

### Orders
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:order_id` - Get order details
- `GET /api/v1/orders/:order_id/fills` - Get order fill history

### Statistics
- `GET /api/v1/stats` - Get protocol statistics
- `GET /api/v1/stats/pairs` - Get pair statistics
- `GET /api/v1/stats/volume` - Get volume statistics
- `GET /api/v1/stats/tvl` - Get TVL breakdown

### Leaderboard
- `GET /api/v1/leaderboard` - Get leaderboard
- `GET /api/v1/leaderboard/trader/:address` - Get trader statistics
- `GET /api/v1/leaderboard/pairs` - Get top performing pairs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection URL | - |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` |
| `LOG_LEVEL` | Logging level | `info` |
| `LOG_FORMAT` | Log format (`text` or `json`) | `text` in development, `json` in production |

## Docker

```
docker compose down
docker compose build
docker compose up -d
```

## Supported Chains

- Ethereum (Chain ID: 1)
- BNB Smart Chain (Chain ID: 56)
- Base (Chain ID: 8453)
- BNB Smart Chain Testnet (Chain ID: 97)

## License

MIT
