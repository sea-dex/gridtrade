import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db, grids, orders } from '../db/index.js';
import type { GridConfig, GridOrder, GridWithOrders, GridListResponse, GridWithOrdersListResponse, GridDetailResponse, GridProfitsResponse } from '../schemas/grids.js';

export interface GetGridsParams {
  chainId: number;
  owner?: string;
  status?: number;
  page: number;
  pageSize: number;
}

export async function getGrids(params: GetGridsParams): Promise<GridListResponse> {
  const { chainId, owner, status, page, pageSize } = params;

  // Build where conditions
  const conditions = [eq(grids.chainId, chainId)];
  
  if (owner) {
    conditions.push(eq(grids.owner, owner.toLowerCase()));
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

  const gridConfigs: GridConfig[] = results.map((g) => ({
    grid_id: g.gridId,
    owner: g.owner,
    pair_id: g.pairId,
    base_token: g.baseToken,
    quote_token: g.quoteToken,
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
  }));

  return {
    grids: gridConfigs,
    total,
    page,
    page_size: pageSize,
  };
}

export async function getGridsWithOrders(params: GetGridsParams): Promise<GridWithOrdersListResponse> {
  const { chainId, owner, status, page, pageSize } = params;

  // Build where conditions
  const conditions = [eq(grids.chainId, chainId)];

  if (owner) {
    conditions.push(eq(grids.owner, owner.toLowerCase()));
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
      status: o.status,
    };
    const existing = ordersByGridId.get(o.gridId) || [];
    existing.push(gridOrder);
    ordersByGridId.set(o.gridId, existing);
  }

  // Build response with grids and their orders
  const gridsWithOrders: GridWithOrders[] = gridResults.map((g) => ({
    config: {
      grid_id: g.gridId,
      owner: g.owner,
      pair_id: g.pairId,
      base_token: g.baseToken,
      quote_token: g.quoteToken,
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

  const gridConfig: GridConfig = {
    grid_id: g.gridId,
    owner: g.owner,
    pair_id: g.pairId,
    base_token: g.baseToken,
    quote_token: g.quoteToken,
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
