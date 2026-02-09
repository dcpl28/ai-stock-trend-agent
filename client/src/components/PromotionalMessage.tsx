import React from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Briefcase } from "lucide-react";

export function PromotionalMessage() {
  return (
    <Card className="mt-6 border-l-4 border-l-primary bg-secondary/30 p-4 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <TrendingUp className="w-24 h-24" />
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            🚀 M+ Global Exclusive Access
          </h3>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Unlock premium market insights and lower brokerage fees. Sign up for the 
            <span className="font-bold text-foreground mx-1">M+ Global App</span> 
            using my Invitation Code:
          </p>
          <div className="flex items-center gap-3">
            <code className="bg-primary/20 text-primary px-3 py-1 rounded-md font-mono font-bold text-lg border border-primary/30">
              UBZQ
            </code>
            <span className="text-sm text-muted-foreground">
              to enjoy my privilege remisier service.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 border-t border-border/30 pt-2">
            <Briefcase className="w-3 h-3 text-primary" />
            <span>Now offering Discretionary Trading & Client Portfolio Management for KLSE stocks.</span>
          </div>
        </div>
        
        <div className="flex flex-col gap-2 shrink-0">
          <a 
            href="https://dexterchia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors text-sm shadow-lg shadow-primary/20"
          >
            Visit dexterchia.com <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Card>
  );
}

export function AIResponseFooter() {
  return (
    <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground font-mono">
      <p>
        <span className="text-primary">SYSTEM_MSG:</span> Optimization suggests bullish continuation.
        Don't miss the move. Sign up M+ Global with code <strong className="text-foreground">UBZQ</strong>.
        More info at <a href="https://dexterchia.com" target="_blank" className="underline hover:text-primary transition-colors">dexterchia.com</a>
      </p>
    </div>
  );
}
