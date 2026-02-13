import React, { useMemo, useRef, useState, useCallback } from 'react';
import { CandleData } from "@/lib/stockData";
import { Card, CardContent } from "@/components/ui/card";

interface StockChartProps {
  data: CandleData[];
  symbol: string;
}

const CHART_PADDING = { top: 10, right: 60, bottom: 30, left: 10 };

export function StockChart({ data, symbol }: StockChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const measuredRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      const observer = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      });
      observer.observe(node);
      (containerRef as any).current = node;
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0) setDimensions({ width, height });
    }
  }, []);

  const chartArea = useMemo(() => ({
    x: CHART_PADDING.left,
    y: CHART_PADDING.top,
    width: dimensions.width - CHART_PADDING.left - CHART_PADDING.right,
    height: dimensions.height - CHART_PADDING.top - CHART_PADDING.bottom,
  }), [dimensions]);

  const dataWithMA = useMemo(() => {
    const k = 2 / (20 + 1);
    let ema20: number | null = null;
    return data.map((item, index, array) => {
      if (index < 19) {
        ema20 = null;
      } else if (index === 19) {
        ema20 = array.slice(0, 20).reduce((sum, d) => sum + d.close, 0) / 20;
      } else {
        ema20 = item.close * k + (ema20 as number) * (1 - k);
      }

      const sma200 = index >= 199
        ? array.slice(index - 199, index + 1).reduce((sum, d) => sum + d.close, 0) / 200
        : null;
      return { ...item, ema20, sma200 };
    });
  }, [data]);

  const { minPrice, maxPrice } = useMemo(() => {
    const lows = data.map(d => d.low);
    const highs = data.map(d => d.high);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const padding = (max - min) * 0.05 || 0.01;
    return { minPrice: min - padding, maxPrice: max + padding };
  }, [data]);

  const scaleY = useCallback((value: number) => {
    const ratio = (value - minPrice) / (maxPrice - minPrice);
    return chartArea.y + chartArea.height - ratio * chartArea.height;
  }, [minPrice, maxPrice, chartArea]);

  const scaleX = useCallback((index: number) => {
    if (data.length <= 1) return chartArea.x + chartArea.width / 2;
    const barWidth = chartArea.width / data.length;
    return chartArea.x + index * barWidth + barWidth / 2;
  }, [data.length, chartArea]);

  const barWidth = useMemo(() => {
    const w = chartArea.width / data.length;
    return Math.max(3, Math.min(w * 0.7, 20));
  }, [data.length, chartArea.width]);

  const yTicks = useMemo(() => {
    const range = maxPrice - minPrice;
    const tickCount = 6;
    const step = range / tickCount;
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  const xTicks = useMemo(() => {
    if (data.length <= 8) return data.map((_, i) => i);
    const step = Math.ceil(data.length / 8);
    const ticks = [];
    for (let i = 0; i < data.length; i += step) {
      ticks.push(i);
    }
    return ticks;
  }, [data]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const barStep = chartArea.width / data.length;
    const idx = Math.floor((mouseX - chartArea.x) / barStep);
    if (idx >= 0 && idx < data.length) {
      setHoverIndex(idx);
    } else {
      setHoverIndex(null);
    }
  }, [chartArea, data.length]);

  const hoverData = hoverIndex !== null ? dataWithMA[hoverIndex] : null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const decimals = maxPrice < 1 ? 3 : maxPrice < 10 ? 2 : 2;

  return (
    <Card className="w-full bg-transparent border-none shadow-none" data-testid="stock-chart">
      <CardContent className="h-[450px] w-full p-0 relative">
        <div ref={measuredRef} className="w-full h-full">
          <svg
            width={dimensions.width}
            height={dimensions.height}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIndex(null)}
            className="select-none"
          >
            {yTicks.map((tick, i) => (
              <g key={`ytick-${i}`}>
                <line
                  x1={chartArea.x}
                  y1={scaleY(tick)}
                  x2={chartArea.x + chartArea.width}
                  y2={scaleY(tick)}
                  stroke="hsl(var(--primary))"
                  strokeOpacity={0.1}
                  strokeDasharray="3 3"
                />
                <text
                  x={chartArea.x + chartArea.width + 8}
                  y={scaleY(tick)}
                  fill="hsl(var(--primary))"
                  fontSize={11}
                  fontFamily="var(--font-mono)"
                  dominantBaseline="middle"
                >
                  {tick.toFixed(decimals)}
                </text>
              </g>
            ))}

            {xTicks.map((idx) => (
              <text
                key={`xtick-${idx}`}
                x={scaleX(idx)}
                y={chartArea.y + chartArea.height + 20}
                fill="hsl(var(--muted-foreground))"
                fontSize={10}
                fontFamily="var(--font-sans)"
                textAnchor="middle"
              >
                {formatDate(data[idx].time)}
              </text>
            ))}

            {dataWithMA.map((d, i) => {
              const isBullish = d.close >= d.open;
              const color = isBullish ? '#22c55e' : '#ef4444';
              const cx = scaleX(i);
              const bodyTop = scaleY(Math.max(d.open, d.close));
              const bodyBottom = scaleY(Math.min(d.open, d.close));
              const bodyH = Math.max(1, bodyBottom - bodyTop);

              return (
                <g key={`candle-${i}`}>
                  <line
                    x1={cx}
                    y1={scaleY(d.high)}
                    x2={cx}
                    y2={scaleY(d.low)}
                    stroke={color}
                    strokeWidth={1}
                  />
                  <rect
                    x={cx - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyH}
                    fill={color}
                    stroke={color}
                    strokeWidth={0.5}
                  />
                </g>
              );
            })}

            {dataWithMA.some(d => d.ema20 !== null) && (
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth={1.5}
                points={dataWithMA
                  .map((d, i) => d.ema20 !== null ? `${scaleX(i)},${scaleY(d.ema20)}` : null)
                  .filter(Boolean)
                  .join(' ')}
              />
            )}

            {dataWithMA.some(d => d.sma200 !== null) && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.5}
                points={dataWithMA
                  .map((d, i) => d.sma200 !== null ? `${scaleX(i)},${scaleY(d.sma200)}` : null)
                  .filter(Boolean)
                  .join(' ')}
              />
            )}

            {hoverIndex !== null && (
              <line
                x1={scaleX(hoverIndex)}
                y1={chartArea.y}
                x2={scaleX(hoverIndex)}
                y2={chartArea.y + chartArea.height}
                stroke="hsl(var(--primary))"
                strokeWidth={1}
                strokeOpacity={0.3}
                strokeDasharray="4 4"
              />
            )}
          </svg>
        </div>

        {hoverData && (
          <div
            className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-xl border border-primary/20 p-4 rounded-lg shadow-2xl"
            style={{
              left: Math.min(scaleX(hoverIndex!), dimensions.width - 200),
              top: 20,
            }}
          >
            <p className="text-xs text-muted-foreground mb-3 font-sans tracking-widest uppercase border-b border-white/5 pb-2">
              {hoverData.time}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-mono">
              <span className="text-muted-foreground">Open</span>
              <span className="text-right text-foreground">{hoverData.open.toFixed(decimals)}</span>
              <span className="text-muted-foreground">High</span>
              <span className="text-right text-foreground">{hoverData.high.toFixed(decimals)}</span>
              <span className="text-muted-foreground">Low</span>
              <span className="text-right text-foreground">{hoverData.low.toFixed(decimals)}</span>
              <span className="text-muted-foreground">Close</span>
              <span className={`text-right ${hoverData.close >= hoverData.open ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                {hoverData.close.toFixed(decimals)}
              </span>
              {hoverData.ema20 && (
                <>
                  <span className="text-muted-foreground text-xs mt-2 border-t border-white/5 pt-2">EMA(20)</span>
                  <span className="text-right text-[#3b82f6] text-xs mt-2 border-t border-white/5 pt-2">{hoverData.ema20.toFixed(decimals)}</span>
                </>
              )}
              {hoverData.sma200 && (
                <>
                  <span className="text-muted-foreground text-xs">SMA(200)</span>
                  <span className="text-right text-[#f59e0b] text-xs">{hoverData.sma200.toFixed(decimals)}</span>
                </>
              )}
              <div className="col-span-2 pt-2 mt-1 border-t border-white/5 flex justify-between">
                <span className="text-muted-foreground text-xs">Vol</span>
                <span className="text-primary/80">{(hoverData.volume / 1000000).toFixed(2)}M</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
