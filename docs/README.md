# GridEx Documentation

Welcome to the GridEx documentation. This documentation covers the GridEx decentralized grid trading protocol.

## Contents

- [API Documentation](./API.md) - Complete API reference for the GridEx backend
- [User Guide](./USER_GUIDE.md) - Guide for using the GridEx web application

## Quick Links

### For Developers

- **Backend API**: Built with Fastify, TypeScript, Drizzle ORM, and PostgreSQL
- **Frontend**: Built with Next.js 16, React 19, and TailwindCSS 4
- **Smart Contracts**: Solidity contracts in the `gridex/` directory

### Getting Started

1. **Backend Setup**
   ```bash
   cd backend
   pnpm install
   cp .env.example .env
   pnpm db:push
   pnpm dev
   ```

2. **Frontend Setup**
   ```bash
   cd webapp
   pnpm install
   pnpm dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - API Docs: http://localhost:3001/docs

## Architecture

```
gridtrade/
├── backend/          # TypeScript Fastify backend
│   ├── src/
│   │   ├── config/   # Configuration
│   │   ├── db/       # Database (Drizzle ORM)
│   │   ├── i18n/     # Internationalization
│   │   ├── routes/   # API routes
│   │   ├── schemas/  # Zod validation schemas
│   │   └── services/ # Business logic
│   └── drizzle/      # Database migrations
├── webapp/           # Next.js frontend
│   └── src/
│       ├── app/      # Next.js app router
│       ├── components/
│       ├── config/
│       ├── hooks/
│       └── i18n/
├── gridex/           # Solidity smart contracts
│   ├── src/
│   └── test/
└── docs/             # Documentation
```

## Supported Chains

| Chain | Chain ID | Status |
|-------|----------|--------|
| Ethereum | 1 | Supported |
| BNB Smart Chain | 56 | Supported |
| Base | 8453 | Supported |
| BNB Testnet | 97 | Supported (Default) |

## Contract Addresses

| Contract | Address |
|----------|---------|
| Vault | `0x5a93dbc8BfB3cA53cD1A3aAfdcc84aFBF5276CC8` |
| Timelock | `0x2cD09B3FD55c89e4096D588e821BA011cd9C142A` |
| AdminFacet | `0xEC5b5122C717191a3785508cDD8E3D23c217AE2A` |
| TradeFacet | `0x9D605177908D9ba6CAC6F817E7AB007C1A3Ced48` |
| CancelFacet | `0x00065F12989ae6F0A8B402B5060A98f0C2ED6157` |
| ViewFacet | `0x30C141dD5C64d7F21b7aE22f9803e209368E4899` |
| Router | `0xa0F2a4b56fbA7F98332D39fB18f4073bB2b78dd9` |
| Linear | `0xFce4A9fE4764101259E154C7E4Ebce90763A9085` |
| Geometry | `0x75320716bF2Bbfb27F2e0F1cC3b2dDc7a9Da626f` |

## Languages

The application supports the following languages:

- English (en)
- Chinese (zh)
- Japanese (ja)
- Korean (ko)
- Spanish (es)
- Russian (ru)
- Portuguese (pt)
- French (fr)
- German (de)
