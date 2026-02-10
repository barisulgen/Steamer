"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  type PaginationState,
  type ColumnSizingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { EditableCell } from "./EditableCell";
import { ColumnToggle } from "./ColumnToggle";
import { ExportButton } from "./ExportButton";
import { formatPlaytime } from "@/lib/utils";
import type { GameEntry } from "@/types/steam";

interface GameTableProps {
  data: GameEntry[];
  onUpdateGame: (appid: number, field: string, value: unknown) => void;
  onSelectionChange?: (selectedIds: number[]) => void;
}

export function GameTable({ data, onUpdateGame, onSelectionChange }: GameTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    discountPercent: false,
    platforms: false,
  });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const columns = useMemo<ColumnDef<GameEntry>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
          />
        ),
        enableSorting: false,
        enableResizing: false,
        size: 40,
      },
      {
        accessorKey: "headerImage",
        header: "Image",
        cell: ({ row }) => (
          <img
            src={row.original.headerImage}
            alt={row.original.name}
            className="w-[120px] h-[45px] object-cover rounded"
            loading="lazy"
          />
        ),
        enableSorting: false,
        size: 130,
      },
      {
        accessorKey: "appid",
        header: "App ID",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.appid}</span>
        ),
        size: 80,
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <a
            href={`https://store.steampowered.com/app/${row.original.appid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline font-medium"
          >
            {row.original.name}
          </a>
        ),
        size: 200,
      },
      {
        accessorKey: "developers",
        header: "Developers",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.developers.join("; ")}
            onSave={(v) =>
              onUpdateGame(
                row.original.appid,
                "developers",
                v.split(";").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        ),
        sortingFn: (a, b) =>
          (a.original.developers[0] ?? "").localeCompare(
            b.original.developers[0] ?? ""
          ),
        size: 160,
      },
      {
        accessorKey: "publishers",
        header: "Publishers",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.publishers.join("; ")}
            onSave={(v) =>
              onUpdateGame(
                row.original.appid,
                "publishers",
                v.split(";").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        ),
        sortingFn: (a, b) =>
          (a.original.publishers[0] ?? "").localeCompare(
            b.original.publishers[0] ?? ""
          ),
        size: 160,
      },
      {
        accessorKey: "websiteUrl",
        header: "Game Website",
        cell: ({ row }) => {
          const url = row.original.websiteUrl;
          if (url) {
            return (
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-xs truncate block max-w-[160px]"
                title={url}
              >
                {url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            );
          }
          return (
            <EditableCell
              value=""
              onSave={(v) => onUpdateGame(row.original.appid, "websiteUrl", v)}
            />
          );
        },
        enableSorting: false,
        size: 160,
      },
      {
        accessorKey: "developerWebsite",
        header: "Dev Website",
        cell: ({ row }) => {
          const url = row.original.developerWebsite;
          if (url) {
            return (
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-xs truncate block max-w-[160px]"
                title={url}
              >
                {url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            );
          }
          return (
            <EditableCell
              value=""
              onSave={(v) => onUpdateGame(row.original.appid, "developerWebsite", v)}
            />
          );
        },
        enableSorting: false,
        size: 160,
      },
      {
        accessorKey: "publisherWebsite",
        header: "Pub Website",
        cell: ({ row }) => {
          const url = row.original.publisherWebsite;
          if (url) {
            return (
              <a
                href={url.startsWith("http") ? url : `https://${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-xs truncate block max-w-[160px]"
                title={url}
              >
                {url.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            );
          }
          return (
            <EditableCell
              value=""
              onSave={(v) => onUpdateGame(row.original.appid, "publisherWebsite", v)}
            />
          );
        },
        enableSorting: false,
        size: 160,
      },
      {
        accessorKey: "genres",
        header: "Genres",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-0.5 max-w-[200px]">
            {row.original.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="secondary" className="text-[10px] px-1 py-0">
                {g}
              </Badge>
            ))}
            {row.original.genres.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                +{row.original.genres.length - 3}
              </Badge>
            )}
          </div>
        ),
        sortingFn: (a, b) =>
          (a.original.genres[0] ?? "").localeCompare(
            b.original.genres[0] ?? ""
          ),
        size: 160,
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-0.5 max-w-[200px]">
            {row.original.tags.slice(0, 3).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] px-1 py-0">
                {t}
              </Badge>
            ))}
            {row.original.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1 py-0">
                +{row.original.tags.length - 3}
              </Badge>
            )}
          </div>
        ),
        enableSorting: false,
        size: 160,
      },
      {
        accessorKey: "releaseDate",
        header: "Release Date",
        cell: ({ row }) => (
          <EditableCell
            value={row.original.releaseDate}
            onSave={(v) => onUpdateGame(row.original.appid, "releaseDate", v)}
          />
        ),
        size: 120,
      },
      {
        accessorKey: "priceFinalCents",
        header: "Price",
        cell: ({ row }) => {
          if (row.original.isFree) return <Badge variant="secondary">Free</Badge>;
          return (
            <EditableCell
              value={
                row.original.priceFinalCents !== null
                  ? (row.original.priceFinalCents / 100).toFixed(2)
                  : ""
              }
              onSave={(v) => {
                const cents = Math.round(parseFloat(v) * 100);
                if (!isNaN(cents)) {
                  onUpdateGame(row.original.appid, "priceFinalCents", cents);
                }
              }}
            />
          );
        },
        sortingFn: (a, b) =>
          (a.original.priceFinalCents ?? -1) - (b.original.priceFinalCents ?? -1),
        size: 80,
      },
      {
        accessorKey: "discountPercent",
        header: "Discount",
        cell: ({ row }) =>
          row.original.discountPercent > 0 ? (
            <Badge className="bg-emerald-600 text-white text-xs">
              -{row.original.discountPercent}%
            </Badge>
          ) : null,
        size: 80,
      },
      {
        id: "platforms",
        header: "Platforms",
        cell: ({ row }) => {
          const p = row.original;
          const platforms = [];
          if (p.platformWindows) platforms.push("Win");
          if (p.platformMac) platforms.push("Mac");
          if (p.platformLinux) platforms.push("Lin");
          return <span className="text-xs">{platforms.join(" / ")}</span>;
        },
        sortingFn: (a, b) => {
          const count = (g: GameEntry) =>
            +g.platformWindows + +g.platformMac + +g.platformLinux;
          return count(a.original) - count(b.original);
        },
        size: 100,
      },
      {
        accessorKey: "metacriticScore",
        header: "Metacritic",
        cell: ({ row }) => {
          const score = row.original.metacriticScore;
          if (score === null) return <span className="text-muted-foreground">-</span>;
          const color =
            score >= 75
              ? "text-emerald-400"
              : score >= 50
                ? "text-yellow-400"
                : "text-red-400";
          return <span className={`font-semibold ${color}`}>{score}</span>;
        },
        sortingFn: (a, b) =>
          (a.original.metacriticScore ?? -1) - (b.original.metacriticScore ?? -1),
        size: 90,
      },
      {
        accessorKey: "recommendations",
        header: "Reviews",
        cell: ({ row }) =>
          row.original.recommendations?.toLocaleString() ?? (
            <span className="text-muted-foreground">-</span>
          ),
        sortingFn: (a, b) =>
          (a.original.recommendations ?? -1) - (b.original.recommendations ?? -1),
        size: 90,
      },
      {
        accessorKey: "owners",
        header: "Owners",
        cell: ({ row }) => (
          <span className="text-xs" title={row.original.owners}>
            {row.original.owners || "-"}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: "ccu",
        header: "CCU",
        cell: ({ row }) =>
          row.original.ccu?.toLocaleString() ?? (
            <span className="text-muted-foreground">-</span>
          ),
        sortingFn: (a, b) =>
          (a.original.ccu ?? -1) - (b.original.ccu ?? -1),
        size: 80,
      },
      {
        accessorKey: "positiveReviews",
        header: "+Reviews",
        cell: ({ row }) =>
          row.original.positiveReviews !== null ? (
            <span className="text-emerald-400">
              {row.original.positiveReviews.toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        sortingFn: (a, b) =>
          (a.original.positiveReviews ?? -1) - (b.original.positiveReviews ?? -1),
        size: 90,
      },
      {
        accessorKey: "negativeReviews",
        header: "-Reviews",
        cell: ({ row }) =>
          row.original.negativeReviews !== null ? (
            <span className="text-red-400">
              {row.original.negativeReviews.toLocaleString()}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
        sortingFn: (a, b) =>
          (a.original.negativeReviews ?? -1) - (b.original.negativeReviews ?? -1),
        size: 90,
      },
      {
        accessorKey: "averagePlaytime",
        header: "Avg Playtime",
        cell: ({ row }) => formatPlaytime(row.original.averagePlaytime),
        sortingFn: (a, b) =>
          (a.original.averagePlaytime ?? -1) - (b.original.averagePlaytime ?? -1),
        size: 100,
      },
      {
        accessorKey: "shortDescription",
        header: "Description",
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate text-xs text-muted-foreground" title={row.original.shortDescription}>
            {row.original.shortDescription || "-"}
          </div>
        ),
        enableSorting: false,
        size: 200,
      },
    ],
    [onUpdateGame]
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    enableRowSelection: true,
    getRowId: (row) => String(row.appid),
  });

  const selectedAppIds = useMemo(() => {
    const ids = new Set<number>();
    Object.keys(rowSelection).forEach((key) => {
      if (rowSelection[key]) ids.add(Number(key));
    });
    return ids;
  }, [rowSelection]);

  useEffect(() => {
    onSelectionChange?.(Array.from(selectedAppIds));
  }, [selectedAppIds, onSelectionChange]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {data.length} games
          {selectedAppIds.size > 0 && ` (${selectedAppIds.size} selected)`}
        </div>
        <div className="flex items-center gap-2">
          <ColumnToggle table={table} />
          <ExportButton
            data={data}
            selectedCount={selectedAppIds.size}
            selectedAppIds={selectedAppIds}
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="rounded-lg border border-border/50">
        <Table style={{ width: table.getCenterTotalSize(), tableLayout: "fixed" }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-border/50 bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`relative text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none hover:bg-muted/50"
                        : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {header.column.getIsSorted() === "asc" && " \u2191"}
                      {header.column.getIsSorted() === "desc" && " \u2193"}
                    </div>
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        onClick={(e) => e.stopPropagation()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-primary/50 ${
                          header.column.getIsResizing() ? "bg-primary" : ""
                        }`}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={`border-border/30 hover:bg-muted/40 ${i % 2 === 1 ? "bg-muted/20" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-1.5"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No games loaded. Use Search or Browse to fetch data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) =>
              setPagination({ pageIndex: 0, pageSize: Number(v) })
            }
          >
            <SelectTrigger className="w-[70px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
