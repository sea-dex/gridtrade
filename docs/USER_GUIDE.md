# GridEx User Guide

## Introduction

Welcome to GridEx, the decentralized grid trading protocol! This guide will help you understand how to use GridEx to automate your trading strategies and profit from market volatility.

## Table of Contents

1. [What is Grid Trading?](#what-is-grid-trading)
2. [Getting Started](#getting-started)
3. [Connecting Your Wallet](#connecting-your-wallet)
4. [Creating a Grid Order](#creating-a-grid-order)
5. [Managing Your Grids](#managing-your-grids)
6. [Limit Orders](#limit-orders)
7. [Understanding Fees](#understanding-fees)
8. [FAQ](#faq)

---

## What is Grid Trading?

Grid trading is a quantitative trading strategy that profits from market volatility by placing multiple buy and sell orders at predetermined price levels within a defined range.

### How It Works

1. **Define a Price Range**: Set the upper and lower price boundaries for your grid
2. **Create Grid Levels**: The range is divided into multiple levels (grids)
3. **Place Orders**: Buy orders are placed below the current price, sell orders above
4. **Automatic Execution**: When price moves:
   - If price goes up → sell orders execute, taking profit
   - If price goes down → buy orders execute, accumulating assets
5. **Continuous Profit**: As price oscillates, the grid continuously captures profits

### Best Market Conditions

Grid trading works best in:
- **Ranging markets**: When prices move sideways within a range
- **Volatile markets**: More price movement = more trading opportunities
- **Liquid markets**: Ensures orders can be filled efficiently

---

## Getting Started

### Prerequisites

1. **Web3 Wallet**: MetaMask, WalletConnect, or any compatible wallet
2. **Tokens**: The base and quote tokens you want to trade
3. **Gas Fees**: Native tokens (ETH, BNB) for transaction fees

### Supported Networks

| Network | Native Token | Status |
|---------|--------------|--------|
| Ethereum | ETH | ✅ Active |
| BNB Chain | BNB | ✅ Active |
| Base | ETH | ✅ Active |
| BSC Testnet | tBNB | ✅ Active (Testing) |

---

## Connecting Your Wallet

1. Click the **"Connect Wallet"** button in the top right corner
2. Select your preferred wallet provider
3. Approve the connection request in your wallet
4. Ensure you're on the correct network

### Switching Networks

If you're on the wrong network:
1. Click the network indicator next to your wallet address
2. Select the desired network
3. Approve the network switch in your wallet

---

## Creating a Grid Order

### Step 1: Select Trading Pair

1. Navigate to the **Grid Trading** page
2. Click on the token selectors to choose your trading pair
3. The chart will update to show the selected pair

### Step 2: Set Price Range

| Parameter | Description |
|-----------|-------------|
| Lower Price | The minimum price for your grid |
| Upper Price | The maximum price for your grid |

**Tips:**
- Set the range based on historical price movements
- A wider range captures more volatility but requires more capital
- A narrower range is more capital-efficient but may miss large moves

### Step 3: Configure Grid Parameters

| Parameter | Description | Recommendation |
|-----------|-------------|----------------|
| Ask Orders | Number of sell orders | 5-20 for most cases |
| Bid Orders | Number of buy orders | 5-20 for most cases |
| Amount Per Grid | Base token amount per order | Based on your capital |
| Fee | Trading fee in basis points | 30 bps (0.3%) default |

### Step 4: Enable Compound (Optional)

When **Compound** is enabled:
- Profits are automatically reinvested into the grid
- Grid orders grow larger over time
- Maximizes compounding returns

When **Compound** is disabled:
- Profits accumulate separately
- Can be withdrawn at any time
- More control over your earnings

### Step 5: Review and Confirm

1. Review the **Total Investment** required
2. Click **"Place Grid Order"**
3. Approve token spending (if first time)
4. Confirm the transaction in your wallet
5. Wait for transaction confirmation

---

## Managing Your Grids

### Viewing Your Grids

Your active grids are displayed in the **"My Orders"** section below the chart.

| Column | Description |
|--------|-------------|
| Grid ID | Unique identifier for your grid |
| Pair | Trading pair (e.g., BNB/USDT) |
| Orders | Number of ask/bid orders |
| Profit | Accumulated profits |
| Status | Active or Cancelled |

### Withdrawing Profits

1. Find your grid in the order list
2. Click the **"Withdraw"** button
3. Enter the amount to withdraw (or leave empty for all)
4. Confirm the transaction

### Cancelling a Grid

1. Find your grid in the order list
2. Click the **"Cancel"** button
3. Confirm the cancellation
4. All remaining tokens will be returned to your wallet

**Note:** Cancelling a grid is irreversible. Make sure to withdraw any profits first.

---

## Limit Orders

Limit orders in GridEx are implemented as one-shot grid orders with a single order.

### Creating a Limit Order

1. Navigate to the **Limit Order** page
2. Select **Buy** or **Sell**
3. Enter the **Price** at which you want to trade
4. Enter the **Amount** of base token
5. Click **"Place Order"**

### Key Differences from Grid Orders

| Feature | Grid Order | Limit Order |
|---------|------------|-------------|
| Order Count | Multiple | Single |
| Reversible | Yes (orders flip) | No (one-shot) |
| Compound | Optional | N/A |
| Use Case | Range trading | Specific price entry/exit |

---

## Understanding Fees

### Fee Structure

| Fee Type | Description | Rate |
|----------|-------------|------|
| Trading Fee | Charged on each fill | 0.1% - 1% (configurable) |
| Protocol Fee | Goes to protocol treasury | 0.05% |
| Gas Fee | Network transaction cost | Variable |

### Fee Calculation Example

For a trade of 1 BNB at 300 USDT with 0.3% fee:
- Trade Value: 300 USDT
- Trading Fee: 0.9 USDT (0.3%)
- Protocol Fee: 0.15 USDT (0.05%)
- Total Fee: 1.05 USDT

---

## FAQ

### General Questions

**Q: Is GridEx safe to use?**
A: GridEx smart contracts are audited and open-source. However, all DeFi protocols carry inherent risks. Only invest what you can afford to lose.

**Q: What happens if the price moves outside my grid range?**
A: If price moves above your range, all your base tokens will be sold. If price moves below, you'll accumulate base tokens. The grid will resume trading when price returns to the range.

**Q: Can I modify a grid after creating it?**
A: You can modify the fee rate, but other parameters are fixed. To change the price range or order count, you need to cancel and create a new grid.

### Technical Questions

**Q: How are prices calculated?**
A: Prices are stored as fixed-point numbers with 18 decimals. The protocol uses a linear strategy to calculate order prices based on your specified range.

**Q: What is the minimum grid size?**
A: There's no strict minimum, but very small grids may not be economical due to gas costs.

**Q: How often are orders filled?**
A: Orders are filled by takers (other traders) when they find profitable opportunities. More liquid pairs typically have faster fills.

### Troubleshooting

**Q: My transaction failed. What should I do?**
A: Common causes:
1. Insufficient gas - increase gas limit
2. Slippage too low - increase slippage tolerance
3. Token approval needed - approve tokens first
4. Insufficient balance - check your wallet balance

**Q: I can't see my grid orders.**
A: Make sure you're:
1. Connected with the correct wallet
2. On the correct network
3. Viewing the correct trading pair

**Q: How do I get testnet tokens?**
A: For BSC Testnet:
1. Visit the BNB Chain Faucet
2. Enter your wallet address
3. Request test BNB

---

## Support

Need help? Reach out to us:

- **Discord**: [Join our community](https://discord.gg/gridex)
- **Twitter**: [@gridex_protocol](https://twitter.com/gridex_protocol)
- **Email**: support@gridex.io
- **Documentation**: [docs.gridex.io](https://docs.gridex.io)

---

## Glossary

| Term | Definition |
|------|------------|
| **Ask Order** | A sell order placed above the current price |
| **Bid Order** | A buy order placed below the current price |
| **Base Token** | The token being traded (e.g., BNB in BNB/USDT) |
| **Quote Token** | The token used for pricing (e.g., USDT in BNB/USDT) |
| **Grid** | A set of orders at different price levels |
| **Compound** | Reinvesting profits back into the grid |
| **One-shot** | An order that doesn't reverse after filling |
| **TVL** | Total Value Locked - assets deposited in the protocol |
| **Slippage** | Price difference between expected and executed price |
