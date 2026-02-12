import { desc, eq, and } from 'drizzle-orm';
import { db, tokens } from '../db/index.js';
import type { TokenItem } from '../schemas/tokens.js';

export interface GetTokensParams {
  chainId: number;
  isQuote?: boolean;
}

function mapTokenRowToItem(t: typeof tokens.$inferSelect): TokenItem {
  return {
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logo: t.logo,
    totalSupply: t.totalSupply ?? undefined,
    priority: t.priority,
    isQuote: t.isQuote,
    tags: t.tags ?? undefined,
  };
}

export async function getBaseTokens(chainId: number): Promise<TokenItem[]> {
  const results = await db
    .select()
    .from(tokens)
    .where(eq(tokens.chainId, chainId))
    .orderBy(desc(tokens.priority), tokens.symbol);

  return results.map(mapTokenRowToItem);
}

export async function getQuoteTokens(chainId: number): Promise<TokenItem[]> {
  const results = await db
    .select()
    .from(tokens)
    .where(and(eq(tokens.chainId, chainId), eq(tokens.isQuote, true)))
    .orderBy(desc(tokens.priority), tokens.symbol);

  return results.map(mapTokenRowToItem);
}
