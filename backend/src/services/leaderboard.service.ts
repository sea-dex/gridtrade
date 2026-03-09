import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db, leaderboard, grids, pairs, tokens } from '../db/index.js';
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
  sortBy: string;
  order: string;
}

export async function getLeaderboard(params: GetLeaderboardParams): Promise<LeaderboardResponse> {
  const { chainId, period, pair, limit, sortBy, order: sortOrder } = params;

  // Build where conditions
  const conditions = [
    eq(leaderboard.chainId, chainId),
    eq(leaderboard.period, period),
  ];

  if (pair) {
    conditions.push(eq(leaderboard.pair, pair));
  }

  // Map sort_by to the appropriate order expression
  const dirFn = sortOrder === 'asc' ? asc : desc;
  const sortColumnMap: Record<string, ReturnType<typeof sql>> = {
    profit: sql`${leaderboard.profit}::numeric`,
    volume: sql`${leaderboard.volume}::numeric`,
    tvl: sql`${leaderboard.tvl}::numeric`,
    profit_rate: sql`${leaderboard.profitRate}`,
    apr: sql`${leaderboard.apr}`,
    real_apy: sql`coalesce(nullif(${grids.aprReal}, '')::numeric, 0)`,
    grid_apy: sql`coalesce(nullif(${grids.aprReal}, '')::numeric, 0) - coalesce(nullif(${grids.aprTheoretical}, '')::numeric, 0)`,
    trades: sql`${leaderboard.trades}`,
  };
  const sortExpr = sortColumnMap[sortBy] ?? sql`${leaderboard.profit}::numeric`;

  const results = await db
    .select({
      rank: leaderboard.rank,
      trader: leaderboard.trader,
      pair: leaderboard.pair,
      gridId: leaderboard.gridId,
      quoteDecimals: tokens.decimals,
      profit: leaderboard.profit,
      profitRate: leaderboard.profitRate,
      volume: leaderboard.volume,
      trades: leaderboard.trades,
      tvl: leaderboard.tvl,
      apr: leaderboard.apr,
      aprReal: sql<string>`coalesce(nullif(${grids.aprReal}, ''), '0')`,
      gridApy: sql<string>`(
        coalesce(nullif(${grids.aprReal}, '')::numeric, 0) - coalesce(nullif(${grids.aprTheoretical}, '')::numeric, 0)
      )::text`,
    })
    .from(leaderboard)
    .leftJoin(
      grids,
      and(eq(leaderboard.chainId, grids.chainId), eq(leaderboard.gridId, grids.gridId))
    )
    .leftJoin(
      pairs,
      and(eq(grids.chainId, pairs.chainId), eq(grids.pairId, pairs.pairId))
    )
    .leftJoin(
      tokens,
      and(eq(pairs.chainId, tokens.chainId), eq(pairs.quoteTokenAddress, tokens.address))
    )
    .where(and(...conditions))
    .orderBy(dirFn(sortExpr))
    .limit(limit);

  const entries: LeaderboardEntry[] = results.map((e) => ({
    rank: e.rank,
    trader: e.trader,
    pair: e.pair,
    grid_id: e.gridId,
    quote_decimals: e.quoteDecimals ?? undefined,
    profit: e.profit,
    profit_rate: e.profitRate,
    volume: e.volume,
    trades: e.trades,
    tvl: e.tvl,
    apr: e.apr,
    real_apy: Number.parseFloat(e.aprReal || '0') || 0,
    grid_apy: Number.parseFloat(e.gridApy || '0') || 0,
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
