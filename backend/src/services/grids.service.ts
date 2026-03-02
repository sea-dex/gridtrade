import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db, grids, orders, tokens, pairs } from '../db/index.js';
import { normalizeTokenAddress } from '../config/tokens.js';
import type { GridConfig, GridOrder, GridWithOrders, GridListResponse, GridWithOrdersListResponse, GridDetailResponse, GridProfitsResponse, GridTokenInfo } from '../schemas/grids.js';

export interface GetGridsParams {
  chainId: number;
  owner?: string;
  pairId?: number;
  status?: number;
  page: number;
  pageSize: number;
}

// Helper function to fetch token info by symbol
async function getTokenInfoBySymbol(chainId: number, symbol: string): Promise<GridTokenInfo> {
  const result = await db
    .select()
    .from(tokens)
    .where(and(eq(tokens.chainId, chainId), eq(tokens.symbol, symbol)))
    .limit(1);
  
  if (result.length === 0) {
    // Return default token info if not found
    return {
      address: '',
      symbol,
      name: symbol,
      decimals: 18,
      logo: '',
    };
  }
  
  const t = result[0];
  return {
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logo: t.logo,
  };
}

// Helper function to fetch token info by address
async function getTokenInfoByAddress(chainId: number, address: string): Promise<GridTokenInfo> {
  const result = await db
    .select()
    .from(tokens)
    .where(and(eq(tokens.chainId, chainId), eq(tokens.address, address.toLowerCase())))
    .limit(1);
  
  if (result.length === 0) {
    // Return default token info if not found
    return {
      address,
      symbol: '',
      name: '',
      decimals: 18,
      logo: '',
    };
  }
  
  const t = result[0];
  return {
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logo: t.logo,
  };
}

// Helper function to get token addresses from pair
async function getPairTokenAddresses(chainId: number, pairId: number): Promise<{ baseTokenAddress: string; quoteTokenAddress: string } | null> {
  const result = await db
    .select()
    .from(pairs)
    .where(and(eq(pairs.chainId, chainId), eq(pairs.pairId, pairId)))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  return {
    baseTokenAddress: result[0].baseTokenAddress,
    quoteTokenAddress: result[0].quoteTokenAddress,
  };
}

export async function getGrids(params: GetGridsParams): Promise<GridListResponse> {
  const { chainId, owner, pairId, status, page, pageSize } = params;

  // Build where conditions
  const conditions = [eq(grids.chainId, chainId)];
  
  if (owner) {
    conditions.push(eq(grids.owner, owner.toLowerCase()));
  }

  if (pairId !== undefined) {
    conditions.push(eq(grids.pairId, pairId));
  }
  
  if (status !== undefined) {
    conditions.push(eq(grids.status, status));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(grids)
    .where(and(...conditions));
  
  const total = Number(countResult[0]?.count || 0);

  // Get paginated results
  const offset = (page - 1) * pageSize;
  const results = await db
    .select()
    .from(grids)
    .where(and(...conditions))
    .orderBy(desc(grids.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Fetch token info for each grid
  const gridConfigs: GridConfig[] = await Promise.all(results.map(async (g) => {
    // Get token addresses from pair
    const pairAddresses = await getPairTokenAddresses(chainId, g.pairId);
    
    let baseTokenInfo: GridTokenInfo;
    let quoteTokenInfo: GridTokenInfo;
    
    if (pairAddresses) {
      // Fetch token info by address (more accurate)
      [baseTokenInfo, quoteTokenInfo] = await Promise.all([
        getTokenInfoByAddress(chainId, pairAddresses.baseTokenAddress),
        getTokenInfoByAddress(chainId, pairAddresses.quoteTokenAddress),
      ]);
    } else {
      // Fallback to symbol lookup
      [baseTokenInfo, quoteTokenInfo] = await Promise.all([
        getTokenInfoBySymbol(chainId, g.baseToken),
        getTokenInfoBySymbol(chainId, g.quoteToken),
      ]);
    }
    
    return {
      grid_id: g.gridId,
      owner: g.owner,
      pair_id: g.pairId,
      base_token: g.baseToken,
      quote_token: g.quoteToken,
      base_token_info: baseTokenInfo,
      quote_token_info: quoteTokenInfo,
      ask_order_count: g.askOrderCount,
      bid_order_count: g.bidOrderCount,
      initial_base_amount: g.initialBaseAmount,
      initial_quote_amount: g.initialQuoteAmount,
      profits: g.profits,
      fee: g.fee,
      compound: g.compound,
      oneshot: g.oneshot,
      status: g.status,
      created_at: g.createdAt.toISOString(),
    };
  }));

  return {
    grids: gridConfigs,
    total,
    page,
    page_size: pageSize,
  };
}

export async function getGridsWithOrders(params: GetGridsParams): Promise<GridWithOrdersListResponse> {
  const { chainId, owner, pairId, status, page, pageSize } = params;

  // Build where conditions
  const conditions = [eq(grids.chainId, chainId)];

  if (owner) {
    conditions.push(eq(grids.owner, owner.toLowerCase()));
  }

  if (pairId !== undefined) {
    conditions.push(eq(grids.pairId, pairId));
  }

  if (status !== undefined) {
    conditions.push(eq(grids.status, status));
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(grids)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count || 0);

  // Get paginated grid results
  const offset = (page - 1) * pageSize;
  const gridResults = await db
    .select()
    .from(grids)
    .where(and(...conditions))
    .orderBy(desc(grids.createdAt))
    .limit(pageSize)
    .offset(offset);

  if (gridResults.length === 0) {
    return { grids: [], total, page, page_size: pageSize };
  }

  // Get all orders for these grids in a single query
  const gridIds = gridResults.map((g) => g.gridId);
  const orderResults = await db
    .select()
    .from(orders)
    .where(and(eq(orders.chainId, chainId), inArray(orders.gridId, gridIds)))
    .orderBy(orders.orderId);

  // Group orders by gridId
  const ordersByGridId = new Map<number, GridOrder[]>();
  for (const o of orderResults) {
    const gridOrder: GridOrder = {
      order_id: o.orderId,
      grid_id: o.gridId,
      is_ask: o.isAsk,
      price: o.price,
      amount: o.amount,
      rev_amount: o.revAmount,
      rev_price: o.revPrice,
      status: o.status,
    };
    const existing = ordersByGridId.get(o.gridId) || [];
    existing.push(gridOrder);
    ordersByGridId.set(o.gridId, existing);
  }

  // Build response with grids and their orders (with token info)
  const gridsWithOrders: GridWithOrders[] = await Promise.all(gridResults.map(async (g) => {
    // Get token addresses from pair
    const pairAddresses = await getPairTokenAddresses(chainId, g.pairId);
    
    let baseTokenInfo: GridTokenInfo;
    let quoteTokenInfo: GridTokenInfo;
    
    if (pairAddresses) {
      // Fetch token info by address (more accurate)
      [baseTokenInfo, quoteTokenInfo] = await Promise.all([
        getTokenInfoByAddress(chainId, pairAddresses.baseTokenAddress),
        getTokenInfoByAddress(chainId, pairAddresses.quoteTokenAddress),
      ]);
    } else {
      // Fallback to symbol lookup
      [baseTokenInfo, quoteTokenInfo] = await Promise.all([
        getTokenInfoBySymbol(chainId, g.baseToken),
        getTokenInfoBySymbol(chainId, g.quoteToken),
      ]);
    }
    
    return {
      config: {
        grid_id: g.gridId,
        owner: g.owner,
        pair_id: g.pairId,
        base_token: g.baseToken,
        quote_token: g.quoteToken,
        base_token_info: baseTokenInfo,
        quote_token_info: quoteTokenInfo,
        ask_order_count: g.askOrderCount,
        bid_order_count: g.bidOrderCount,
        initial_base_amount: g.initialBaseAmount,
        initial_quote_amount: g.initialQuoteAmount,
        profits: g.profits,
        fee: g.fee,
        compound: g.compound,
        oneshot: g.oneshot,
        status: g.status,
        created_at: g.createdAt.toISOString(),
      },
      orders: ordersByGridId.get(g.gridId) || [],
    };
  }));

  return {
    grids: gridsWithOrders,
    total,
    page,
    page_size: pageSize,
  };
}

export async function getGridDetail(chainId: number, gridId: number): Promise<GridDetailResponse | null> {
  // Get grid
  const gridResults = await db
    .select()
    .from(grids)
    .where(and(eq(grids.chainId, chainId), eq(grids.gridId, gridId)))
    .limit(1);

  if (gridResults.length === 0) {
    return null;
  }

  const g = gridResults[0];

  // Get orders for this grid
  const orderResults = await db
    .select()
    .from(orders)
    .where(and(eq(orders.chainId, chainId), eq(orders.gridId, gridId)))
    .orderBy(orders.orderId);

  // Get token addresses from pair
  const pairAddresses = await getPairTokenAddresses(chainId, g.pairId);
  
  let baseTokenInfo: GridTokenInfo;
  let quoteTokenInfo: GridTokenInfo;
  
  if (pairAddresses) {
    // Fetch token info by address (more accurate)
    [baseTokenInfo, quoteTokenInfo] = await Promise.all([
      getTokenInfoByAddress(chainId, pairAddresses.baseTokenAddress),
      getTokenInfoByAddress(chainId, pairAddresses.quoteTokenAddress),
    ]);
  } else {
    // Fallback to symbol lookup
    [baseTokenInfo, quoteTokenInfo] = await Promise.all([
      getTokenInfoBySymbol(chainId, g.baseToken),
      getTokenInfoBySymbol(chainId, g.quoteToken),
    ]);
  }

  const gridConfig: GridConfig = {
    grid_id: g.gridId,
    owner: g.owner,
    pair_id: g.pairId,
    base_token: g.baseToken,
    quote_token: g.quoteToken,
    base_token_info: baseTokenInfo,
    quote_token_info: quoteTokenInfo,
    ask_order_count: g.askOrderCount,
    bid_order_count: g.bidOrderCount,
    initial_base_amount: g.initialBaseAmount,
    initial_quote_amount: g.initialQuoteAmount,
    profits: g.profits,
    fee: g.fee,
    compound: g.compound,
    oneshot: g.oneshot,
    status: g.status,
    created_at: g.createdAt.toISOString(),
  };

  const gridOrders: GridOrder[] = orderResults.map((o) => ({
    order_id: o.orderId,
    grid_id: o.gridId,
    is_ask: o.isAsk,
    price: o.price,
    amount: o.amount,
    rev_amount: o.revAmount,
    rev_price: o.revPrice,
    status: o.status,
  }));

  return {
    config: gridConfig,
    orders: gridOrders,
  };
}

export async function getGridProfits(chainId: number, gridId: number): Promise<GridProfitsResponse | null> {
  const results = await db
    .select({
      gridId: grids.gridId,
      profits: grids.profits,
      quoteToken: grids.quoteToken,
    })
    .from(grids)
    .where(and(eq(grids.chainId, chainId), eq(grids.gridId, gridId)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const g = results[0];

  return {
    grid_id: g.gridId,
    profits: g.profits,
    quote_token: g.quoteToken,
  };
}

/**
 * Get pair ID by base and quote token addresses.
 * Normalizes 0x0 addresses to WETH address for the given chain.
 */
export async function getPairIdByAddresses(
  chainId: number,
  baseTokenAddress: string,
  quoteTokenAddress: string
): Promise<{ pairId: number | null; baseTokenAddress: string; quoteTokenAddress: string }> {
  // Normalize addresses (replace 0x0 with WETH)
  const normalizedBase = normalizeTokenAddress(baseTokenAddress, chainId);
  const normalizedQuote = normalizeTokenAddress(quoteTokenAddress, chainId);

  const result = await db
    .select({ pairId: pairs.pairId })
    .from(pairs)
    .where(
      and(
        eq(pairs.chainId, chainId),
        eq(pairs.baseTokenAddress, normalizedBase),
        eq(pairs.quoteTokenAddress, normalizedQuote)
      )
    )
    .limit(1);

  return {
    pairId: result.length > 0 ? result[0].pairId : null,
    baseTokenAddress: normalizedBase,
    quoteTokenAddress: normalizedQuote,
  };
}
