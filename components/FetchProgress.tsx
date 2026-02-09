"use client";

import { Button } from "@/components/ui/button";

interface FetchProgressProps {
  completed: number;
  total: number;
  failed: number;
  onStop?: () => void;
}

export function FetchProgress({ completed, total, failed, onStop }: FetchProgressProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          Fetching details: {completed} / {total}
        </span>
        <div className="flex items-center gap-3">
          {failed > 0 && (
            <span className="text-red-400">{failed} failed</span>
          )}
          <span className="text-muted-foreground font-medium">{percent}%</span>
          {onStop && (
            <Button variant="destructive" size="sm" onClick={onStop} className="h-6 px-2 text-xs">
              Stop
            </Button>
          )}
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
