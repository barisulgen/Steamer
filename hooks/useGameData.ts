"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { GameEntry, SearchFilters, BrowseMode } from "@/types/steam";

interface UseGameDataReturn {
  games: GameEntry[];
  filteredGames: GameEntry[];
  isLoading: boolean;
  error: string | null;
  progress: { completed: number; total: number; failed: number } | null;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  searchByName: (query: string, limit?: number) => Promise<void>;
  browse: (mode: BrowseMode) => Promise<void>;
  enrichWithDetails: (appids: number[], withTags?: boolean) => Promise<void>;
  updateGame: (appid: number, field: string, value: unknown) => void;
  clearData: () => void;
  cancelEnrichment: () => void;
}

function parseReleaseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;
  // Try "DD Mon, YYYY" format common from Steam
  const match = dateStr.match(/(\d{1,2})\s+(\w+),?\s+(\d{4})/);
  if (match) {
    const attempt = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
    if (!isNaN(attempt.getTime())) return attempt;
  }
  return null;
}

export function useGameData(): UseGameDataReturn {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    completed: number;
    total: number;
    failed: number;
  } | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({});
  const enrichAbortRef = useRef<AbortController | null>(null);

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (filters.query) {
        const q = filters.query.toLowerCase();
        if (!game.name.toLowerCase().includes(q)) return false;
      }
      if (filters.genres && filters.genres.length > 0) {
        const genreLower = filters.genres.map((g) => g.toLowerCase());
        if (
          !game.genres.some((g) =>
            genreLower.some((fg) => g.toLowerCase().includes(fg))
          )
        )
          return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const tagLower = filters.tags.map((t) => t.toLowerCase());
        if (
          !game.tags.some((t) =>
            tagLower.some((ft) => t.toLowerCase().includes(ft))
          )
        )
          return false;
      }
      if (filters.developers && filters.developers.length > 0) {
        const devLower = filters.developers.map((d) => d.toLowerCase());
        if (
          !game.developers.some((d) =>
            devLower.some((fd) => d.toLowerCase().includes(fd))
          )
        )
          return false;
      }
      if (filters.publishers && filters.publishers.length > 0) {
        const pubLower = filters.publishers.map((p) => p.toLowerCase());
        if (
          !game.publishers.some((p) =>
            pubLower.some((fp) => p.toLowerCase().includes(fp))
          )
        )
          return false;
      }
      if (filters.releaseDateFrom) {
        const gameDate = parseReleaseDate(game.releaseDate);
        const fromDate = new Date(filters.releaseDateFrom);
        if (gameDate && gameDate < fromDate) return false;
      }
      if (filters.releaseDateTo) {
        const gameDate = parseReleaseDate(game.releaseDate);
        const toDate = new Date(filters.releaseDateTo);
        if (gameDate && gameDate > toDate) return false;
      }
      if (filters.priceMin !== undefined && filters.priceMin > 0) {
        const priceDollars =
          game.priceFinalCents !== null ? game.priceFinalCents / 100 : null;
        if (priceDollars === null || priceDollars < filters.priceMin)
          return false;
      }
      if (filters.priceMax !== undefined) {
        const priceDollars =
          game.priceFinalCents !== null ? game.priceFinalCents / 100 : null;
        if (priceDollars === null || priceDollars > filters.priceMax)
          return false;
      }
      if (filters.platformWindows && !game.platformWindows) return false;
      if (filters.platformMac && !game.platformMac) return false;
      if (filters.platformLinux && !game.platformLinux) return false;
      if (filters.isFree && !game.isFree) return false;
      if (filters.onlyDiscounted && game.discountPercent <= 0) return false;

      return true;
    });
  }, [games, filters]);

  const searchByName = useCallback(
    async (query: string, limit: number = 50) => {
      setIsLoading(true);
      setError(null);
      setProgress(null);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&details=true&limit=${limit}`
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Search failed");
        setGames(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Search failed");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const browse = useCallback(async (mode: BrowseMode) => {
    setIsLoading(true);
    setError(null);
    setProgress(null);
    try {
      let url = `/api/browse?mode=${mode.type}`;
      if ("genre" in mode) url += `&value=${encodeURIComponent(mode.genre)}`;
      if ("tag" in mode) url += `&value=${encodeURIComponent(mode.tag)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Browse failed");
      setGames(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Browse failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const enrichWithDetails = useCallback(async (appids: number[], withTags = false) => {
    if (appids.length === 0) return;

    enrichAbortRef.current?.abort();
    const controller = new AbortController();
    enrichAbortRef.current = controller;

    setProgress({ completed: 0, total: appids.length, failed: 0 });

    try {
      const res = await fetch(`/api/apps/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: appids, withTags }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        throw new Error("Stream request failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const dataLine = line.trim();
          if (!dataLine.startsWith("data: ")) continue;
          const jsonStr = dataLine.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "app") {
              setGames((prev) =>
                prev.map((g) => {
                  if (g.appid !== event.entry.appid) return g;
                  const enriched = event.entry;
                  return {
                    ...g,
                    ...enriched,
                    // Preserve SteamSpy data when Store API doesn't provide it
                    tags: enriched.tags?.length > 0 ? enriched.tags : g.tags,
                    owners: enriched.owners || g.owners,
                    ccu: enriched.ccu ?? g.ccu,
                    positiveReviews: enriched.positiveReviews ?? g.positiveReviews,
                    negativeReviews: enriched.negativeReviews ?? g.negativeReviews,
                    averagePlaytime: enriched.averagePlaytime ?? g.averagePlaytime,
                    detailLevel: "full" as const,
                  };
                })
              );
            } else if (event.type === "progress") {
              setProgress({
                completed: event.completed,
                total: event.total,
                failed: event.failed,
              });
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Enrichment failed");
    } finally {
      enrichAbortRef.current = null;
      setProgress(null);
    }
  }, []);

  const cancelEnrichment = useCallback(() => {
    enrichAbortRef.current?.abort();
    enrichAbortRef.current = null;
    setProgress(null);
  }, []);

  const updateGame = useCallback(
    (appid: number, field: string, value: unknown) => {
      setGames((prev) =>
        prev.map((g) => (g.appid === appid ? { ...g, [field]: value } : g))
      );
    },
    []
  );

  const clearData = useCallback(() => {
    setGames([]);
    setError(null);
    setProgress(null);
    setFilters({});
  }, []);

  return {
    games,
    filteredGames,
    isLoading,
    error,
    progress,
    filters,
    setFilters,
    searchByName,
    browse,
    enrichWithDetails,
    updateGame,
    clearData,
    cancelEnrichment,
  };
}
