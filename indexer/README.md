# GridEx Indexer

A Go-based blockchain indexer that scans EVM chains for GridEx smart contract events and writes them to PostgreSQL, while publishing real-time notifications to Kafka.

## Architecture

```
┌─────────────┐     ┌──────────┐     ┌────────────┐
│  EVM Chain  │────▶│  Scanner │────▶│ PostgreSQL │
│  (RPC)      │     │          │────▶│  Kafka     │
└─────────────┘     └──────────┘     └────────────┘
```

### Components

- **`config/`** — YAML configuration with environment variable expansion
- **`contracts/`** — ABI event decoder and on-chain contract caller (getGridOrder, ERC20 metadata)
- **`db/`** — PostgreSQL connection pool and transactional repository
- **`kafka/`** — Kafka producer with typed event messages
- **`scanner/`** — Main scanning loop and event handlers

## Events Handled

| Event | Description | DB Tables Affected |
|-------|-------------|-------------------|
| `PairCreated` | New trading pair registered | `pairs`, `tokens` |
| `GridOrderCreated` | New grid order placed | `grids`, `orders`, `tokens`, `pairs` |
| `FilledOrder` | Order filled by taker | `order_fills`, `orders` |
| `CancelGridOrder` | Single order cancelled | `orders` |
| `CancelWholeGrid` | Entire grid cancelled | `grids`, `orders`, `pairs` |
| `GridFeeChanged` | Grid fee modified | `grids` |
| `WithdrawProfit` | Profits withdrawn | `grids` |

## Prerequisites

- Go 1.22+
- PostgreSQL 14+
- Kafka (Apache Kafka or compatible)
- Access to an EVM RPC endpoint

## Build

```bash
cd indexer
go mod tidy
go build -o gridex-indexer .
```

## Configuration

The indexer uses environment-specific configuration files:

- `config.yaml` — Default configuration (used for local development)
- `config.prod.yaml` — Production environment configuration

Configuration supports environment variable expansion using `${VAR:-default}` syntax.

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | EVM RPC endpoint URL | `https://testnet-rpc.monad.xyz` |
| `START_BLOCK` | Block number to start scanning from | `0` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USER` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_NAME` | PostgreSQL database name | `gridex` |
| `DB_SSLMODE` | PostgreSQL SSL mode | `disable` |
| `KAFKA_BROKER` | Kafka broker address | `localhost:9092` |
| `KAFKA_TOPIC` | Kafka topic for events | `gridex-events` |
| `LOG_LEVEL` | Log level (debug/info/warn/error) | `info` |

## Run

### Local Development

```bash
# Using default config.yaml
./gridex-indexer

# Or explicitly specify config file
./gridex-indexer -config config.yaml

# Using production config
./gridex-indexer -config config.prod.yaml

# With environment variables
RPC_URL=https://my-rpc.example.com DB_PASSWORD=secret ./gridex-indexer
```

### Docker

```bash
# Build the image
docker build -t gridex-indexer .

# Run with prod config (default in Docker)
docker run --rm gridex-indexer

# Run with dev config (set ENV=dev)
docker run --rm -e ENV=dev gridex-indexer

# Run with environment variable overrides
docker run --rm -e RPC_URL=https://my-rpc.example.com -e DB_PASSWORD=secret gridex-indexer

# Mount custom config file (overrides built-in config)
docker run --rm -v $(pwd)/config.yaml:/app/config.yaml gridex-indexer
```

The Docker image includes both `config.yaml` (default) and `config.prod.yaml`. By default, Docker runs with `ENV=prod` to use the production config. Set `ENV=dev` to use the default config instead.

### Docker Compose

The indexer can be run via Docker Compose, connecting to host services (PostgreSQL, Kafka):

```bash
# Copy environment file and edit as needed
cp .env.example .env

# Start the indexer
docker compose up -d

# View logs
docker compose logs -f indexer

# Stop the indexer
docker compose down
```

The `docker-compose.yml` runs only the indexer service, connecting to:
- **PostgreSQL** — Running on the host (`host.docker.internal:5432`)
- **Kafka** — Running on the host (`host.docker.internal:9092`)

Make sure PostgreSQL and Kafka are running on your host machine before starting the indexer container.

## Database

The indexer writes to the following tables (must be created beforehand via the backend migrations):

- `pairs` — Trading pairs
- `tokens` — ERC20 token metadata
- `grids` — Grid orders
- `orders` — Individual orders within grids
- `order_fills` — Order fill history

The indexer automatically creates the `indexer_state` table on startup to track scanning progress.

## Kafka Messages

All events are published to a single configurable Kafka topic as JSON messages with the following envelope:

```json
{
  "event_type": "order_filled",
  "chain_id": 10143,
  "block_number": 12345678,
  "tx_hash": "0x...",
  "log_index": 0,
  "timestamp": 1700000000,
  "data": { ... }
}
```

### Event Types

- `pair_created` — New pair registered
- `grid_created` — New grid order placed
- `order_created` — Individual order created (one per ask/bid in a grid)
- `order_filled` — Order filled
- `order_cancelled` — Single order cancelled
- `grid_cancelled` — Entire grid cancelled
- `grid_fee_changed` — Grid fee modified
- `profit_withdrawn` — Profits withdrawn

## Transactional Consistency

All database writes and the block progress update happen within a single PostgreSQL transaction. Kafka messages are sent within the same transaction boundary — if Kafka publishing fails, the transaction is rolled back, ensuring no data inconsistency between the database and the message queue.

## License

MIT
