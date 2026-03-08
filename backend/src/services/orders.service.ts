import { eq, and, sql, desc } from 'drizzle-orm';
import { db, orders, orderFills, grids, tokens, pairs } from '../db/index.js';
import { normalizeTokenAddress } from '../config/tokens.js';
import type { OrderInfo, OrderFill, OrderListResponse, OrderFillsResponse, OrderWithGridInfo, OrderWithGridInfoListResponse } from '../schemas/orders.js';
import type { GridTokenInfo } from '../schemas/grids.js';

export interface GetOrdersParams {
  chainId: number;
  gridId?: number;
  pairId?: number;
  isAsk?: boolean;
}

export async function getOrders(params: GetOrdersParams): Promise<OrderListResponse> {
  const { chainId, gridId, pairId, isAsk } = params;

  // Build where conditions
  const conditions = [eq(orders.chainId, chainId)];
  
  if (gridId !== undefined) {
    conditions.push(eq(orders.gridId, gridId));
  }
  
  if (pairId !== undefined) {
    conditions.push(eq(orders.pairId, pairId));
  }
  
  if (isAsk !== undefined) {
    conditions.push(eq(orders.isAsk, isAsk));
  }

  const results = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(orders.orderId);

  const orderInfos: OrderInfo[] = results.map((o) => ({
    order_id: o.orderId,
    grid_id: o.gridId,
    pair_id: o.pairId,
    is_ask: o.isAsk,
    compound: o.compound,
    oneshot: o.oneshot,
    fee: o.fee,
    status: o.status,
    amount: o.amount,
    rev_amount: o.revAmount,
    initial_base_amount: o.initialBaseAmount,
    initial_quote_amount: o.initialQuoteAmount,
    price: o.price,
    rev_price: o.revPrice,
  }));

  return {
    orders: orderInfos,
    total: orderInfos.length,
  };
}

export async function getOrderDetail(chainId: number, orderId: string): Promise<OrderInfo | null> {
  const results = await db
    .select()
    .from(orders)
    .where(and(eq(orders.chainId, chainId), eq(orders.orderId, orderId)))
    .limit(1);

  if (results.length === 0) {
    return null;
  }

  const o = results[0];

  return {
    order_id: o.orderId,
    grid_id: o.gridId,
    pair_id: o.pairId,
    is_ask: o.isAsk,
    compound: o.compound,
    oneshot: o.oneshot,
    fee: o.fee,
    status: o.status,
    amount: o.amount,
    rev_amount: o.revAmount,
    initial_base_amount: o.initialBaseAmount,
    initial_quote_amount: o.initialQuoteAmount,
    price: o.price,
    rev_price: o.revPrice,
  };
}

export async function getOrderFills(chainId: number, orderId: string): Promise<OrderFillsResponse> {
  const results = await db
    .select()
    .from(orderFills)
    .where(and(eq(orderFills.chainId, chainId), eq(orderFills.orderId, orderId)))
    .orderBy(orderFills.timestamp);

  const fills: OrderFill[] = results.map((f) => ({
    tx_hash: f.txHash,
    taker: f.taker,
    order_id: f.orderId,
    filled_amount: f.filledAmount,
    filled_volume: f.filledVolume,
    is_ask: f.isAsk,
    timestamp: f.timestamp.toISOString(),
  }));

  return {
    fills,
    total: fills.length,
  };
}

export interface GetOrdersWithGridInfoParams {
  chainId: number;
  owner?: string;
  gridId?: number;
  baseToken?: string;
  quoteToken?: string;
  status?: number;
  page: number;
  pageSize: number;
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

export async function getOrdersWithGridInfo(params: GetOrdersWithGridInfoParams): Promise<OrderWithGridInfoListResponse> {
  const { chainId, owner, gridId, baseToken, quoteToken, status, page, pageSize } = params;

  // Build where conditions
  const conditions = [eq(orders.chainId, chainId)];
  if (owner) {
    conditions.push(eq(grids.owner, owner.toLowerCase()));
  }
  if (gridId !== undefined) {
    conditions.push(eq(orders.gridId, gridId));
  }
  // Match My Grids semantics: the tab-level filter is based on grid status,
  // not per-order lifecycle state.
  if (status !== undefined) {
    conditions.push(eq(grids.status, status));
  }

  // Filter by base_token and quote_token addresses
  // Need to find pair IDs that match the token addresses
  let pairIdsByTokens: number[] | undefined;
  if (baseToken && quoteToken) {
    const normalizedBase = normalizeTokenAddress(baseToken, chainId);
    const normalizedQuote = normalizeTokenAddress(quoteToken, chainId);
    const pairResults = await db
      .select({ pairId: pairs.pairId })
      .from(pairs)
      .where(and(
        eq(pairs.chainId, chainId),
        eq(pairs.baseTokenAddress, normalizedBase),
        eq(pairs.quoteTokenAddress, normalizedQuote)
      ));
    pairIdsByTokens = pairResults.map(p => p.pairId);
    if (pairIdsByTokens.length === 0) {
      // No matching pair found, return empty result
      return { orders: [], total: 0, page, page_size: pageSize };
    }
  }

  // Add pair filter from token addresses
  if (pairIdsByTokens && pairIdsByTokens.length > 0) {
    conditions.push(sql`${orders.pairId} IN (${pairIdsByTokens.join(',')})`);
  }

  // Count total
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .innerJoin(grids, and(eq(orders.chainId, grids.chainId), eq(orders.gridId, grids.gridId)))
    .where(and(...conditions));

  const total = Number(countResult[0]?.count || 0);

  // Get paginated results with join
  const offset = (page - 1) * pageSize;
  const results = await db
    .select({
      orderId: orders.orderId,
      hexOrderId: orders.hexOrderId,
      gridId: orders.gridId,
      pairId: orders.pairId,
      isAsk: orders.isAsk,
      compound: orders.compound,
      fee: orders.fee,
      status: orders.status,
      amount: orders.amount,
      revAmount: orders.revAmount,
      price: orders.price,
      revPrice: orders.revPrice,
      // Grid info
      owner: grids.owner,
      baseToken: grids.baseToken,
      quoteToken: grids.quoteToken,
      profits: grids.profits,
      gridStatus: grids.status,
    })
    .from(orders)
    .innerJoin(grids, and(eq(orders.chainId, grids.chainId), eq(orders.gridId, grids.gridId)))
    .where(and(...conditions))
    .orderBy(desc(orders.gridId), orders.orderId)
    .limit(pageSize)
    .offset(offset);

  // Fetch token info for each order
  const orderList: OrderWithGridInfo[] = await Promise.all(results.map(async (o) => {
    // Get token addresses from pair
    const pairAddresses = await getPairTokenAddresses(chainId, o.pairId);
    
    let baseTokenInfo: GridTokenInfo;
    let quoteTokenInfo: GridTokenInfo;
    
    if (pairAddresses) {
      // Fetch token info by address (more accurate)
      [baseTokenInfo, quoteTokenInfo] = await Promise.all([
        getTokenInfoByAddress(chainId, pairAddresses.baseTokenAddress),
        getTokenInfoByAddress(chainId, pairAddresses.quoteTokenAddress),
      ]);
    } else {
      // Fallback to default
      baseTokenInfo = { address: '', symbol: o.baseToken, name: o.baseToken, decimals: 18, logo: '' };
      quoteTokenInfo = { address: '', symbol: o.quoteToken, name: o.quoteToken, decimals: 18, logo: '' };
    }
    
    return {
      order_id: o.orderId,
      hex_order_id: o.hexOrderId,
      grid_id: o.gridId,
      pair_id: o.pairId,
      is_ask: o.isAsk,
      compound: o.compound,
      fee: o.fee,
      status: o.status,
      amount: o.amount,
      rev_amount: o.revAmount,
      price: o.price,
      rev_price: o.revPrice,
      owner: o.owner,
      base_token: o.baseToken,
      quote_token: o.quoteToken,
      base_token_info: baseTokenInfo,
      quote_token_info: quoteTokenInfo,
      profits: o.profits,
      grid_status: o.gridStatus,
    };
  }));

  return {
    orders: orderList,
    total,
    page,
    page_size: pageSize,
  };
}
