"use client";

import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/lib/csv";
import type { GameEntry } from "@/types/steam";

interface ExportButtonProps {
  data: GameEntry[];
  selectedCount: number;
  selectedAppIds: Set<number>;
}

export function ExportButton({
  data,
  selectedCount,
  selectedAppIds,
}: ExportButtonProps) {
  const handleExport = () => {
    const toExport =
      selectedCount > 0
        ? data.filter((g) => selectedAppIds.has(g.appid))
        : data;

    if (toExport.length === 0) return;

    const timestamp = new Date().toISOString().slice(0, 10);
    exportToCsv(toExport, `steamer_export_${timestamp}.csv`);
  };

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      Export CSV{" "}
      {selectedCount > 0
        ? `(${selectedCount} selected)`
        : `(${data.length} rows)`}
    </Button>
  );
}
