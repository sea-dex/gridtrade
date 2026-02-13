'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * GridTradingAnimation
 * 
 * A canvas-based hero animation that visualizes grid trading:
 * - A price line (candlestick-style) oscillates up and down
 * - Horizontal grid order lines span the chart
 * - When price crosses a grid line, a "fill" flash occurs
 * - Profit indicators (+$) float upward from filled orders
 */

interface GridLine {
  y: number;        // canvas y position
  price: number;    // display price
  side: 'buy' | 'sell';
  lastCrossTime: number;
  filled: boolean;
}

interface ProfitPopup {
  x: number;
  y: number;
  opacity: number;
  vy: number;
  value: string;
  age: number;
}

interface FillFlash {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  color: string;
}

export function GridTradingAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const priceHistoryRef = useRef<number[]>([]);
  const gridLinesRef = useRef<GridLine[]>([]);
  const profitPopupsRef = useRef<ProfitPopup[]>([]);
  const fillFlashesRef = useRef<FillFlash[]>([]);
  const lastPriceRef = useRef<number>(0);
  const totalProfitRef = useRef<number>(0);
  const filledCountRef = useRef<number>(0);
  const dimensionsRef = useRef({ w: 0, h: 0 });

  // Price simulation parameters
  const BASE_PRICE = 2450;
  const PRICE_AMPLITUDE = 180;
  const GRID_COUNT = 9;

  const generatePrice = useCallback((t: number): number => {
    // Multi-frequency oscillation for realistic price movement
    const wave1 = Math.sin(t * 0.0008) * PRICE_AMPLITUDE * 0.5;
    const wave2 = Math.sin(t * 0.002 + 1.3) * PRICE_AMPLITUDE * 0.25;
    const wave3 = Math.sin(t * 0.005 + 2.7) * PRICE_AMPLITUDE * 0.15;
    const wave4 = Math.sin(t * 0.012 + 0.5) * PRICE_AMPLITUDE * 0.08;
    const noise = Math.sin(t * 0.03) * PRICE_AMPLITUDE * 0.02;
    return BASE_PRICE + wave1 + wave2 + wave3 + wave4 + noise;
  }, []);

  const priceToY = useCallback((price: number, h: number): number => {
    const topPrice = BASE_PRICE + PRICE_AMPLITUDE * 1.1;
    const bottomPrice = BASE_PRICE - PRICE_AMPLITUDE * 1.1;
    const padding = h * 0.08;
    return padding + ((topPrice - price) / (topPrice - bottomPrice)) * (h - padding * 2);
  }, []);

  const initGridLines = useCallback((h: number) => {
    const topPrice = BASE_PRICE + PRICE_AMPLITUDE * 0.75;
    const bottomPrice = BASE_PRICE - PRICE_AMPLITUDE * 0.75;
    const step = (topPrice - bottomPrice) / (GRID_COUNT - 1);
    const lines: GridLine[] = [];

    for (let i = 0; i < GRID_COUNT; i++) {
      const price = topPrice - i * step;
      lines.push({
        y: priceToY(price, h),
        price,
        side: price > BASE_PRICE ? 'sell' : 'buy',
        lastCrossTime: -10000,
        filled: false,
      });
    }
    gridLinesRef.current = lines;
  }, [priceToY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      const w = rect.width;
      const h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dimensionsRef.current = { w, h };
      initGridLines(h);
      priceHistoryRef.current = [];
    };

    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    const animate = (now: number) => {
      const { w, h } = dimensionsRef.current;
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      timeRef.current = elapsed;

      ctx.clearRect(0, 0, w, h);

      // Current price
      const currentPrice = generatePrice(elapsed);
      const currentY = priceToY(currentPrice, h);

      // Store price history
      const history = priceHistoryRef.current;
      history.push(currentPrice);
      const maxHistory = Math.floor(w / 2);
      if (history.length > maxHistory) {
        history.splice(0, history.length - maxHistory);
      }

      // ─── Draw grid lines ───
      const gridLines = gridLinesRef.current;
      for (const line of gridLines) {
        line.y = priceToY(line.price, h);
        const timeSinceCross = elapsed - line.lastCrossTime;
        const flashIntensity = Math.max(0, 1 - timeSinceCross / 800);

        // Grid line
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        const baseAlpha = 0.12 + flashIntensity * 0.25;
        const lineColor = line.side === 'buy'
          ? `rgba(52, 211, 153, ${baseAlpha})`
          : `rgba(248, 113, 113, ${baseAlpha})`;
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 1;
        ctx.moveTo(0, line.y);
        ctx.lineTo(w, line.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Price label on right
        const labelColor = line.side === 'buy'
          ? `rgba(52, 211, 153, ${0.4 + flashIntensity * 0.4})`
          : `rgba(248, 113, 113, ${0.4 + flashIntensity * 0.4})`;
        ctx.font = '10px monospace';
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'right';
        ctx.fillText(`$${line.price.toFixed(0)}`, w - 8, line.y - 4);

        // Side label on left
        const sideLabel = line.side === 'buy' ? 'BUY' : 'SELL';
        ctx.font = 'bold 8px monospace';
        ctx.fillStyle = labelColor;
        ctx.textAlign = 'left';
        ctx.fillText(sideLabel, 8, line.y - 4);

        // Flash ring on fill
        if (flashIntensity > 0) {
          ctx.beginPath();
          const priceX = w - 60;
          ctx.arc(priceX, line.y, 6 + (1 - flashIntensity) * 12, 0, Math.PI * 2);
          const flashColor = line.side === 'buy'
            ? `rgba(52, 211, 153, ${flashIntensity * 0.5})`
            : `rgba(248, 113, 113, ${flashIntensity * 0.5})`;
          ctx.strokeStyle = flashColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // ─── Check for grid line crossings ───
      const lastPrice = lastPriceRef.current;
      if (lastPrice !== 0) {
        for (const line of gridLines) {
          const crossed = (lastPrice < line.price && currentPrice >= line.price) ||
                          (lastPrice > line.price && currentPrice <= line.price);
          if (crossed && elapsed - line.lastCrossTime > 1500) {
            line.lastCrossTime = elapsed;
            line.filled = true;
            filledCountRef.current++;

            // Add profit popup
            const profit = (Math.random() * 8 + 2).toFixed(2);
            totalProfitRef.current += parseFloat(profit);
            profitPopupsRef.current.push({
              x: w - 60 + (Math.random() - 0.5) * 30,
              y: line.y,
              opacity: 1,
              vy: -0.8 - Math.random() * 0.4,
              value: `+$${profit}`,
              age: 0,
            });

            // Add fill flash
            fillFlashesRef.current.push({
              x: w - 60,
              y: line.y,
              radius: 3,
              opacity: 1,
              color: line.side === 'buy' ? '52, 211, 153' : '248, 113, 113',
            });
          }
        }
      }
      lastPriceRef.current = currentPrice;

      // ─── Draw price line (area chart style) ───
      if (history.length > 1) {
        const step = w / maxHistory;

        // Area fill
        ctx.beginPath();
        const startX = w - history.length * step;
        ctx.moveTo(startX, priceToY(history[0], h));
        for (let i = 1; i < history.length; i++) {
          const x = startX + i * step;
          const y = priceToY(history[i], h);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(startX + (history.length - 1) * step, h);
        ctx.lineTo(startX, h);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, priceToY(BASE_PRICE + PRICE_AMPLITUDE, h), 0, h);
        const isUp = currentPrice >= BASE_PRICE;
        if (isUp) {
          gradient.addColorStop(0, 'rgba(52, 211, 153, 0.08)');
          gradient.addColorStop(1, 'rgba(52, 211, 153, 0.0)');
        } else {
          gradient.addColorStop(0, 'rgba(248, 113, 113, 0.08)');
          gradient.addColorStop(1, 'rgba(248, 113, 113, 0.0)');
        }
        ctx.fillStyle = gradient;
        ctx.fill();

        // Price line
        ctx.beginPath();
        ctx.moveTo(startX, priceToY(history[0], h));
        for (let i = 1; i < history.length; i++) {
          const x = startX + i * step;
          const y = priceToY(history[i], h);
          ctx.lineTo(x, y);
        }
        const lineGradient = ctx.createLinearGradient(startX, 0, startX + history.length * step, 0);
        lineGradient.addColorStop(0, 'rgba(136, 150, 171, 0.1)');
        lineGradient.addColorStop(0.7, isUp ? 'rgba(52, 211, 153, 0.6)' : 'rgba(248, 113, 113, 0.6)');
        lineGradient.addColorStop(1, isUp ? 'rgba(52, 211, 153, 0.9)' : 'rgba(248, 113, 113, 0.9)');
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glow on the line tip
        const tipX = startX + (history.length - 1) * step;
        const glowGradient = ctx.createRadialGradient(tipX, currentY, 0, tipX, currentY, 20);
        const glowColor = isUp ? '52, 211, 153' : '248, 113, 113';
        glowGradient.addColorStop(0, `rgba(${glowColor}, 0.3)`);
        glowGradient.addColorStop(1, `rgba(${glowColor}, 0)`);
        ctx.fillStyle = glowGradient;
        ctx.fillRect(tipX - 20, currentY - 20, 40, 40);

        // Dot at current price
        ctx.beginPath();
        ctx.arc(tipX, currentY, 4, 0, Math.PI * 2);
        ctx.fillStyle = isUp ? '#34d399' : '#f87171';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(tipX, currentY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Current price label
        const priceBoxW = 72;
        const priceBoxH = 22;
        const priceBoxX = tipX + 12;
        const priceBoxY = currentY - priceBoxH / 2;
        ctx.fillStyle = isUp ? 'rgba(52, 211, 153, 0.15)' : 'rgba(248, 113, 113, 0.15)';
        ctx.beginPath();
        ctx.roundRect(priceBoxX, priceBoxY, priceBoxW, priceBoxH, 4);
        ctx.fill();
        ctx.strokeStyle = isUp ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = isUp ? '#34d399' : '#f87171';
        ctx.textAlign = 'center';
        ctx.fillText(`$${currentPrice.toFixed(2)}`, priceBoxX + priceBoxW / 2, priceBoxY + 15);
      }

      // ─── Draw fill flashes ───
      const flashes = fillFlashesRef.current;
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.radius += 1.5;
        f.opacity -= 0.02;

        if (f.opacity <= 0) {
          flashes.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${f.color}, ${f.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // ─── Draw profit popups ───
      const popups = profitPopupsRef.current;
      for (let i = popups.length - 1; i >= 0; i--) {
        const p = popups[i];
        p.y += p.vy;
        p.age++;
        p.opacity = Math.max(0, 1 - p.age / 90);

        if (p.opacity <= 0) {
          popups.splice(i, 1);
          continue;
        }

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacity})`;
        ctx.textAlign = 'center';
        ctx.fillText(p.value, p.x, p.y);
      }

      // ─── Draw HUD overlay ───
      // Top-left: pair info
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = 'rgba(225, 231, 239, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText('ETH / USDT', 16, 28);
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(136, 150, 171, 0.5)';
      ctx.fillText('Grid Trading', 16, 42);

      // Top-right: stats
      const statsX = w - 16;
      ctx.textAlign = 'right';
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(136, 150, 171, 0.5)';
      ctx.fillText('FILLED', statsX, 22);
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.fillText(`${filledCountRef.current}`, statsX, 38);

      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(136, 150, 171, 0.5)';
      ctx.fillText('PROFIT', statsX - 70, 22);
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
      ctx.fillText(`+$${totalProfitRef.current.toFixed(2)}`, statsX - 70, 38);

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [generatePrice, priceToY, initGridLines]);

  return (
    <div className="relative w-full h-full rounded-(--radius-lg) overflow-hidden border border-(--border-subtle) bg-(--bg-surface)/30 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      {/* Subtle vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(11, 18, 33, 0.6) 100%)',
        }}
      />
    </div>
  );
}
