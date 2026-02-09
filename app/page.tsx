"use client";

import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchPanel } from "@/components/SearchPanel";
import { BrowsePanel } from "@/components/BrowsePanel";
import { GameTable } from "@/components/GameTable";
import { FilterBar } from "@/components/FilterBar";
import { FetchProgress } from "@/components/FetchProgress";
import { useGameData } from "@/hooks/useGameData";
import { Button } from "@/components/ui/button";

export default function Home() {
  const {
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
  } = useGameData();

  const allAppIds = useMemo(() => games.map((g) => g.appid), [games]);

  // Derive selected app IDs from the table's row selection
  // This is managed inside GameTable, but for BrowsePanel we pass all IDs
  const selectedAppIds: number[] = [];

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-[1600px] px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Steamer
            </h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Steam Game Data Explorer
            </span>
          </div>
          {games.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearData}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 space-y-4 max-w-[1600px]">
        {/* Search / Browse panel */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <Tabs defaultValue="browse">
            <TabsList className="bg-muted/50">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="browse">Browse</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-4">
              <SearchPanel
                onSearch={searchByName}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="browse" className="mt-4">
              <BrowsePanel
                onBrowse={browse}
                onEnrich={enrichWithDetails}
                isLoading={isLoading}
                selectedAppIds={selectedAppIds}
                allAppIds={allAppIds}
                hasData={games.length > 0}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Filters */}
        {games.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <FilterBar
              filters={filters}
              onFiltersChange={setFilters}
              games={games}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <FetchProgress
              completed={progress.completed}
              total={progress.total}
              failed={progress.failed}
              onStop={cancelEnrichment}
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && !progress && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading...
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <GameTable data={filteredGames} onUpdateGame={updateGame} />
        </div>
      </main>
    </div>
  );
}
