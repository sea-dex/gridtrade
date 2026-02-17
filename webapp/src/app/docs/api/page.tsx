'use client';

import {
  DocH1,
  DocH2,
  DocH3,
  DocP,
  DocUl,
  DocLi,
  DocTable,
  DocCode,
  DocCodeBlock,
  DocBlockquote,
  DocHr,
  DocEndpoint,
  DocStrong,
  DocLink,
} from '../_components/DocsProse';
import { DocsPageNav } from '../_components/DocsPageNav';

export default function ApiReferencePage() {
  return (
    <div>
      <DocH1>API Reference</DocH1>

      {/* ── Overview ── */}
      <DocH2 id="overview">Overview</DocH2>
      <DocP>
        The GridEx API provides endpoints for interacting with the GridEx
        decentralized grid trading protocol. The API is built with Fastify and
        TypeScript, using Zod for validation and Drizzle ORM for database
        operations.
      </DocP>

      <DocH3>Base URL</DocH3>
      <DocTable
        headers={['Environment', 'URL']}
        rows={[
          ['Development', 'http://localhost:3001/api/v1'],
          ['Production', 'https://api.gridex.io/api/v1'],
        ]}
      />

      {/* ── Authentication ── */}
      <DocH2 id="authentication">Authentication</DocH2>
      <DocP>
        Currently, the API is public and does not require authentication. Future
        versions may include wallet-based authentication.
      </DocP>

      {/* ── Common Parameters ── */}
      <DocH2 id="common-parameters">Common Parameters</DocH2>

      <DocH3>Chain ID</DocH3>
      <DocP>
        All endpoints accept a <DocCode>chain_id</DocCode> query parameter to
        specify the blockchain network:
      </DocP>
      <DocTable
        headers={['Chain ID', 'Network']}
        rows={[
          ['1', 'Ethereum Mainnet'],
          ['56', 'BNB Smart Chain'],
          ['8453', 'Base'],
          ['97', 'BNB Smart Chain Testnet'],
        ]}
      />
      <DocP>
        Default: <DocCode>97</DocCode> (BNB Smart Chain Testnet)
      </DocP>

      <DocH3>Pagination</DocH3>
      <DocP>
        List endpoints support pagination with the following parameters:
      </DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Default', 'Description']}
        rows={[
          ['page', 'number', '1', 'Page number (1-indexed)'],
          ['page_size', 'number', '20', 'Items per page (max: 100)'],
        ]}
      />

      <DocHr />

      {/* ── Grids ── */}
      <DocH2 id="grids">Grids</DocH2>

      <DocH3>List Grids</DocH3>
      <DocEndpoint method="GET" path="/grids" />
      <DocP>Get a list of grid orders with optional filters.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[
          ['chain_id', 'number', 'No', 'Chain ID (default: 97)'],
          ['owner', 'string', 'No', 'Filter by owner address'],
          ['status', 'number', 'No', 'Filter by status (1=active, 2=cancelled)'],
          ['page', 'number', 'No', 'Page number'],
          ['page_size', 'number', 'No', 'Items per page'],
        ]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "grids": [
    {
      "grid_id": 1,
      "owner": "0x1234...5678",
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
}`}</DocCodeBlock>

      <DocH3>Get Grid Details</DocH3>
      <DocEndpoint method="GET" path="/grids/:grid_id" />
      <DocP>
        Get detailed information about a specific grid including all orders.
      </DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Description']}
        rows={[['grid_id', 'number', 'Grid ID (path parameter)']]}
      />
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[['chain_id', 'number', 'No', 'Chain ID (default: 97)']]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "config": {
    "grid_id": 1,
    "owner": "0x1234...5678",
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
}`}</DocCodeBlock>

      <DocH3>Get Grid Profits</DocH3>
      <DocEndpoint method="GET" path="/grids/:grid_id/profits" />
      <DocP>Get accumulated profits for a grid.</DocP>
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "grid_id": 1,
  "profits": "500000000000000000",
  "quote_token": "USDT"
}`}</DocCodeBlock>

      <DocHr />

      {/* ── Orders ── */}
      <DocH2 id="orders">Orders</DocH2>

      <DocH3>List Orders</DocH3>
      <DocEndpoint method="GET" path="/orders" />
      <DocP>Get a list of orders with optional filters.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[
          ['chain_id', 'number', 'No', 'Chain ID (default: 97)'],
          ['grid_id', 'number', 'No', 'Filter by grid ID'],
          ['pair_id', 'number', 'No', 'Filter by pair ID'],
          ['is_ask', 'boolean', 'No', 'Filter by order type'],
        ]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
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
}`}</DocCodeBlock>

      <DocH3>Get Order Details</DocH3>
      <DocEndpoint method="GET" path="/orders/:order_id" />
      <DocP>Get detailed information about a specific order.</DocP>
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
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
}`}</DocCodeBlock>

      <DocH3>Get Order Fills</DocH3>
      <DocEndpoint method="GET" path="/orders/:order_id/fills" />
      <DocP>Get fill history for a specific order.</DocP>
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "fills": [
    {
      "tx_hash": "0xabc123...",
      "taker": "0x9876...5432",
      "order_id": 1,
      "filled_amount": "500000000000000000",
      "filled_volume": "50000000000000000000",
      "is_ask": true,
      "timestamp": "2024-01-15T12:00:00Z"
    }
  ],
  "total": 5
}`}</DocCodeBlock>

      <DocHr />

      {/* ── Statistics ── */}
      <DocH2 id="statistics">Statistics</DocH2>

      <DocH3>Get Protocol Statistics</DocH3>
      <DocEndpoint method="GET" path="/stats" />
      <DocP>Get overall protocol statistics.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[['chain_id', 'number', 'No', 'Chain ID (default: 97)']]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "protocol": {
    "total_volume": "12500000000000000000000000",
    "total_tvl": "3200000000000000000000000",
    "total_grids": 1234,
    "total_trades": 45678,
    "total_profit": "890000000000000000000000",
    "active_users": 5678
  },
  "volume_history": [
    { "date": "2024-01-15", "volume": "850000000000000000000000" }
  ],
  "tvl_history": [
    { "date": "2024-01-15", "tvl": "500000000000000000000000" }
  ]
}`}</DocCodeBlock>

      <DocH3>Get Pair Statistics</DocH3>
      <DocEndpoint method="GET" path="/stats/pairs" />
      <DocP>Get statistics for all trading pairs.</DocP>
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
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
}`}</DocCodeBlock>

      <DocH3>Get Volume Statistics</DocH3>
      <DocEndpoint method="GET" path="/stats/volume" />
      <DocP>Get volume statistics for a specific time period.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[
          ['chain_id', 'number', 'No', 'Chain ID (default: 97)'],
          [
            'period',
            'string',
            'No',
            'Time period: 24h, 7d, 30d, all (default: 7d)',
          ],
        ]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "period": "7d",
  "total_volume": "5950000000000000000000000",
  "total_trades": 10500,
  "avg_trade_size": "566666666666666666666"
}`}</DocCodeBlock>

      <DocH3>Get TVL Statistics</DocH3>
      <DocEndpoint method="GET" path="/stats/tvl" />
      <DocP>Get current TVL breakdown.</DocP>
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "total_tvl": "3200000000000000000000000",
  "breakdown": [
    { "token": "WBNB", "amount": "1500000000000000000000000" },
    { "token": "USDT", "amount": "1000000000000000000000000" }
  ]
}`}</DocCodeBlock>

      <DocHr />

      {/* ── Leaderboard ── */}
      <DocH2 id="leaderboard">Leaderboard</DocH2>

      <DocH3>Get Leaderboard</DocH3>
      <DocEndpoint method="GET" path="/leaderboard" />
      <DocP>Get leaderboard of top performing grid strategies.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[
          ['chain_id', 'number', 'No', 'Chain ID (default: 97)'],
          [
            'period',
            'string',
            'No',
            'Time period: 24h, 7d, 30d, all (default: 7d)',
          ],
          ['pair', 'string', 'No', 'Filter by trading pair'],
          [
            'limit',
            'number',
            'No',
            'Number of entries (default: 10, max: 100)',
          ],
        ]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "entries": [
    {
      "rank": 1,
      "trader": "0x1234...5678",
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
}`}</DocCodeBlock>

      <DocH3>Get Trader Statistics</DocH3>
      <DocEndpoint method="GET" path="/leaderboard/trader/:address" />
      <DocP>Get statistics for a specific trader.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Description']}
        rows={[['address', 'string', 'Trader wallet address (path parameter)']]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "address": "0x1234...5678",
  "rank": 1,
  "total_profit": "12500000000000000000000",
  "total_volume": "125000000000000000000000",
  "total_trades": 234,
  "active_grids": 3,
  "best_pair": "BNB/USDT"
}`}</DocCodeBlock>

      <DocH3>Get Top Pairs</DocH3>
      <DocEndpoint method="GET" path="/leaderboard/pairs" />
      <DocP>Get top performing trading pairs.</DocP>
      <DocTable
        headers={['Parameter', 'Type', 'Required', 'Description']}
        rows={[
          ['chain_id', 'number', 'No', 'Chain ID (default: 97)'],
          [
            'period',
            'string',
            'No',
            'Time period: 24h, 7d, 30d, all (default: 7d)',
          ],
          [
            'limit',
            'number',
            'No',
            'Number of pairs (default: 5, max: 20)',
          ],
        ]}
      />
      <DocP>
        <DocStrong>Response:</DocStrong>
      </DocP>
      <DocCodeBlock language="json">{`{
  "pairs": [
    {
      "pair": "BNB/USDT",
      "total_profit": "25000000000000000000000",
      "total_volume": "250000000000000000000000",
      "total_trades": 500,
      "active_grids": 50
    }
  ]
}`}</DocCodeBlock>

      <DocHr />

      {/* ── Error Responses ── */}
      <DocH2 id="error-responses">Error Responses</DocH2>
      <DocP>All endpoints return errors in the following format:</DocP>
      <DocCodeBlock language="json">{`{
  "error": "Error message description"
}`}</DocCodeBlock>

      <DocH3>HTTP Status Codes</DocH3>
      <DocTable
        headers={['Code', 'Description']}
        rows={[
          ['200', 'Success'],
          ['400', 'Bad Request — Invalid parameters'],
          ['404', 'Not Found — Resource not found'],
          ['429', 'Too Many Requests — Rate limit exceeded'],
          ['500', 'Internal Server Error'],
        ]}
      />

      <DocHr />

      {/* ── Rate Limiting ── */}
      <DocH2 id="rate-limiting">Rate Limiting</DocH2>
      <DocP>The API implements rate limiting to ensure fair usage:</DocP>
      <DocUl>
        <DocLi>
          <DocStrong>Default limit:</DocStrong> 100 requests per minute per IP
        </DocLi>
        <DocLi>
          <DocStrong>Rate limit headers:</DocStrong>{' '}
          <DocCode>X-RateLimit-Limit</DocCode>,{' '}
          <DocCode>X-RateLimit-Remaining</DocCode>,{' '}
          <DocCode>X-RateLimit-Reset</DocCode>
        </DocLi>
      </DocUl>

      <DocH3>Internationalization</DocH3>
      <DocP>
        The API supports multiple languages. Set the{' '}
        <DocCode>Accept-Language</DocCode> header to receive localized error
        messages:
      </DocP>
      <DocTable
        headers={['Code', 'Language']}
        rows={[
          ['en', 'English (default)'],
          ['zh', 'Chinese'],
          ['ja', 'Japanese'],
          ['ko', 'Korean'],
          ['es', 'Spanish'],
          ['ru', 'Russian'],
          ['pt', 'Portuguese'],
          ['fr', 'French'],
          ['de', 'German'],
        ]}
      />

      <DocH3>OpenAPI / Swagger</DocH3>
      <DocP>Interactive API documentation is available at:</DocP>
      <DocUl>
        <DocLi>
          <DocStrong>Swagger UI:</DocStrong>{' '}
          <DocCode>http://localhost:3001/docs</DocCode>
        </DocLi>
        <DocLi>
          <DocStrong>OpenAPI JSON:</DocStrong>{' '}
          <DocCode>http://localhost:3001/docs/json</DocCode>
        </DocLi>
      </DocUl>

      <DocBlockquote>
        For production Swagger docs, replace <DocCode>localhost:3001</DocCode>{' '}
        with <DocCode>api.gridex.io</DocCode>.
      </DocBlockquote>

      <DocsPageNav />
    </div>
  );
}
