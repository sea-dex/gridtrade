'use client';

import { useEffect, useRef, memo } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
} from 'lightweight-charts';
import type { Candle } from '@/hooks/useKline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { PriceLine } from '@/types/grid';

interface TradingViewChartProps {
  /** Candle data from the backend (oldest first) */
  candles: Candle[];
  /** Horizontal price lines */
  priceLines?: PriceLine[];
  /** Chart height in px */
  height?: number;
  /** Theme */
  theme?: 'light' | 'dark';
  /** Whether data is currently loading (shows overlay) */
  isLoading?: boolean;
  /** Error message from API fetch */
  error?: string;
}

// ---------------------------------------------------------------------------
// Theme palettes
// ---------------------------------------------------------------------------

const darkPalette = {
  background: '#0b1221',
  text: '#9ca3af',
  grid: 'rgba(22, 32, 54, 0.6)',
  border: '#1e293b',
  crosshair: '#4b5563',
  upColor: '#22c55e',
  downColor: '#ef4444',
  upWick: '#22c55e',
  downWick: '#ef4444',
  volumeUp: 'rgba(34, 197, 94, 0.25)',
  volumeDown: 'rgba(239, 68, 68, 0.25)',
};

const lightPalette = {
  background: '#ffffff',
  text: '#374151',
  grid: 'rgba(209, 213, 219, 0.5)',
  border: '#e5e7eb',
  crosshair: '#9ca3af',
  upColor: '#16a34a',
  downColor: '#dc2626',
  upWick: '#16a34a',
  downWick: '#dc2626',
  volumeUp: 'rgba(22, 163, 74, 0.2)',
  volumeDown: 'rgba(220, 38, 38, 0.2)',
};

type Palette = typeof darkPalette;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maximum decimal places we'll ever show on the price axis */
const MAX_PRECISION = 12;

/**
 * Infer the best `precision` and `minMove` from actual candle data so that
 * both BTC-level prices (≈ 60 000) and meme-level prices (≈ 0.000000012)
 * display correctly on the Y-axis and crosshair tooltip.
 *
 * Algorithm:
 *  1. Collect every OHLC price string.
 *  2. For each price, count the number of meaningful decimal digits
 *     (i.e. the full fractional part length from the raw string, which
 *     preserves trailing zeros the source intended).
 *  3. Take the maximum across all prices → that is our `precision`.
 *  4. Clamp to [0, MAX_PRECISION].
 */
export function inferPriceFormat(candles: Candle[]): { precision: number; minMove: number } {
  if (candles.length === 0) return { precision: 2, minMove: 0.01 };

  let maxDecimals = 0;

  for (const c of candles) {
    for (const raw of [c.o, c.h, c.l, c.c]) {
      // Count meaningful digits after the decimal point (strip trailing zeros)
      const dotIdx = raw.indexOf('.');
      if (dotIdx !== -1) {
        const frac = raw.slice(dotIdx + 1).replace(/0+$/, '');
        if (frac.length > maxDecimals) maxDecimals = frac.length;
      }
    }
  }

  // For very large prices with 0 decimals, still show at least 2
  const precision = Math.min(MAX_PRECISION, Math.max(2, maxDecimals+1));
  const minMove = parseFloat((10 ** -precision).toFixed(precision));
  return { precision, minMove };
}

function toChartCandle(c: Candle): CandlestickData<Time> {
  return {
    time: c.t as Time,
    open: parseFloat(c.o),
    high: parseFloat(c.h),
    low: parseFloat(c.l),
    close: parseFloat(c.c),
  };
}

function toVolumeBar(c: Candle, palette: Palette): HistogramData<Time> {
  const open = parseFloat(c.o);
  const close = parseFloat(c.c);
  return {
    time: c.t as Time,
    value: parseFloat(c.v),
    color: close >= open ? palette.volumeUp : palette.volumeDown,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function TradingViewChartComponent({
  candles,
  priceLines = [],
  height = 500,
  theme = 'dark',
  isLoading = false,
  error,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const priceLineRefs = useRef<ReturnType<ISeriesApi<'Candlestick'>['createPriceLine']>[]>([]);

  const palette = theme === 'dark' ? darkPalette : lightPalette;

  // ── Create chart once (recreate when theme/height changes) ─────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: palette.background },
        textColor: palette.text,
      },
      grid: {
        vertLines: { color: palette.grid },
        horzLines: { color: palette.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: palette.crosshair, width: 1, style: 3 },
        horzLine: { color: palette.crosshair, width: 1, style: 3 },
      },
      rightPriceScale: {
        borderColor: palette.border,
      },
      timeScale: {
        borderColor: palette.border,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Candlestick series (v5 API: chart.addSeries(Definition, options))
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: palette.upColor,
      downColor: palette.downColor,
      wickUpColor: palette.upWick,
      wickDownColor: palette.downWick,
      borderVisible: false,
    });

    // Volume histogram (overlaid at bottom)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    // Put volume on a separate scale at the bottom, taking ~20% of chart height
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Responsive resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, height]);

  // ── Update data when candles change ────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles.length) return;

    // Dynamically set price precision based on actual candle data
    const { precision, minMove } = inferPriceFormat(candles);
    candleSeriesRef.current.applyOptions({
      priceFormat: {
        type: 'price',
        precision,
        minMove,
      },
    });

    const chartCandles = candles.map(toChartCandle);
    const volumeBars = candles.map((c) => toVolumeBar(c, palette));

    candleSeriesRef.current.setData(chartCandles);
    volumeSeriesRef.current.setData(volumeBars);

    // Auto-fit visible range to show all data
    chartRef.current?.timeScale().fitContent();
  }, [candles, palette]);

  // ── Update price lines when inputs change ───────────────────────────
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (!candleSeries) return;

    // Remove previous lines
    for (const l of priceLineRefs.current) {
      candleSeries.removePriceLine(l);
    }
    priceLineRefs.current = [];

    // Add new lines
    for (const pl of priceLines) {
      if (!Number.isFinite(pl.price)) continue;
      const line = candleSeries.createPriceLine({
        price: pl.price,
        color: pl.color,
        // lightweight-charts uses a narrow union for lineWidth; cast is safe.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lineWidth: (pl.lineWidth ?? 1) as any,
        lineStyle: pl.lineStyle ?? 2, // dashed by default
        axisLabelVisible: true,
        title: pl.label,
      });
      priceLineRefs.current.push(line);
    }
  }, [priceLines]);

  return (
    <div className="relative" style={{ height: `${height}px`, width: '100%' }}>
      <div
        ref={containerRef}
        style={{ height: '100%', width: '100%' }}
      />
      {/* Loading overlay */}
      {isLoading && candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-(--bg-base)/80 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-(--text-disabled) border-t-(--accent-primary) rounded-full animate-spin" />
            <span className="text-xs text-(--text-disabled)">Loading chart data…</span>
          </div>
        </div>
      )}
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-(--bg-base)/60 z-10">
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <span className="text-sm text-(--red)">Failed to load chart data</span>
            <span className="text-xs text-(--text-disabled)">{error}</span>
          </div>
        </div>
      )}
      {/* Empty state */}
      {!isLoading && !error && candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <span className="text-sm text-(--text-disabled)">No chart data available</span>
        </div>
      )}
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
