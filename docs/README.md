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

## Contract Address

GridEx Contract: `0x5F7943e9424eF9370392570D06fFA630a5124e9A`

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
