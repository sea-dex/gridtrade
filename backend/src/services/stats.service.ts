import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { db, protocolStats, pairs } from '../db/index.js';
import type {
  StatsResponse,
  PairStatsResponse,
  VolumeStatsResponse,
  TVLStatsResponse,
  PairStats,
} from '../schemas/stats.js';

export async function getProtocolStats(chainId: number): Promise<StatsResponse> {
  // Get latest protocol stats
  const latestStats = await db
    .select()
    .from(protocolStats)
    .where(eq(protocolStats.chainId, chainId))
    .orderBy(desc(protocolStats.date))
    .limit(1);

  // Get volume history (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const volumeHistory = await db
    .select({
      date: protocolStats.date,
      volume: protocolStats.totalVolume,
    })
    .from(protocolStats)
    .where(and(eq(protocolStats.chainId, chainId), gte(protocolStats.date, thirtyDaysAgoStr)))
    .orderBy(protocolStats.date);

  const tvlHistory = await db
    .select({
      date: protocolStats.date,
      tvl: protocolStats.totalTvl,
    })
    .from(protocolStats)
    .where(and(eq(protocolStats.chainId, chainId), gte(protocolStats.date, thirtyDaysAgoStr)))
    .orderBy(protocolStats.date);

  const stats = latestStats[0] || {
    totalVolume: '0',
    totalTvl: '0',
    totalGrids: 0,
    totalTrades: 0,
    totalProfit: '0',
    activeUsers: 0,
  };

  return {
    protocol: {
      total_volume: stats.totalVolume,
      total_tvl: stats.totalTvl,
      total_grids: stats.totalGrids,
      total_trades: stats.totalTrades,
      total_profit: stats.totalProfit,
      active_users: stats.activeUsers,
    },
    volume_history: volumeHistory.map((v) => ({
      date: v.date,
      volume: v.volume,
    })),
    tvl_history: tvlHistory.map((t) => ({
      date: t.date,
      tvl: t.tvl,
    })),
  };
}

export async function getPairStats(chainId: number): Promise<PairStatsResponse> {
  const results = await db
    .select()
    .from(pairs)
    .where(eq(pairs.chainId, chainId))
    .orderBy(desc(pairs.volume24h));

  const pairStats: PairStats[] = results.map((p) => ({
    pair_id: p.pairId,
    base_token: p.baseToken,
    quote_token: p.quoteToken,
    volume_24h: p.volume24h,
    trades_24h: p.trades24h,
    active_grids: p.activeGrids,
  }));

  return { pairs: pairStats };
}

export async function getVolumeStats(chainId: number, period: string): Promise<VolumeStatsResponse> {
  const periods: Record<string, number> = {
    '24h': 1,
    '7d': 7,
    '30d': 30,
    all: 365,
  };

  const days = periods[period] || 1;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const results = await db
    .select({
      totalVolume: sql<string>`sum(${protocolStats.totalVolume}::numeric)::text`,
      totalTrades: sql<number>`sum(${protocolStats.totalTrades})`,
    })
    .from(protocolStats)
    .where(and(eq(protocolStats.chainId, chainId), gte(protocolStats.date, startDateStr)));

  const stats = results[0] || { totalVolume: '0', totalTrades: 0 };
  const totalTrades = Number(stats.totalTrades) || 0;
  const totalVolume = stats.totalVolume || '0';

  // Calculate average trade size
  const avgTradeSize = totalTrades > 0 
    ? (BigInt(totalVolume) / BigInt(totalTrades)).toString()
    : '0';

  return {
    period,
    total_volume: totalVolume,
    total_trades: totalTrades,
    avg_trade_size: avgTradeSize,
  };
}

export async function getTvlStats(chainId: number): Promise<TVLStatsResponse> {
  // Get latest TVL
  const latestStats = await db
    .select({
      totalTvl: protocolStats.totalTvl,
    })
    .from(protocolStats)
    .where(eq(protocolStats.chainId, chainId))
    .orderBy(desc(protocolStats.date))
    .limit(1);

  const totalTvl = latestStats[0]?.totalTvl || '0';

  // Get TVL breakdown by token (simplified - in production, this would be a separate table)
  const pairResults = await db
    .select({
      baseToken: pairs.baseToken,
      quoteToken: pairs.quoteToken,
    })
    .from(pairs)
    .where(eq(pairs.chainId, chainId));

  // Create a simplified breakdown
  const tokenSet = new Set<string>();
  pairResults.forEach((p) => {
    tokenSet.add(p.baseToken);
    tokenSet.add(p.quoteToken);
  });

  const tokens = Array.from(tokenSet);
  const perTokenAmount = tokens.length > 0 
    ? (BigInt(totalTvl) / BigInt(tokens.length)).toString()
    : '0';

  const breakdown = tokens.map((token) => ({
    token,
    amount: perTokenAmount,
  }));

  return {
    total_tvl: totalTvl,
    breakdown,
  };
}
