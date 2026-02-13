'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore } from '@/store/useStore';
import type { GridWithOrdersListResponse } from '@/types/grid';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

interface WsMessage {
  type: 'snapshot' | 'update';
  data: GridWithOrdersListResponse;
  grid_id?: number;
}

interface UseWebSocketOptions {
  /** Owner address to filter by (lowercase). Omit for all grids. */
  owner?: string;
  /** Whether the WebSocket connection is enabled */
  enabled?: boolean;
}

interface UseWebSocketResult {
  /** Latest grid data received via WebSocket */
  data: GridWithOrdersListResponse | null;
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** Update subscription filters at runtime */
  updateSubscription: (opts: { chainId?: number; owner?: string }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketResult {
  const { owner, enabled = true } = options;
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [data, setData] = useState<GridWithOrdersListResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;
  const enabledRef = useRef(enabled);

  // Keep enabledRef in sync via useEffect (React 19 forbids ref writes during render)
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  // Store connect function in a ref so the reconnect timer can call it
  // without creating a circular dependency in useCallback.
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (!enabledRef.current) return;

    const params = new URLSearchParams({
      chain_id: String(selectedChainId),
    });
    if (owner) {
      params.set('owner', owner);
    }

    const ws = new WebSocket(`${WS_BASE}/api/v1/ws?${params}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        if (msg.type === 'snapshot' || msg.type === 'update') {
          setData(msg.data);
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;

      // Auto-reconnect with exponential backoff
      if (enabledRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => {
          connectRef.current();
        }, delay);
      }
    };

    ws.onerror = () => {
      // onclose will fire after onerror, so reconnect logic is handled there
    };
  }, [selectedChainId, owner]);

  // Keep connectRef in sync via useEffect (React 19 forbids ref writes during render)
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const updateSubscription = useCallback(
    (opts: { chainId?: number; owner?: string }) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'subscribe',
            chain_id: opts.chainId,
            owner: opts.owner,
          }),
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect, enabled]);

  return { data, isConnected, updateSubscription };
}
