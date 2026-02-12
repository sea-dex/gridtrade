import { db, grids, orders, pairs, protocolStats, leaderboard, tokens, queryClient } from './index.js';
import { seedLogger as log } from '../utils/logger.js';
import { getSupportedChainIds } from '../config/chains.js';
import { getTokensByChain } from '../config/tokens.js';

async function seed(): Promise<void> {
  log.info('Seeding database…');

  // Seed tokens
  for (const chainId of getSupportedChainIds()) {
    const tokenList = getTokensByChain(chainId);

    for (const t of tokenList) {
      await db
        .insert(tokens)
        .values({
          chainId,
          address: t.address,
          symbol: t.symbol,
          name: t.name,
          decimals: t.decimals,
          logo: t.logo,
          totalSupply: t.totalSupply,
          priority: t.priority,
          isQuote: t.isQuote,
          tags: t.tags,
        })
        .onConflictDoNothing({ target: [tokens.chainId, tokens.address] });
    }
  }

  // Seed pairs
  const pairsData = [
    {
      pairId: 1,
      chainId: 97,
      baseToken: 'WBNB',
      baseTokenAddress: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      quoteToken: 'USDT',
      quoteTokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      volume24h: '1500000000000000000000000',
      trades24h: 1234,
      activeGrids: 456,
    },
    {
      pairId: 2,
      chainId: 97,
      baseToken: 'ETH',
      baseTokenAddress: '0x8BaBbB98678facC7342735486C851ABD7A0d17Ca',
      quoteToken: 'USDT',
      quoteTokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      volume24h: '980000000000000000000000',
      trades24h: 876,
      activeGrids: 234,
    },
    {
      pairId: 3,
      chainId: 97,
      baseToken: 'BTCB',
      baseTokenAddress: '0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8',
      quoteToken: 'USDT',
      quoteTokenAddress: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
      volume24h: '2100000000000000000000000',
      trades24h: 1567,
      activeGrids: 567,
    },
  ];

  for (const pair of pairsData) {
    await db.insert(pairs).values(pair).onConflictDoNothing();
  }

  // Seed grids
  const gridsData = [
    {
      gridId: 1,
      chainId: 97,
      owner: '0x1234567890abcdef1234567890abcdef12345678',
      pairId: 1,
      baseToken: 'WBNB',
      quoteToken: 'USDT',
      askOrderCount: 5,
      bidOrderCount: 5,
      initialBaseAmount: '10000000000000000000',
      initialQuoteAmount: '0',
      profits: '500000000000000000',
      fee: 3000,
      compound: true,
      oneshot: false,
      status: 1,
    },
    {
      gridId: 2,
      chainId: 97,
      owner: '0xabcdef1234567890abcdef1234567890abcdef12',
      pairId: 2,
      baseToken: 'ETH',
      quoteToken: 'USDT',
      askOrderCount: 10,
      bidOrderCount: 10,
      initialBaseAmount: '5000000000000000000',
      initialQuoteAmount: '0',
      profits: '250000000000000000',
      fee: 2500,
      compound: false,
      oneshot: false,
      status: 1,
    },
  ];

  for (const grid of gridsData) {
    await db.insert(grids).values(grid).onConflictDoNothing();
  }

  // Seed orders
  const ordersData = [
    {
      orderId: '1',
      chainId: 97,
      gridId: 1,
      pairId: 1,
      isAsk: true,
      compound: true,
      oneshot: false,
      fee: 3000,
      status: 0,
      amount: '1000000000000000000',
      revAmount: '0',
      initialBaseAmount: '1000000000000000000',
      initialQuoteAmount: '0',
      price: '100000000000000000000',
      revPrice: '95000000000000000000',
    },
  ];

  for (const order of ordersData) {
    await db.insert(orders).values(order).onConflictDoNothing();
  }

  // Seed protocol stats
  const today = new Date().toISOString().split('T')[0];
  await db.insert(protocolStats).values({
    chainId: 97,
    date: today,
    totalVolume: '12500000000000000000000000',
    totalTvl: '3200000000000000000000000',
    totalGrids: 1234,
    totalTrades: 45678,
    totalProfit: '890000000000000000000000',
    activeUsers: 5678,
  }).onConflictDoNothing();

  // Seed leaderboard
  const leaderboardData = [
    {
      chainId: 97,
      trader: '0x1234567890abcdef1234567890abcdef12345678',
      pair: 'BNB/USDT',
      gridId: 1,
      profit: '12500000000000000000000',
      profitRate: 45.2,
      volume: '125000000000000000000000',
      trades: 234,
      period: '7d',
      rank: 1,
    },
    {
      chainId: 97,
      trader: '0xabcdef1234567890abcdef1234567890abcdef12',
      pair: 'ETH/USDT',
      gridId: 2,
      profit: '8900000000000000000000',
      profitRate: 38.7,
      volume: '98000000000000000000000',
      trades: 189,
      period: '7d',
      rank: 2,
    },
    {
      chainId: 97,
      trader: '0x9876543210fedcba9876543210fedcba98765432',
      pair: 'BTC/USDT',
      gridId: 3,
      profit: '7500000000000000000000',
      profitRate: 32.1,
      volume: '85000000000000000000000',
      trades: 156,
      period: '7d',
      rank: 3,
    },
  ];

  for (const entry of leaderboardData) {
    await db.insert(leaderboard).values(entry).onConflictDoNothing();
  }

  log.info('Database seeded successfully');

  // Close the connection
  await queryClient.end();
}

seed().catch((err) => {
  log.error({ err }, 'Seed failed');
  process.exit(1);
});
