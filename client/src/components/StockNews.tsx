import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

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

const NEWS_PER_PAGE = 5;

export function StockNews({ symbol }: StockNewsProps) {
  const [page, setPage] = useState(1);
  const { t, lang } = useI18n();

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
    if (diffHours < 1) return t("justNow");
    if (diffHours < 24) return t("hoursAgo", { n: String(diffHours) });
    if (diffDays < 7) return t("daysAgo", { n: String(diffDays) });
    const localeMap: Record<string, string> = { en: "en-US", zh: "zh-CN", ms: "ms-MY" };
    return date.toLocaleDateString(localeMap[lang] || "en-US", { month: "short", day: "numeric" });
  };

  if (isLoading) {
    return (
      <Card className="glass-panel border-white/5">
        <CardContent className="py-8 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-primary/40 mb-2" />
          <span className="text-xs font-light">{t("loadingNews")}</span>
        </CardContent>
      </Card>
    );
  }

  if (!news || news.length === 0) return null;

  const totalPages = Math.ceil(news.length / NEWS_PER_PAGE);
  const paginated = news.slice((page - 1) * NEWS_PER_PAGE, page * NEWS_PER_PAGE);

  return (
    <Card className="glass-panel border-white/5" data-testid="card-stock-news">
      <CardHeader className="pb-3 border-b border-white/5">
        <CardTitle className="flex items-center justify-between text-[10px] text-primary uppercase tracking-widest font-medium">
          <span className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            {t("latestNews")}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed rounded border border-white/[0.06] transition-colors cursor-pointer"
                data-testid="button-news-prev"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <span className="text-[9px] text-muted-foreground/60 px-1.5 tabular-nums">
                {page}/{totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed rounded border border-white/[0.06] transition-colors cursor-pointer"
                data-testid="button-news-next"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          {paginated.map((article, i) => (
            <a
              key={`${page}-${i}`}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 p-3 rounded-lg border border-white/5 hover:border-primary/20 hover:bg-white/[0.02] transition-all group"
              data-testid={`link-news-${(page - 1) * NEWS_PER_PAGE + i}`}
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
