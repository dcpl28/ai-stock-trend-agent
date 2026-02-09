import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ symbol }: { symbol: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    
    // Clear previous widget
    container.current.innerHTML = "";
    
    // Create widget structure
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.current.appendChild(widgetDiv);

    // Create script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    
    // Format symbol dynamically based on prop
    const formattedSymbol = symbol.includes("KLSE") 
      ? symbol.replace("KLSE", "MYX") 
      : symbol.includes("MYX") 
        ? symbol 
        : symbol.includes(":") ? symbol : `NASDAQ:${symbol}`;

    script.innerHTML = JSON.stringify({
      "allow_symbol_change": true,
      "calendar": false,
      "details": false,
      "hide_side_toolbar": true,
      "hide_top_toolbar": true,
      "hide_legend": true,
      "hide_volume": false,
      "hotlist": false,
      "interval": "D",
      "locale": "en",
      "save_image": false,
      "style": "1",
      "symbol": formattedSymbol,
      "theme": "dark",
      "timezone": "Asia/Kuala_Lumpur",
      "backgroundColor": "rgba(13, 16, 23, 1)", 
      "gridColor": "rgba(255, 255, 255, 0.05)",
      "watchlist": [],
      "withdateranges": false,
      "compareSymbols": [],
      "studies": [],
      "autosize": true
    });
    
    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full bg-card/40 rounded-lg overflow-hidden border border-white/5" ref={container}>
    </div>
  );
}

export default memo(TradingViewWidget);
