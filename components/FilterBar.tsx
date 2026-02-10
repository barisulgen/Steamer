"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SearchFilters, GameEntry } from "@/types/steam";
import { STEAM_GENRES, COMMON_TAGS } from "@/lib/constants";

interface FilterBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  games: GameEntry[];
}

export function FilterBar({ filters, onFiltersChange, games }: FilterBarProps) {
  const [showMore, setShowMore] = useState(false);

  const hasGenreData = useMemo(
    () => games.some((g) => g.genres.length > 0),
    [games]
  );
  const hasTagData = useMemo(
    () => games.some((g) => g.tags.length > 0),
    [games]
  );

  const updateFilter = (key: keyof SearchFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const parseCommaList = (value: string): string[] => {
    return value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const toggleGenre = (genre: string) => {
    const current = filters.genres ?? [];
    const updated = current.includes(genre)
      ? current.filter((g) => g !== genre)
      : [...current, genre];
    onFiltersChange({ ...filters, genres: updated.length > 0 ? updated : undefined });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags ?? [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    onFiltersChange({ ...filters, tags: updated.length > 0 ? updated : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="space-y-3">
      {/* Top row: quick filters */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Name</Label>
          <Input
            placeholder="Filter by name..."
            className="h-8 w-[180px] text-sm"
            value={filters.query ?? ""}
            onChange={(e) =>
              updateFilter("query", e.target.value || undefined)
            }
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Developer</Label>
          <Input
            placeholder="Filter by developer..."
            className="h-8 w-[180px] text-sm"
            value={filters.developers?.join(", ") ?? ""}
            onChange={(e) =>
              updateFilter(
                "developers",
                e.target.value ? parseCommaList(e.target.value) : undefined
              )
            }
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Publisher</Label>
          <Input
            placeholder="Filter by publisher..."
            className="h-8 w-[180px] text-sm"
            value={filters.publishers?.join(", ") ?? ""}
            onChange={(e) =>
              updateFilter(
                "publishers",
                e.target.value ? parseCommaList(e.target.value) : undefined
              )
            }
          />
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-1">
              <Label
                className={`text-xs ${hasGenreData ? "text-muted-foreground" : "text-muted-foreground/40"}`}
              >
                Genre
              </Label>
              <Input
                placeholder="Filter by genre..."
                className={`h-8 w-[180px] text-sm ${!hasGenreData ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={!hasGenreData}
                value={filters.genres?.join(", ") ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "genres",
                    e.target.value ? parseCommaList(e.target.value) : undefined
                  )
                }
              />
            </div>
          </TooltipTrigger>
          {!hasGenreData && (
            <TooltipContent>
              <p>Genre data is not available yet. Enrich the data with Steam Store details to enable genre filtering.</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="space-y-1">
              <Label
                className={`text-xs ${hasTagData ? "text-muted-foreground" : "text-muted-foreground/40"}`}
              >
                Tag
              </Label>
              <Input
                placeholder="Filter by tag..."
                className={`h-8 w-[180px] text-sm ${!hasTagData ? "opacity-40 cursor-not-allowed" : ""}`}
                disabled={!hasTagData}
                value={filters.tags?.join(", ") ?? ""}
                onChange={(e) =>
                  updateFilter(
                    "tags",
                    e.target.value ? parseCommaList(e.target.value) : undefined
                  )
                }
              />
            </div>
          </TooltipTrigger>
          {!hasTagData && (
            <TooltipContent>
              <p>Tag data is not available yet. Enrich the data with SteamSpy per-app details to enable tag filtering.</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Button variant="ghost" size="sm" className="h-8" onClick={clearFilters}>
          Clear
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? "Less filters" : "More filters"}
        </Button>
      </div>

      {/* Expanded filters */}
      {showMore && (
        <>
          <Separator className="opacity-50" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Price Range ($)</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin ?? ""}
                  onChange={(e) =>
                    updateFilter("priceMin", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-24 h-8 text-sm"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax ?? ""}
                  onChange={(e) =>
                    updateFilter("priceMax", e.target.value ? parseFloat(e.target.value) : undefined)
                  }
                  className="w-24 h-8 text-sm"
                />
              </div>
            </div>

            {/* Release date range */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Release Date</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="date"
                  value={filters.releaseDateFrom ?? ""}
                  onChange={(e) =>
                    updateFilter("releaseDateFrom", e.target.value || undefined)
                  }
                  className="w-36 h-8 text-sm"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={filters.releaseDateTo ?? ""}
                  onChange={(e) =>
                    updateFilter("releaseDateTo", e.target.value || undefined)
                  }
                  className="w-36 h-8 text-sm"
                />
              </div>
            </div>

            {/* Platform checkboxes */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Platforms</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={filters.platformWindows ?? false}
                    onCheckedChange={(c) =>
                      updateFilter("platformWindows", c === true || undefined)
                    }
                  />
                  Windows
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={filters.platformMac ?? false}
                    onCheckedChange={(c) =>
                      updateFilter("platformMac", c === true || undefined)
                    }
                  />
                  Mac
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={filters.platformLinux ?? false}
                    onCheckedChange={(c) =>
                      updateFilter("platformLinux", c === true || undefined)
                    }
                  />
                  Linux
                </label>
              </div>
            </div>

            {/* Other toggles */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Other</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={filters.isFree ?? false}
                    onCheckedChange={(c) =>
                      updateFilter("isFree", c === true || undefined)
                    }
                  />
                  Free only
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <Checkbox
                    checked={filters.onlyDiscounted ?? false}
                    onCheckedChange={(c) =>
                      updateFilter("onlyDiscounted", c === true || undefined)
                    }
                  />
                  On sale
                </label>
              </div>
            </div>
          </div>

          {/* Genre badges */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Genres</Label>
            <div className="flex flex-wrap gap-1.5">
              {STEAM_GENRES.map((genre) => (
                <Badge
                  key={genre}
                  variant={filters.genres?.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tag badges */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={filters.tags?.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
