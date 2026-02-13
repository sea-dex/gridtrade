# GridTrade — Decentralized Grid Trading Protocol

## 🏷️ One-Liner

GridTrade is an AI-powered, fully on-chain grid trading protocol that enables traders to automate buy-low-sell-high strategies across EVM chains, capturing profits from market volatility without centralized intermediaries.

---

## 📖 Project Description

### The Problem

Grid trading is one of the most popular quantitative strategies in crypto — it profits from sideways and volatile markets by placing layered buy and sell orders across a price range. However, today's grid trading is **exclusively available on centralized exchanges (CEXs)**, which means:

- **Custodial risk** — users must deposit funds into the exchange
- **Opaque execution** — no guarantee orders are filled fairly
- **No composability** — grid strategies can't interact with DeFi protocols
- **Censorship risk** — accounts can be frozen or restricted by geography

There is no production-grade, fully decentralized grid trading solution on any EVM chain today.

### The Solution

**GridTrade** brings grid trading fully on-chain with **AI-powered strategy generation**. Every grid order, every fill, and every profit withdrawal is executed transparently through smart contracts. Users retain full custody of their assets at all times.

#### How It Works

1. **AI Strategy Generation** — Describe your trading intent in natural language (e.g., "I want to grid trade ETH/USDT in a volatile market with moderate risk"); the AI agent analyzes real-time market data, volatility, and on-chain liquidity to recommend optimal grid parameters
2. **Define a Price Range** — Set upper and lower price boundaries (or accept AI-recommended range)
3. **Configure Grid Parameters** — Choose the number of ask (sell) and bid (buy) orders, amount per grid, and fee tier (or use AI-optimized defaults)
4. **Deploy On-Chain** — A single transaction creates all grid orders in the smart contract
5. **Automatic Execution** — As market price oscillates, orders are filled by takers (arbitrageurs, DEX aggregators), generating profit for the grid maker
6. **Compound or Withdraw** — Optionally reinvest profits automatically, or withdraw at any time

### Key Differentiators

| Feature | CEX Grid Bots | GridTrade |
|---------|--------------|--------|
| Custody | Exchange holds funds | Self-custody (your wallet) |
| Execution | Off-chain, opaque | On-chain, verifiable |
| Composability | None | DeFi-native |
| Permissionless | KYC required | No KYC, open to all |
| Multi-chain | Single exchange | Ethereum, BNB Chain, Base |
| Transparency | Closed source | Open source, auditable |

### GridTrade vs. Uniswap V3: Higher Yields, Lower Impermanent Loss

Uniswap V3's concentrated liquidity model is often compared to grid trading — both place capital within a price range. However, GridTrade's grid order design offers **structurally superior economics** for liquidity providers:

#### 📈 Higher Yield

| Dimension | Uniswap V3 LP | GridTrade Grid Maker |
|-----------|--------------|---------------------|
| **Profit mechanism** | Earns swap fees only (passive) | Earns the **spread between buy and sell prices** at each grid level (active market-making) |
| **Fee capture** | Shared proportionally among all LPs in the same tick range | Each grid order captures the **full bid-ask spread** — no fee dilution from competing LPs |
| **Compound effect** | Must manually collect and re-deposit fees | Built-in **compound mode** auto-reinvests profits into the grid, compounding returns continuously |
| **Profit per oscillation** | One swap fee per price crossing | Each price oscillation triggers **both a buy fill and a sell fill**, capturing profit on the round trip |
| **Capital efficiency** | High, but passive — no directional profit | High **and** active — profits from every price reversal within the range |

> **Example**: In a ranging market where ETH/USDT oscillates between $3,000–$3,500, a Uniswap V3 LP earns ~0.05% per swap in fees. A GridTrade maker with 10 grid levels earns the **full $50 spread per grid** on every round-trip oscillation — potentially 10–50× more yield in volatile, ranging conditions.

#### 🛡️ Lower Impermanent Loss

| Dimension | Uniswap V3 LP | GridTrade Grid Maker |
|-----------|--------------|---------------------|
| **IL exposure** | Continuous — IL accrues with every price movement away from entry | **Discrete** — IL only materializes on unfilled grid levels; filled levels have already locked in profit |
| **Directional risk** | Full exposure to price moving out of range (100% single-asset) | Grid orders **take profit at each level** — realized gains offset unrealized IL on remaining orders |
| **Range exit** | If price exits range, LP earns zero fees while holding 100% of the depreciating asset | Grid maker has already **sold incrementally on the way up** (or bought on the way down), reducing exposure |
| **Recovery** | Must wait for price to return to range to earn fees again | Grid continues to **accumulate the cheaper asset** on the way down, lowering average cost — profits resume immediately when price reverses |
| **Net P&L in volatile markets** | Often negative after IL | **Positive** — grid profits from each oscillation typically exceed any residual IL |

> **Why this matters**: Uniswap V3 LPs frequently suffer net losses because impermanent loss exceeds fee income — studies show [over 50% of Uniswap V3 positions lose money](https://arxiv.org/abs/2111.09192). GridTrade's grid model **locks in profit at each price level**, so the realized gains from completed round-trips structurally offset the unrealized loss on open positions.

#### 🔑 The Core Insight

Uniswap V3 is a **passive** liquidity provision model — you deposit and hope fees exceed IL. GridTrade is an **active** market-making model — every grid level is a deliberate buy-low-sell-high trade. The grid maker is not providing liquidity as a service; they are **executing a trading strategy** that profits from volatility. This fundamental difference means:

- **In ranging markets**: GridTrade yields are multiples higher than Uni V3 LP fees
- **In trending markets**: GridTrade's incremental profit-taking reduces IL exposure vs. Uni V3's all-or-nothing range position
- **In all markets**: GridTrade's compound mode creates a flywheel effect that Uni V3 cannot replicate

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                  │
│  React 19 · Tailwind CSS 4 · wagmi · RainbowKit          │
│  TradingView Charts · Multi-language (9 languages)       │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│                   Smart Contracts (EVM)                  │
│  GridTrade Core · Linear Strategy · Multi-chain deployed │
│  Ethereum · BNB Chain · Base · BSC Testnet               │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│                    Indexer (Golang)                      │
│  Real-time block scanning · Event decoding               │
│  PostgreSQL persistence · Kafka event streaming          │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│                  Backend API (Fastify + TS)              │
│  RESTful API · Drizzle ORM · K-line data aggregation     │
│  Leaderboard · Protocol stats · Multi-chain support      │
└──────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Tech Stack | Purpose |
|-----------|-----------|---------|
| **Smart Contracts** | Solidity (EVM) | Core grid trading logic — order creation, filling, cancellation, profit withdrawal |
| **Indexer** | Go 1.22+, PostgreSQL, Kafka | Scans blockchain events in real-time, decodes GridTrade contract events, persists to DB |
| **Backend API** | Fastify, TypeScript, Drizzle ORM, PostgreSQL | Serves indexed data via REST API — grids, orders, fills, stats, leaderboard, K-line data |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, wagmi, RainbowKit | Trading interface with TradingView charts, wallet connection, grid order management |

---

## ✨ Features

- 🤖 **AI-Powered Strategy Generation** — Natural language input → optimized grid parameters powered by LLM agents
- 🔄 **Automated Grid Trading** — Set up grid orders once; the protocol handles execution automatically
- 🔐 **Fully Decentralized & Self-Custodial** — All orders execute on-chain; users never give up custody
- 📈 **Profit from Volatility** — Grid trading captures profits from price oscillations in ranging markets
- 💰 **Compound Mode** — Optionally auto-reinvest profits for compounding returns
- 📊 **TradingView Charts** — Professional-grade charting with real-time K-line data from Binance/OKX
- 🌐 **Multi-Chain** — Deployed on Ethereum, BNB Chain, Base, and testnets
- 🌍 **Multi-Language** — Full i18n support for 9 languages (EN, ZH, JA, KO, ES, RU, PT, FR, DE)
- 📋 **Limit Orders** — One-shot grid orders function as decentralized limit orders
- 🏆 **Leaderboard** — Track top traders by profit and volume
- ⚡ **Real-time Indexing** — Go-based indexer with Kafka streaming for instant data availability

---

## 🔧 Technical Highlights

### AI Strategy Engine
- **Natural Language Interface** — Users describe their trading goals in plain language; the AI agent interprets intent, risk tolerance, and market outlook
- **Market Data Analysis** — The AI agent fetches real-time K-line data, calculates volatility indicators (ATR, Bollinger Bands, historical range), and assesses current market regime (trending vs. ranging)
- **Parameter Optimization** — Automatically determines optimal price range, grid count, amount per grid, fee tier, and compound setting based on market conditions and user preferences
- **Risk-Aware Recommendations** — Adjusts grid density and range width based on user's risk profile (conservative / moderate / aggressive)
- **Explainable Output** — Every AI recommendation comes with a reasoning summary so users understand *why* specific parameters were chosen
- **LLM-Powered** — Built on large language model agents with tool-calling capabilities for on-chain data retrieval and technical analysis

### Smart Contract Design
- **Fixed-point arithmetic** with 10^36 price multiplier for precision
- **Linear price strategy** — evenly spaced grid levels via a dedicated strategy contract
- **Gas-efficient** — single transaction creates entire grid with multiple orders
- **Configurable fees** — 0.1% to 1% trading fee in basis points

### Indexer
- **Event-driven architecture** — handles 7 distinct contract events (PairCreated, GridOrderCreated, FilledOrder, CancelGridOrder, CancelWholeGrid, GridFeeChanged, WithdrawProfit)
- **Transactional consistency** — all DB writes within atomic transactions
- **Rate-limited RPC** — built-in rate limiting for reliable chain scanning
- **Resumable** — tracks scanning progress in `indexer_state` table

### Backend API
- **Zod validation** — type-safe request/response schemas
- **K-line aggregation** — fetches and serves candlestick data from Binance and OKX
- **Protocol analytics** — TVL, volume, trade count, active users, profit tracking

### Frontend
- **Server-side rendering** — Next.js 16 with React 19 for optimal performance
- **Wallet integration** — RainbowKit + wagmi for seamless Web3 UX
- **Responsive design** — Tailwind CSS 4 with mobile-first approach
- **Real-time updates** — live grid order status and profit tracking

---

## 🚀 Supported Networks

| Network | Chain ID | Contract Address |
|---------|----------|-----------------|
| Ethereum | 1 | `0x6fC7AB53f558788d480549C1bF0057A204cC23de` |
| BNB Chain | 56 | `0x6fC7AB53f558788d480549C1bF0057A204cC23de` |
| Base | 8453 | `0x6fC7AB53f558788d480549C1bF0057A204cC23de` |
| BSC Testnet | 97 | `0x6fC7AB53f558788d480549C1bF0057A204cC23de` |

---

## 🔗 Links

- **Live App**: https://app.gridtrade.xyz
- **Website**: https://gridtrade.xyz
- **GitHub**: https://github.com/sea-dex
- **Twitter**: https://twitter.com/sea_protocol
- **Medium**: https://medium.com/@seaprotocol

---

## 👥 Team

Built by the Sea Protocol team — experienced DeFi builders focused on bringing professional trading tools on-chain.

---

## 📜 License

BUSL-1.1 (Business Source License)
