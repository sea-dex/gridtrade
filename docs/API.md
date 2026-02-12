# GridEx API Documentation

## Overview

The GridEx API provides endpoints for interacting with the GridEx decentralized grid trading protocol. The API is built with Fastify and TypeScript, using Zod for validation and Drizzle ORM for database operations.

## Base URL

- Development: `http://localhost:3001/api/v1`
- Production: `https://api.gridex.io/api/v1`

## Authentication

Currently, the API is public and does not require authentication. Future versions may include wallet-based authentication.

## Common Parameters

### Chain ID

All endpoints accept a `chain_id` query parameter to specify the blockchain network:

| Chain ID | Network |
|----------|---------|
| 1 | Ethereum Mainnet |
| 56 | BNB Smart Chain |
| 8453 | Base |
| 97 | BNB Smart Chain Testnet |

Default: `97` (BNB Smart Chain Testnet)

### Pagination

List endpoints support pagination with the following parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `page_size` | number | 20 | Items per page (max: 100) |

## Endpoints

### Grids

#### List Grids

```
GET /grids
```

Get a list of grid orders with optional filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |
| `owner` | string | No | Filter by owner address |
| `status` | number | No | Filter by status (1=active, 2=cancelled) |
| `page` | number | No | Page number |
| `page_size` | number | No | Items per page |

**Response:**

```json
{
  "grids": [
    {
      "grid_id": 1,
      "owner": "0x1234567890abcdef1234567890abcdef12345678",
      "pair_id": 1,
      "base_token": "WBNB",
      "quote_token": "USDT",
      "ask_order_count": 5,
      "bid_order_count": 5,
      "base_amount": "10000000000000000000",
      "profits": "500000000000000000",
      "fee": 30,
      "compound": true,
      "oneshot": false,
      "status": 1,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

#### Get Grid Details

```
GET /grids/:grid_id
```

Get detailed information about a specific grid including all orders.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `grid_id` | number | Grid ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |

**Response:**

```json
{
  "config": {
    "grid_id": 1,
    "owner": "0x1234567890abcdef1234567890abcdef12345678",
    "pair_id": 1,
    "base_token": "WBNB",
    "quote_token": "USDT",
    "ask_order_count": 5,
    "bid_order_count": 5,
    "base_amount": "10000000000000000000",
    "profits": "500000000000000000",
    "fee": 30,
    "compound": true,
    "oneshot": false,
    "status": 1,
    "created_at": "2024-01-15T10:30:00Z"
  },
  "orders": [
    {
      "order_id": 1,
      "grid_id": 1,
      "is_ask": true,
      "price": "100000000000000000000",
      "amount": "1000000000000000000",
      "rev_amount": "0",
      "status": 0
    }
  ]
}
```

#### Get Grid Profits

```
GET /grids/:grid_id/profits
```

Get accumulated profits for a grid.

**Response:**

```json
{
  "grid_id": 1,
  "profits": "500000000000000000",
  "quote_token": "USDT"
}
```

### Orders

#### List Orders

```
GET /orders
```

Get a list of orders with optional filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |
| `grid_id` | number | No | Filter by grid ID |
| `pair_id` | number | No | Filter by pair ID |
| `is_ask` | boolean | No | Filter by order type |

**Response:**

```json
{
  "orders": [
    {
      "order_id": 1,
      "grid_id": 1,
      "pair_id": 1,
      "is_ask": true,
      "compound": true,
      "oneshot": false,
      "fee": 30,
      "status": 0,
      "amount": "1000000000000000000",
      "rev_amount": "0",
      "base_amount": "1000000000000000000",
      "price": "100000000000000000000",
      "rev_price": "95000000000000000000"
    }
  ],
  "total": 50
}
```

#### Get Order Details

```
GET /orders/:order_id
```

Get detailed information about a specific order.

**Response:**

```json
{
  "order_id": 1,
  "grid_id": 1,
  "pair_id": 1,
  "is_ask": true,
  "compound": true,
  "oneshot": false,
  "fee": 30,
  "status": 0,
  "amount": "1000000000000000000",
  "rev_amount": "0",
  "base_amount": "1000000000000000000",
  "price": "100000000000000000000",
  "rev_price": "95000000000000000000"
}
```

#### Get Order Fills

```
GET /orders/:order_id/fills
```

Get fill history for a specific order.

**Response:**

```json
{
  "fills": [
    {
      "tx_hash": "0xabc123...",
      "taker": "0x9876543210fedcba9876543210fedcba98765432",
      "order_id": 1,
      "filled_amount": "500000000000000000",
      "filled_volume": "50000000000000000000",
      "is_ask": true,
      "timestamp": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 5
}
```

### Statistics

#### Get Protocol Statistics

```
GET /stats
```

Get overall protocol statistics.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |

**Response:**

```json
{
  "protocol": {
    "total_volume": "12500000000000000000000000",
    "total_tvl": "3200000000000000000000000",
    "total_grids": 1234,
    "total_trades": 45678,
    "total_profit": "890000000000000000000000",
    "active_users": 5678
  },
  "volume_history": [
    {
      "date": "2024-01-15",
      "volume": "850000000000000000000000"
    }
  ],
  "tvl_history": [
    {
      "date": "2024-01-15",
      "tvl": "500000000000000000000000"
    }
  ]
}
```

#### Get Pair Statistics

```
GET /stats/pairs
```

Get statistics for all trading pairs.

**Response:**

```json
{
  "pairs": [
    {
      "pair_id": 1,
      "base_token": "WBNB",
      "quote_token": "USDT",
      "volume_24h": "1500000000000000000000000",
      "trades_24h": 1234,
      "active_grids": 456
    }
  ]
}
```

#### Get Volume Statistics

```
GET /stats/volume
```

Get volume statistics for a specific time period.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |
| `period` | string | No | Time period: 24h, 7d, 30d, all (default: 7d) |

**Response:**

```json
{
  "period": "7d",
  "total_volume": "5950000000000000000000000",
  "total_trades": 10500,
  "avg_trade_size": "566666666666666666666"
}
```

#### Get TVL Statistics

```
GET /stats/tvl
```

Get current TVL breakdown.

**Response:**

```json
{
  "total_tvl": "3200000000000000000000000",
  "breakdown": [
    {
      "token": "WBNB",
      "amount": "1500000000000000000000000"
    },
    {
      "token": "USDT",
      "amount": "1000000000000000000000000"
    }
  ]
}
```

### Leaderboard

#### Get Leaderboard

```
GET /leaderboard
```

Get leaderboard of top performing grid strategies.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |
| `period` | string | No | Time period: 24h, 7d, 30d, all (default: 7d) |
| `pair` | string | No | Filter by trading pair |
| `limit` | number | No | Number of entries (default: 10, max: 100) |

**Response:**

```json
{
  "entries": [
    {
      "rank": 1,
      "trader": "0x1234567890abcdef1234567890abcdef12345678",
      "pair": "BNB/USDT",
      "grid_id": 1,
      "profit": "12500000000000000000000",
      "profit_rate": 45.2,
      "volume": "125000000000000000000000",
      "trades": 234
    }
  ],
  "total": 10,
  "period": "7d"
}
```

#### Get Trader Statistics

```
GET /leaderboard/trader/:address
```

Get statistics for a specific trader.

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | Trader wallet address |

**Response:**

```json
{
  "address": "0x1234567890abcdef1234567890abcdef12345678",
  "rank": 1,
  "total_profit": "12500000000000000000000",
  "total_volume": "125000000000000000000000",
  "total_trades": 234,
  "active_grids": 3,
  "best_pair": "BNB/USDT"
}
```

#### Get Top Pairs

```
GET /leaderboard/pairs
```

Get top performing trading pairs.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `chain_id` | number | No | Chain ID (default: 97) |
| `period` | string | No | Time period: 24h, 7d, 30d, all (default: 7d) |
| `limit` | number | No | Number of pairs (default: 5, max: 20) |

**Response:**

```json
{
  "pairs": [
    {
      "pair": "BNB/USDT",
      "total_profit": "25000000000000000000000",
      "total_volume": "250000000000000000000000",
      "total_trades": 500,
      "active_grids": 50
    }
  ]
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Default limit**: 100 requests per minute per IP
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Internationalization

The API supports multiple languages. Set the `Accept-Language` header to receive localized error messages:

- `en` - English (default)
- `zh` - Chinese
- `ja` - Japanese
- `ko` - Korean
- `es` - Spanish
- `ru` - Russian
- `pt` - Portuguese
- `fr` - French
- `de` - German

## OpenAPI/Swagger

Interactive API documentation is available at:

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/docs/json`
