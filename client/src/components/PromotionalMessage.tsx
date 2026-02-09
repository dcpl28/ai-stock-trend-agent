import React from 'react';
import { Card } from "@/components/ui/card";
import { ExternalLink, TrendingUp, Briefcase, Lock, Star, ShieldCheck, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PromotionalMessage() {
  return (
    <Card className="glass-panel overflow-hidden relative border-primary/30 shadow-2xl shadow-primary/5 group transition-all duration-500 hover:shadow-primary/10 hover:border-primary/40">
      {/* Decorative Gold Sheen Animation */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
      
      <div className="p-6 relative z-10 space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase tracking-widest font-semibold mb-1">
            <Gem className="w-3 h-3" /> Remisier Privilege Service
          </div>
          <h3 className="text-2xl font-serif text-foreground leading-tight">
            Institutional-Grade <br/>
            <span className="text-primary italic">Portfolio Management</span>
          </h3>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Stop trading alone. As your dedicated Remisier, I provide the strategic oversight and risk management usually reserved for high-net-worth funds.
          </p>
        </div>

        <div className="bg-gradient-to-br from-card to-background border border-white/5 p-5 rounded-lg flex flex-col items-center gap-3 relative overflow-hidden">
          {/* Subtle background texture */}
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
          
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground z-10">Client Access Code</span>
          <div className="flex items-center gap-4 z-10">
            <div className="h-px w-8 bg-primary/30"></div>
            <code className="text-3xl font-serif tracking-widest text-primary drop-shadow-[0_0_15px_rgba(234,179,8,0.25)] font-medium">
              UBZQ
            </code>
            <div className="h-px w-8 bg-primary/30"></div>
          </div>
          <span className="text-[10px] text-primary/60 italic z-10">Valid for M+ Global Registration</span>
        </div>

        <div className="space-y-3">
          <Button 
            asChild
            className="w-full py-6 bg-primary text-primary-foreground font-medium tracking-wide hover:bg-primary/90 transition-all rounded shadow-lg shadow-primary/20 text-sm cursor-pointer"
          >
            <a href="https://mplusonline.com" target="_blank" rel="noopener noreferrer">
              Activate Priority Account
            </a>
          </Button>
          
          <a 
            href="https://dexterchia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full py-3 bg-transparent border border-primary/30 text-primary hover:bg-primary/5 transition-all rounded text-sm group"
          >
            <span>Explore Wealth Services</span>
            <ExternalLink className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2 opacity-70">
           <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
             <ShieldCheck className="w-3 h-3 text-primary" />
             <span>Regulated</span>
           </div>
           <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
             <Briefcase className="w-3 h-3 text-primary" />
             <span>Advisory</span>
           </div>
        </div>
      </div>
    </Card>
  );
}

export function AIResponseFooter() {
  return (
    <div className="mt-6 pt-4 border-t border-primary/10 text-xs text-muted-foreground font-light">
      <div className="flex gap-3">
        <div className="w-0.5 h-auto bg-gradient-to-b from-primary/50 to-transparent shrink-0"></div>
        <div className="space-y-1">
          <span className="text-primary font-medium uppercase tracking-wider text-[10px] block opacity-80">Remisier's Outlook</span>
          <p className="leading-relaxed">
            Market structure supports a bullish continuation. I recommend scaling in at current levels. 
            <br />
            <span className="opacity-80 mt-1 block">
              For personalized entry/exit points, sign up with code <strong className="text-primary font-serif">UBZQ</strong>.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
