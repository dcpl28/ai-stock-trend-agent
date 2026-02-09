import React, { useMemo } from 'react';
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CandleData, CandlestickShape } from "@/lib/stockData";
import { Card, CardContent } from "@/components/ui/card";

interface StockChartProps {
  data: CandleData[];
  symbol: string;
}

export function StockChart({ data, symbol }: StockChartProps) {
  const domainMin = useMemo(() => Math.min(...data.map(d => d.low)) * 0.99, [data]);
  const domainMax = useMemo(() => Math.max(...data.map(d => d.high)) * 1.01, [data]);
  
  // Calculate Moving Averages
  const dataWithMA = useMemo(() => {
    return data.map((item, index, array) => {
      const ma20 = index >= 19 
        ? array.slice(index - 19, index + 1).reduce((sum, d) => sum + d.close, 0) / 20 
        : null;
        
      const ma200 = index >= 199
        ? array.slice(index - 199, index + 1).reduce((sum, d) => sum + d.close, 0) / 200
        : null; // Won't show for short datasets, which is correct
        
      return { ...item, ma20, ma200 };
    });
  }, [data]);

  return (
    <Card className="w-full bg-transparent border-none shadow-none">
      <CardContent className="h-[450px] w-full p-0">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={dataWithMA}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Elegant, subtle grid */}
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--primary))" opacity={0.1} vertical={false} />
            
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'var(--font-sans)' }} 
              axisLine={{ stroke: 'hsl(var(--primary))', opacity: 0.1 }}
              tickLine={false}
              minTickGap={40}
              dy={10}
            />
            
            <YAxis 
              domain={[domainMin, domainMax]} 
              orientation="right"
              tick={{ fontSize: 11, fill: 'hsl(var(--primary))', fontFamily: 'var(--font-mono)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value.toFixed(2)}
              dx={10}
            />
            
            <Tooltip 
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, opacity: 0.3, strokeDasharray: '4 4' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  const isUp = d.close > d.open;
                  return (
                    <div className="bg-card/95 backdrop-blur-xl border border-primary/20 p-4 rounded-lg shadow-2xl">
                      <p className="text-xs text-muted-foreground mb-3 font-sans tracking-widest uppercase border-b border-white/5 pb-2">{label}</p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm font-mono">
                        <span className="text-muted-foreground">Open</span>
                        <span className="text-right text-foreground">{d.open.toFixed(2)}</span>
                        <span className="text-muted-foreground">High</span>
                        <span className="text-right text-foreground">{d.high.toFixed(2)}</span>
                        <span className="text-muted-foreground">Low</span>
                        <span className="text-right text-foreground">{d.low.toFixed(2)}</span>
                        <span className="text-muted-foreground">Close</span>
                        <span className={`text-right ${isUp ? "text-[hsl(var(--chart-bullish))]" : "text-[hsl(var(--chart-bearish))]"}`}>
                          {d.close.toFixed(2)}
                        </span>
                        
                        {d.ma20 && (
                          <>
                            <span className="text-muted-foreground text-xs mt-2 border-t border-white/5 pt-2">MA(20)</span>
                            <span className="text-right text-[#3b82f6] text-xs mt-2 border-t border-white/5 pt-2">{d.ma20.toFixed(2)}</span>
                          </>
                        )}
                        
                        <div className="col-span-2 pt-2 mt-1 border-t border-white/5 flex justify-between">
                          <span className="text-muted-foreground text-xs">Vol</span>
                          <span className="text-primary/80">{(d.volume / 1000).toFixed(1)}K</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            <Bar 
              dataKey="close" 
              shape={<CandlestickShape />} 
              isAnimationActive={true}
              animationDuration={1500}
            >
              {
                data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.close > entry.open ? 'hsl(var(--chart-bullish))' : 'hsl(var(--chart-bearish))'} 
                    stroke={entry.close > entry.open ? 'hsl(var(--chart-bullish))' : 'hsl(var(--chart-bearish))'}
                  />
                ))
              }
            </Bar>
            
            {/* MA Lines */}
            <Line 
              type="monotone" 
              dataKey="ma20" 
              stroke="#3b82f6" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={false} 
              isAnimationActive={true}
            />
             <Line 
              type="monotone" 
              dataKey="ma200" 
              stroke="#f59e0b" 
              strokeWidth={1.5} 
              dot={false} 
              activeDot={false} 
              isAnimationActive={true}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
