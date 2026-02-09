"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchPanelProps {
  onSearch: (query: string, limit?: number) => Promise<void>;
  isLoading: boolean;
}

export function SearchPanel({
  onSearch,
  isLoading,
}: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState(50);

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    onSearch(searchQuery.trim(), searchLimit);
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="Search games by name..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="flex-1"
      />
      <Input
        type="number"
        value={searchLimit}
        onChange={(e) => setSearchLimit(Math.min(200, Math.max(1, parseInt(e.target.value) || 50)))}
        className="w-20"
        title="Max results"
      />
      <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()}>
        {isLoading ? "Searching..." : "Search"}
      </Button>
    </div>
  );
}
