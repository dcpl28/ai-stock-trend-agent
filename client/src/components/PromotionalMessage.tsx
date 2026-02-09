import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Briefcase, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromotionalMessage() {
  return (
    <Card className="glass-panel overflow-hidden relative border-primary/30 shadow-2xl shadow-primary/5">
      {/* Decorative Gold Sheen */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
      
      <div className="p-6 relative z-10 space-y-6">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase tracking-widest font-semibold mb-2">
            <Star className="w-3 h-3 fill-primary" /> Invitation Only
          </div>
          <h3 className="text-2xl font-serif text-foreground">
            M+ Global <span className="text-primary italic">Privilege</span>
          </h3>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Elevate your trading experience. Join my exclusive circle of clients for priority insights and lower brokerage fees.
          </p>
        </div>

        <div className="bg-gradient-to-br from-card to-background border border-white/5 p-5 rounded flex flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Your Access Code</span>
          <code className="text-3xl font-serif tracking-widest text-primary drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">
            UBZQ
          </code>
        </div>

        <div className="space-y-3">
          <a 
            href="https://mplusonline.com" // Assuming general link, user can change
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 bg-primary text-primary-foreground font-medium tracking-wide hover:bg-primary/90 transition-all rounded shadow-lg shadow-primary/20 text-sm"
          >
            Claim Privilege Access
          </a>
          
          <a 
            href="https://dexterchia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 bg-transparent border border-primary/30 text-primary hover:bg-primary/5 transition-all rounded text-sm group"
          >
            <span>Visit DexterChia.com</span>
            <ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
        
        <div className="flex items-center justify-center gap-2 pt-2 opacity-60">
           <Briefcase className="w-3 h-3 text-primary" />
           <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Discretionary Trading Available</span>
        </div>
      </div>
    </Card>
  );
}

export function AIResponseFooter() {
  return (
    <div className="mt-6 pt-4 border-t border-primary/10 text-xs text-muted-foreground font-light">
      <div className="flex gap-2">
        <div className="w-1 h-full bg-primary/50 rounded-full shrink-0"></div>
        <p>
          <span className="text-primary font-medium uppercase tracking-wider text-[10px] block mb-1">Recommendation Engine</span>
          Analysis indicates strong bullish continuation. Secure your position. 
          Use code <strong className="text-primary font-serif px-1">UBZQ</strong> on M+ Global.
        </p>
      </div>
    </div>
  );
}
