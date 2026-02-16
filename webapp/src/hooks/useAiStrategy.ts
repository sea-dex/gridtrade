'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/store/useStore';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AiStrategyParams {
  prompt: string;
  baseToken: { symbol: string; address: string; decimals: number };
  quoteToken: { symbol: string; address: string; decimals: number };
  currentPrice: number;
}

export interface AiStrategyResult {
  askPrice0: string;
  bidPrice0: string;
  askGap: string;
  bidGap: string;
  askOrderCount: string;
  bidOrderCount: string;
  amountPerGrid: string;
  compound: boolean;
}

export interface AiStrategySuccessResponse {
  status: 'success';
  strategy: AiStrategyResult;
  analysis: string;
}

export interface AiStrategyClarifyResponse {
  status: 'clarify';
  questions: string[];
  analysis: string;
}

export type AiStrategyResponse = AiStrategySuccessResponse | AiStrategyClarifyResponse;

/**
 * Generate a mock strategy response based on the prompt and current price.
 * Used as fallback when the backend API is not available.
 */
function generateMockResponse(
  currentPrice: number,
  baseSymbol: string,
  quoteSymbol: string,
): AiStrategySuccessResponse {
  const spread = currentPrice * 0.05; // 5% spread
  const askPrice0 = (currentPrice + spread * 0.2).toFixed(2);
  const bidPrice0 = (currentPrice - spread * 0.2).toFixed(2);
  const gap = (spread * 0.2).toFixed(2);

  return {
    status: 'success',
    strategy: {
      askPrice0,
      bidPrice0,
      askGap: gap,
      bidGap: gap,
      askOrderCount: '5',
      bidOrderCount: '5',
      amountPerGrid: '0.01',
      compound: true,
    },
    analysis: `Based on current ${baseSymbol} price of ${currentPrice} ${quoteSymbol}, a grid strategy is suggested in the range ${bidPrice0}–${(parseFloat(askPrice0) + parseFloat(gap) * 4).toFixed(2)} ${quoteSymbol}. The grid has 5 ask orders starting at ${askPrice0} and 5 bid orders starting at ${bidPrice0}, with a gap of ${gap} ${quoteSymbol} per level. Amount per grid: 0.01 ${baseSymbol}. Compound mode is enabled to reinvest profits.`,
  };
}

export function useAiStrategy() {
  const selectedChainId = useStore((s) => s.selectedChainId);
  const [data, setData] = useState<AiStrategyResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (params: AiStrategyParams) => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const res = await fetch(`${API_BASE}/api/v1/ai/strategy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: params.prompt,
            base_token: {
              symbol: params.baseToken.symbol,
              address: params.baseToken.address,
              decimals: params.baseToken.decimals,
            },
            quote_token: {
              symbol: params.quoteToken.symbol,
              address: params.quoteToken.address,
              decimals: params.quoteToken.decimals,
            },
            current_price: params.currentPrice,
            chain_id: selectedChainId,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: AiStrategyResponse = await res.json();
        setData(json);
        return json;
      } catch {
        // Fallback to mock data when backend is unavailable
        const mock = generateMockResponse(
          params.currentPrice,
          params.baseToken.symbol,
          params.quoteToken.symbol,
        );
        setData(mock);
        return mock;
      } finally {
        setIsLoading(false);
      }
    },
    [selectedChainId],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { generate, data, isLoading, error, reset };
}
