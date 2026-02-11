import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, Check } from "lucide-react";

export type AIProvider = "replit" | "openai" | "anthropic";

interface SettingsPanelProps {
  provider: AIProvider;
  apiKey: string;
  onProviderChange: (provider: AIProvider) => void;
  onApiKeyChange: (key: string) => void;
}

export function SettingsPanel({ provider, apiKey, onProviderChange, onApiKeyChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  const handleSave = () => {
    onApiKeyChange(localKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providers = [
    { id: "replit" as AIProvider, label: "Replit AI Credits", desc: "Uses built-in credits (no key needed)" },
    { id: "openai" as AIProvider, label: "OpenAI", desc: "Use your own OpenAI API key (GPT-4o)" },
    { id: "anthropic" as AIProvider, label: "Anthropic", desc: "Use your own Claude API key (Claude Sonnet)" },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
          data-testid="button-settings"
        >
          <Settings className="w-3.5 h-3.5" />
          AI Settings
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-lg font-serif">AI Provider Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Select AI Provider</Label>
            <div className="space-y-2">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onProviderChange(p.id);
                    if (p.id === "replit") {
                      setLocalKey("");
                      onApiKeyChange("");
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    provider === p.id
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  data-testid={`button-provider-${p.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                    {provider === p.id && <Check className="w-4 h-4 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {provider !== "replit" && (
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                {provider === "openai" ? "OpenAI" : "Anthropic"} API Key
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder={provider === "openai" ? "sk-..." : "sk-ant-..."}
                    className="pr-10 bg-background border-white/10 font-mono text-xs"
                    data-testid="input-api-key"
                  />
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    data-testid="button-toggle-key-visibility"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  onClick={handleSave}
                  className="px-4 cursor-pointer"
                  variant={saved ? "outline" : "default"}
                  data-testid="button-save-key"
                >
                  {saved ? <Check className="w-4 h-4 text-green-500" /> : "Save"}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Your key is stored locally in your browser only and never saved on the server.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
