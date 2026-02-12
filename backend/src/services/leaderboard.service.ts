import { eq, and, desc, sql } from 'drizzle-orm';
import { db, leaderboard } from '../db/index.js';
import type {
  LeaderboardEntry,
  LeaderboardResponse,
  TraderStats,
  TopPair,
} from '../schemas/leaderboard.js';

export interface GetLeaderboardParams {
  chainId: number;
  period: string;
  pair?: string;
  limit: number;
}

export async function getLeaderboard(params: GetLeaderboardParams): Promise<LeaderboardResponse> {
  const { chainId, period, pair, limit } = params;

  // Build where conditions
  const conditions = [
    eq(leaderboard.chainId, chainId),
    eq(leaderboard.period, period),
  ];
  
  if (pair) {
    conditions.push(eq(leaderboard.pair, pair));
  }

  const results = await db
    .select()
    .from(leaderboard)
    .where(and(...conditions))
    .orderBy(leaderboard.rank)
    .limit(limit);

  const entries: LeaderboardEntry[] = results.map((e) => ({
    rank: e.rank,
    trader: e.trader,
    pair: e.pair,
    grid_id: e.gridId,
    profit: e.profit,
    profit_rate: e.profitRate,
    volume: e.volume,
    trades: e.trades,
  }));

  return {
    entries,
    total: entries.length,
    period,
  };
}

export async function getTraderStats(chainId: number, address: string): Promise<TraderStats> {
  const results = await db
    .select()
    .from(leaderboard)
    .where(and(
      eq(leaderboard.chainId, chainId),
      eq(leaderboard.trader, address.toLowerCase()),
      eq(leaderboard.period, '7d')
    ))
    .orderBy(leaderboard.rank)
    .limit(1);

  if (results.length === 0) {
    return {
      address,
      rank: null,
      total_profit: '0',
      total_volume: '0',
      total_trades: 0,
      active_grids: 0,
      best_pair: null,
    };
  }

  const e = results[0];

  // Count active grids for this trader
  const gridCount = await db
    .select({ count: sql<number>`count(distinct ${leaderboard.gridId})` })
    .from(leaderboard)
    .where(and(
      eq(leaderboard.chainId, chainId),
      eq(leaderboard.trader, address.toLowerCase())
    ));

  return {
    address,
    rank: e.rank,
    total_profit: e.profit,
    total_volume: e.volume,
    total_trades: e.trades,
    active_grids: Number(gridCount[0]?.count || 0),
    best_pair: e.pair,
  };
}

export interface GetTopPairsParams {
  chainId: number;
  period: string;
  limit: number;
}

export async function getTopPairs(params: GetTopPairsParams): Promise<{ pairs: TopPair[] }> {
  const { chainId, period, limit } = params;

  // Aggregate by pair
  const results = await db
    .select({
      pair: leaderboard.pair,
      totalProfit: sql<string>`sum(${leaderboard.profit}::numeric)::text`,
      totalVolume: sql<string>`sum(${leaderboard.volume}::numeric)::text`,
      totalTrades: sql<number>`sum(${leaderboard.trades})`,
      activeGrids: sql<number>`count(distinct ${leaderboard.gridId})`,
    })
    .from(leaderboard)
    .where(and(
      eq(leaderboard.chainId, chainId),
      eq(leaderboard.period, period)
    ))
    .groupBy(leaderboard.pair)
    .orderBy(desc(sql`sum(${leaderboard.profit}::numeric)`))
    .limit(limit);

  const pairs: TopPair[] = results.map((r) => ({
    pair: r.pair,
    total_profit: r.totalProfit || '0',
    total_volume: r.totalVolume || '0',
    total_trades: Number(r.totalTrades) || 0,
    active_grids: Number(r.activeGrids) || 0,
  }));

  return { pairs };
}
