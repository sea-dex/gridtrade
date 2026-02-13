import type { WebSocket, RawData } from 'ws';
import { appLogger } from '../utils/logger.js';
import { getGridsWithOrders } from './grids.service.js';

/** Tracked client with its subscription filters */
interface WsClient {
  ws: WebSocket;
  /** Chain ID the client is subscribed to */
  chainId: number;
  /** Optional owner filter (lowercase) */
  owner?: string;
}

const clients = new Set<WsClient>();

/** Register a new WebSocket client */
export function addClient(ws: WebSocket, chainId: number, owner?: string): void {
  const client: WsClient = { ws, chainId, owner: owner?.toLowerCase() };
  clients.add(client);

  appLogger.info({ chainId, owner, total: clients.size }, 'WS client connected');

  ws.on('message', (raw: RawData) => {
    try {
      const msg = JSON.parse(String(raw));
      // Allow clients to update their subscription at runtime
      if (msg.type === 'subscribe') {
        if (msg.chain_id !== undefined) client.chainId = Number(msg.chain_id);
        if (msg.owner !== undefined) client.owner = msg.owner?.toLowerCase();
        appLogger.debug({ chainId: client.chainId, owner: client.owner }, 'WS client updated subscription');
        // Send initial data after subscription change
        sendInitialData(client);
      }
    } catch {
      // ignore non-JSON messages
    }
  });

  ws.on('close', () => {
    clients.delete(client);
    appLogger.info({ total: clients.size }, 'WS client disconnected');
  });

  ws.on('error', (err: Error) => {
    appLogger.error({ err }, 'WS client error');
    clients.delete(client);
  });

  // Send initial data
  sendInitialData(client);
}

/** Send initial grid data to a newly connected client */
async function sendInitialData(client: WsClient): Promise<void> {
  try {
    const data = await getGridsWithOrders({
      chainId: client.chainId,
      owner: client.owner,
      page: 1,
      pageSize: 100,
    });

    safeSend(client.ws, {
      type: 'snapshot',
      data,
    });
  } catch (err) {
    appLogger.error({ err }, 'Failed to send initial WS data');
  }
}

/** Broadcast a grid order update to all matching clients */
export async function broadcastGridUpdate(chainId: number, gridId?: number): Promise<void> {
  if (clients.size === 0) return;

  for (const client of clients) {
    if (client.chainId !== chainId) continue;

    try {
      // Re-fetch the data matching this client's filters
      const data = await getGridsWithOrders({
        chainId: client.chainId,
        owner: client.owner,
        page: 1,
        pageSize: 100,
      });

      safeSend(client.ws, {
        type: 'update',
        data,
        grid_id: gridId,
      });
    } catch (err) {
      appLogger.error({ err, chainId, gridId }, 'Failed to broadcast grid update');
    }
  }
}

/** Broadcast to all clients on a given chain (no owner filter) */
export async function broadcastAllGridsUpdate(chainId: number): Promise<void> {
  if (clients.size === 0) return;

  for (const client of clients) {
    if (client.chainId !== chainId) continue;

    try {
      const data = await getGridsWithOrders({
        chainId: client.chainId,
        owner: client.owner,
        page: 1,
        pageSize: 100,
      });

      safeSend(client.ws, {
        type: 'update',
        data,
      });
    } catch (err) {
      appLogger.error({ err, chainId }, 'Failed to broadcast all grids update');
    }
  }
}

/** Get the number of connected clients */
export function getClientCount(): number {
  return clients.size;
}

/** Safely send JSON to a WebSocket, catching errors */
function safeSend(ws: WebSocket, payload: unknown): void {
  try {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  } catch (err) {
    appLogger.error({ err }, 'Failed to send WS message');
  }
}
