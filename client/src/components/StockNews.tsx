import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, ExternalLink, Loader2 } from "lucide-react";

interface NewsArticle {
  title: string;
  publisher: string;
  link: string;
  publishedAt: string | null;
  thumbnail: string | null;
}

interface StockNewsProps {
  symbol: string;
}

export function StockNews({ symbol }: StockNewsProps) {
  const { data: news, isLoading } = useQuery<NewsArticle[]>({
    queryKey: ["/api/news", symbol],
    queryFn: async () => {
      const res = await fetch(`/api/news/${encodeURIComponent(symbol)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!symbol,
    staleTime: 5 * 60 * 1000,
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className="glass-panel border-white/5">
        <CardContent className="py-8 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary/40 mb-2" />
          <span className="text-xs font-light">Loading news...</span>
        </CardContent>
      </Card>
    );
  }

  if (!news || news.length === 0) return null;

  return (
    <Card className="glass-panel border-white/5" data-testid="card-stock-news">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="flex items-center gap-2 text-2xl font-serif">
          <Newspaper className="w-5 h-5 text-primary" />
          Latest News
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {news.map((article, i) => (
            <a
              key={i}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 rounded-lg border border-white/5 hover:border-primary/20 hover:bg-white/[0.02] transition-all group"
              data-testid={`link-news-${i}`}
            >
              {article.thumbnail && (
                <img
                  src={article.thumbnail}
                  alt=""
                  className="w-16 h-16 rounded object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm text-foreground/90 font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                  <ExternalLink className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-60 transition-opacity" />
                </h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{article.publisher}</span>
                  {article.publishedAt && (
                    <>
                      <span className="text-muted-foreground/30">·</span>
                      <span className="text-[10px] text-muted-foreground/60">{formatDate(article.publishedAt)}</span>
                    </>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
