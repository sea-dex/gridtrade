/** A horizontal price line to draw on the TradingView chart */
export interface PriceLine {
  /** The price value (human-readable, not scaled) */
  price: number;
  /** Line color (CSS color string) */
  color: string;
  /** Label shown on the price axis */
  label: string;
  /** Line style: 0=Solid, 1=Dotted, 2=Dashed, 3=LargeDashed */
  lineStyle?: number;
  /** Line width in px */
  lineWidth?: number;
}

/** Grid configuration from the API */
export interface GridConfig {
  grid_id: number;
  owner: string;
  pair_id: number;
  base_token: string;
  quote_token: string;
  ask_order_count: number;
  bid_order_count: number;
  initial_base_amount: string;
  initial_quote_amount: string;
  profits: string;
  fee: number;
  compound: boolean;
  oneshot: boolean;
  status: number;
  created_at: string;
}

/** Individual order within a grid */
export interface GridOrder {
  order_id: string;
  grid_id: number;
  is_ask: boolean;
  price: string;
  amount: string;
  rev_amount: string;
  status: number;
}

/** A grid with all its orders grouped together */
export interface GridWithOrders {
  config: GridConfig;
  orders: GridOrder[];
}

/** Response from GET /grids/with-orders */
export interface GridWithOrdersListResponse {
  grids: GridWithOrders[];
  total: number;
  page: number;
  page_size: number;
}

/** Flat order with grid-level info from GET /orders/with-grid-info */
export interface OrderWithGridInfo {
  order_id: string;
  grid_id: number;
  pair_id: number;
  is_ask: boolean;
  compound: boolean;
  fee: number;
  status: number;
  amount: string;
  rev_amount: string;
  price: string;
  rev_price: string;
  owner: string;
  base_token: string;
  quote_token: string;
  profits: string;
  grid_status: number;
}

/** Response from GET /orders/with-grid-info */
export interface OrderWithGridInfoListResponse {
  orders: OrderWithGridInfo[];
  total: number;
  page: number;
  page_size: number;
}
