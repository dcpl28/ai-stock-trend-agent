import React, { useState } from "react";
import { Star, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface FavouriteButtonProps {
  symbol: string;
  displayName: string;
  isFavourited: boolean;
  onToggle: (symbol: string, displayName: string) => Promise<void>;
  locked?: boolean;
  onLockedClick?: () => void;
}

export function FavouriteButton({ symbol, displayName, isFavourited, onToggle, locked, onLockedClick }: FavouriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useI18n();

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (locked) {
      onLockedClick?.();
      return;
    }
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
      disabled={loading && !locked}
      title={locked ? t("subscribeToPremium") : isFavourited ? t("removeFromFavourites") : t("addToFavourites")}
      className={`p-1.5 rounded-lg transition-all cursor-pointer relative ${
        loading && !locked ? "opacity-50" : ""
      } ${
        locked
          ? "text-muted-foreground/30 hover:text-primary/40 hover:bg-primary/5"
          : isFavourited
          ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
          : "text-muted-foreground/40 hover:text-yellow-400 hover:bg-yellow-500/10"
      }`}
      data-testid={`button-favourite-${symbol}`}
    >
      <Star
        className={`w-4 h-4 transition-all ${isFavourited && !locked ? "fill-yellow-400" : ""}`}
        strokeWidth={isFavourited && !locked ? 2 : 1.5}
      />
      {locked && (
        <Lock className="w-2 h-2 absolute -bottom-0.5 -right-0.5 text-muted-foreground/50" />
      )}
    </button>
  );
}
