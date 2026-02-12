# GridEx - Decentralized Grid Trading Protocol

GridEx is a decentralized grid trading protocol that allows traders to automate their trading strategies on-chain. Profit from market volatility with automated grid trading.

## Features

- 🔄 **Automated Grid Trading** - Set up grid orders once and let the protocol handle the rest
- 🔐 **Fully Decentralized** - All orders are executed on-chain with no centralized intermediaries
- 📈 **Profit from Volatility** - Grid trading captures profits from market fluctuations automatically
- 🛡️ **Secure & Audited** - Smart contracts are thoroughly audited for maximum security
- 🌐 **Multi-Chain Support** - Available on Ethereum, BNB Chain, Base, and testnets
- 🌍 **Multi-Language** - Supports 9 languages (EN, ZH, JA, KO, ES, RU, PT, FR, DE)

## Project Structure

```
gridtrade/
├── indexer/         # Indexer (Golang)
├── webapp/          # Frontend application (Next.js)
├── backend/         # Backend API (FastAPI)
└── docs/            # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Foundry (for smart contracts)

### Frontend (webapp)

```bash
cd webapp
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend (API)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

API will be available at [http://localhost:8000](http://localhost:8000).

### Indexer

```bash
cd indexer
make all
```

## Supported Networks

| Network | Chain ID | Status |
|---------|----------|--------|
| Ethereum | 1 | ✅ Active |
| BNB Chain | 56 | ✅ Active |
| Base | 8453 | ✅ Active |
| BSC Testnet | 97 | ✅ Active |

## Contract Addresses

GridEx: `0x5F7943e9424eF9370392570D06fFA630a5124e9A`

## Documentation

- [User Guide](./docs/USER_GUIDE.md) - How to use GridEx
- [API Documentation](./docs/API.md) - REST API reference
- [Indexer Docs](./indexer/README.md) - Contract documentation

## Tech Stack

### Frontend
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- wagmi + viem
- RainbowKit
- TradingView Charts

### Backend
- FastAPI
- Python 3.11+
- PostgreSQL
- Redis

### Indexer
- Golang 1.25
- Postgres
- Kafka

## Development

### Environment Variables

Copy the example environment files:

```bash
# Frontend
cp webapp/.env.example webapp/.env.local

# Backend
cp backend/.env.example backend/.env
```

### Running Tests

```bash
# Indexer
cd indexer && make test

# Frontend
cd webapp && npm test

# Backend
cd backend && pytest
```

## Contributing

We welcome contributions! Please see our contributing guidelines for details.

## Security

For security concerns, please email security@gridex.io or see our [Security Policy](./SECURITY.md).

## License

This project is licensed under the BUSL-1.1 License - see the [LICENSE](./LICENSE) file for details.

## Links

- Website: https://gridtrade.xyz
- App: https://app.gridtrade.xyz
- Discord: https://discord.gg/gridex
- Twitter: https://twitter.com/sea_protocol
- GitHub: https://github.com/sea-dex
