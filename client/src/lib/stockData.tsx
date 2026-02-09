import React from 'react';

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const generateMockData = (symbol: string, days: number = 30): CandleData[] => {
  const data: CandleData[] = [];
  let price = 100 + Math.random() * 50;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const volatility = price * 0.02;
    const change = (Math.random() - 0.5) * volatility;
    
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 50000;
    
    data.push({
      time: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  return data;
};

// Custom Shape for Recharts to render Candlesticks
export const CandlestickShape = (props: any) => {
  const { x, width, payload, yAxis } = props;
  
  // Safety check
  if (!payload || !yAxis) return null;

  const { open, close, high, low } = payload;
  
  const isBullish = close > open;
  const color = isBullish ? 'var(--color-chart-bullish)' : 'var(--color-chart-bearish)'; // Green/Red
  
  const pixelHigh = yAxis.scale(high);
  const pixelLow = yAxis.scale(low);
  const pixelOpen = yAxis.scale(open);
  const pixelClose = yAxis.scale(close);
  
  const bodyTop = Math.min(pixelOpen, pixelClose);
  const bodyBottom = Math.max(pixelOpen, pixelClose);
  
  // Ensure minimal height for visibility if open == close
  const bodyHeight = Math.max(2, bodyBottom - bodyTop); 
  
  const center = x + width / 2;

  return (
    <g>
      {/* Wick */}
      <line 
        x1={center} 
        y1={pixelHigh} 
        x2={center} 
        y2={pixelLow} 
        stroke={color} 
        strokeWidth={1.5} 
      />
      {/* Body */}
      <rect 
        x={x} 
        y={bodyTop} 
        width={width} 
        height={bodyHeight} 
        fill={color} 
      />
    </g>
  );
};
