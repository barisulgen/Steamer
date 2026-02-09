"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { BrowseMode } from "@/types/steam";

const STEAM_GENRES = [
  "Action", "Adventure", "Casual", "Early Access", "Free to Play",
  "Indie", "Massively Multiplayer", "RPG", "Racing", "Simulation",
  "Sports", "Strategy",
];

const COMMON_TAGS = [
  "Singleplayer", "Multiplayer", "Co-op", "Open World", "Survival",
  "Sandbox", "VR", "FPS", "Third Person", "Puzzle", "Platformer",
  "Horror", "Roguelike", "Turn-Based", "Story Rich", "Atmospheric",
  "Sci-fi", "Fantasy", "Building", "Anime",
];

function formatEstimate(count: number, withTags: boolean): string {
  // Steam Store: 180 req / 5 min ≈ 1.7s each
  // SteamSpy:    4 req / 1 min  = 15s each
  // When both are fetched in parallel, bottleneck is SteamSpy (15s)
  const secondsPerGame = withTags ? 15 : 1.7;
  const totalSeconds = Math.ceil(count * secondsPerGame);
  if (totalSeconds < 60) return `~${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `~${minutes}m ${seconds}s` : `~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return remainMinutes > 0 ? `~${hours}h ${remainMinutes}m` : `~${hours}h`;
}

interface BrowsePanelProps {
  onBrowse: (mode: BrowseMode) => Promise<void>;
  onEnrich: (appids: number[], withTags?: boolean) => Promise<void>;
  isLoading: boolean;
  selectedAppIds: number[];
  allAppIds: number[];
  hasData: boolean;
}

export function BrowsePanel({
  onBrowse,
  onEnrich,
  isLoading,
  selectedAppIds,
  allAppIds,
  hasData,
}: BrowsePanelProps) {
  const [mode, setMode] = useState<string>("top100in2weeks");
  const [genreValue, setGenreValue] = useState(STEAM_GENRES[0]);
  const [tagValue, setTagValue] = useState(COMMON_TAGS[0]);
  const [customTag, setCustomTag] = useState("");
  const [withTags, setWithTags] = useState(false);

  const handleBrowse = () => {
    let browseMode: BrowseMode;
    switch (mode) {
      case "top100in2weeks":
        browseMode = { type: "top100in2weeks" };
        break;
      case "top100forever":
        browseMode = { type: "top100forever" };
        break;
      case "genre":
        browseMode = { type: "genre", genre: genreValue };
        break;
      case "tag":
        browseMode = { type: "tag", tag: customTag || tagValue };
        break;
      default:
        return;
    }
    onBrowse(browseMode);
  };

  const handleEnrich = () => {
    const ids = selectedAppIds.length > 0 ? selectedAppIds : allAppIds;
    onEnrich(ids, withTags);
  };

  const enrichCount = selectedAppIds.length > 0 ? selectedAppIds.length : allAppIds.length;
  const enrichLabel = selectedAppIds.length > 0
    ? `${selectedAppIds.length} selected`
    : "all";

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end flex-wrap">
        <div className="space-y-1.5">
          <Label>Browse Mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top100in2weeks">Top 100 (2 Weeks)</SelectItem>
              <SelectItem value="top100forever">Top 100 (All Time)</SelectItem>
              <SelectItem value="genre">By Genre</SelectItem>
              <SelectItem value="tag">By Tag</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "genre" && (
          <div className="space-y-1.5">
            <Label>Genre</Label>
            <Select value={genreValue} onValueChange={setGenreValue}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEAM_GENRES.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === "tag" && (
          <>
            <div className="space-y-1.5">
              <Label>Tag</Label>
              <Select value={tagValue} onValueChange={(v) => { setTagValue(v); setCustomTag(""); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_TAGS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Or custom tag</Label>
              <Input
                placeholder="Custom tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="w-[160px]"
              />
            </div>
          </>
        )}

        <Button onClick={handleBrowse} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch"}
        </Button>

        {hasData && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" onClick={handleEnrich} disabled={isLoading}>
                  Enrich {enrichLabel}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Fetch Steam Store details{withTags ? " + SteamSpy tags" : ""} for {enrichCount} games
                  <br />
                  Estimated: {formatEstimate(enrichCount, withTags)}
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 pb-1">
                  <Checkbox
                    id="withTags"
                    checked={withTags}
                    onCheckedChange={(v) => setWithTags(!!v)}
                  />
                  <Label htmlFor="withTags" className="text-sm cursor-pointer">
                    Include tags
                  </Label>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Also fetch SteamSpy per-app data to get tags.
                  <br />
                  Much slower due to SteamSpy rate limit (4 req/min).
                </p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </div>
  );
}
