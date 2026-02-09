import React, { useEffect, useRef, memo } from 'react';

export default function TradingViewChart({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up previous script if it exists
    if (container.current) {
      container.current.innerHTML = "";
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Format symbol for TradingView (e.g., "KLSE:MAYBANK")
    const formattedSymbol = symbol.includes("KLSE") ? symbol : `NASDAQ:${symbol}`;

    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": formattedSymbol,
      "interval": "D",
      "timezone": "Asia/Kuala_Lumpur",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "backgroundColor": "rgba(13, 16, 23, 1)", 
      "gridColor": "rgba(255, 255, 255, 0.05)",
      "hide_top_toolbar": false,
      "hide_legend": false,
      "save_image": false,
      "calendar": false,
      "hide_volume": true,
      "support_host": "https://www.tradingview.com"
    });

    if (container.current) {
      container.current.appendChild(script);
    }
  }, [symbol]);

  return (
    <div className="h-[500px] w-full bg-card/40 rounded-lg overflow-hidden border border-white/5 relative z-0" ref={container}>
      <div className="tradingview-widget-container__widget h-full w-full"></div>
    </div>
  );
}
