# GridEx - Decentralized Grid Trading Protocol

GridEx is a decentralized grid trading protocol that allows traders to automate their trading strategies on-chain. Profit from market volatility with automated grid trading.

## Features

- 🔄 **Automated Grid Trading** - Set up grid orders once and let the protocol handle the rest
- 🔐 **Fully Decentralized** - All orders are executed on-chain with no centralized intermediaries
- 📈 **Profit from Volatility** - Grid trading captures profits from market fluctuations automatically
- 🛡️ **Secure & Audited** - Smart contracts are thoroughly audited for maximum security
- 🌐 **Multi-Chain Support** - Available on Ethereum, BNB Chain, Base, and testnets
- 🌍 **Multi-Language** - Supports 9 languages (EN, ZH, JA, KO, ES, RU, PT, FR, DE)

## Contract Addresses

| Contract | Address |
|----------|---------|
| GridExRouter | `0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9` |
| Vault | `0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8` |
| Linear | `0xFce4A9fE4764101259E154C7E4Ebce90763A9085` |
| Geometry | `0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f` |

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

GridEx: `0x4F805a66448F53Fb6bFa5A7E29dBaE36c158aacF`

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
