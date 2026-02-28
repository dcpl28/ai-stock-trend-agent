import React, { useState } from "react";
import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FavouriteButtonProps {
  symbol: string;
  displayName: string;
  isFavourited: boolean;
  onToggle: (symbol: string, displayName: string) => Promise<void>;
}

export function FavouriteButton({ symbol, displayName, isFavourited, onToggle }: FavouriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      await onToggle(symbol, displayName);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      title={isFavourited ? t("removeFromFavourites") : t("addToFavourites")}
      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
        loading ? "opacity-50" : ""
      } ${
        isFavourited
          ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
          : "text-muted-foreground/40 hover:text-yellow-400 hover:bg-yellow-500/10"
      }`}
      data-testid={`button-favourite-${symbol}`}
    >
      <Star
        className={`w-4 h-4 transition-all ${isFavourited ? "fill-yellow-400" : ""}`}
        strokeWidth={isFavourited ? 2 : 1.5}
      />
    </button>
  );
}
