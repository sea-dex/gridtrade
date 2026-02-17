import { eq, and, sql, desc } from 'drizzle-orm';
import { db, orders, orderFills, grids } from '../db/index.js';
import type { OrderInfo, OrderFill, OrderListResponse, OrderFillsResponse, OrderWithGridInfo, OrderWithGridInfoListResponse } from '../schemas/orders.js';

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
  page: number;
  pageSize: number;
}

export async function getOrdersWithGridInfo(params: GetOrdersWithGridInfoParams): Promise<OrderWithGridInfoListResponse> {
  const { chainId, owner, gridId, page, pageSize } = params;

  // Build where conditions
  const conditions = [eq(orders.chainId, chainId)];
  if (owner) {
    conditions.push(eq(grids.owner, owner.toLowerCase()));
  }
  if (gridId !== undefined) {
    conditions.push(eq(orders.gridId, gridId));
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

  const orderList: OrderWithGridInfo[] = results.map((o) => ({
    order_id: o.orderId,
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
    profits: o.profits,
    grid_status: o.gridStatus,
  }));

  return {
    orders: orderList,
    total,
    page,
    page_size: pageSize,
  };
}
