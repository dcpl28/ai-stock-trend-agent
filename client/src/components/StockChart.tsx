import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { CandleData, CandlestickShape } from "@/lib/stockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StockChartProps {
  data: CandleData[];
  symbol: string;
}

export function StockChart({ data, symbol }: StockChartProps) {
  const domainMin = useMemo(() => Math.min(...data.map(d => d.low)) * 0.99, [data]);
  const domainMax = useMemo(() => Math.max(...data.map(d => d.high)) * 1.01, [data]);

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-mono tracking-tight text-primary">
            {symbol} / USD
          </CardTitle>
          <p className="text-xs text-muted-foreground">Daily Candlestick Chart</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="font-mono text-xs">1D</Badge>
          <Badge variant="secondary" className="font-mono text-xs">MA20</Badge>
          <Badge variant="secondary" className="font-mono text-xs">VOL</Badge>
        </div>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} 
              axisLine={false}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={[domainMin, domainMax]} 
              orientation="right"
              tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border p-3 rounded shadow-xl">
                      <p className="text-xs text-muted-foreground mb-2 font-mono">{label}</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
                        <span className="text-muted-foreground">Open:</span>
                        <span className="text-right text-foreground">{d.open.toFixed(2)}</span>
                        <span className="text-muted-foreground">High:</span>
                        <span className="text-right text-foreground">{d.high.toFixed(2)}</span>
                        <span className="text-muted-foreground">Low:</span>
                        <span className="text-right text-foreground">{d.low.toFixed(2)}</span>
                        <span className="text-muted-foreground">Close:</span>
                        <span className={d.close > d.open ? "text-right text-[hsl(var(--chart-bullish))]" : "text-right text-[hsl(var(--chart-bearish))]"}>
                          {d.close.toFixed(2)}
                        </span>
                        <span className="text-muted-foreground mt-2">Vol:</span>
                        <span className="text-right text-foreground mt-2">{(d.volume / 1000).toFixed(1)}K</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* The Invisible Bar that drives the custom shape */}
            <Bar 
              dataKey="close" 
              shape={<CandlestickShape />} 
              isAnimationActive={false}
            >
              {
                data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.close > entry.open ? 'var(--color-chart-bullish)' : 'var(--color-chart-bearish)'} />
                ))
              }
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
