# Steamer

A single-user web tool for fetching, browsing, filtering, editing, and exporting Steam game data. Built with Next.js, TanStack Table, and shadcn/ui.

![steamer-logo](https://github.com/user-attachments/assets/060c2ab0-15ee-417f-9d45-abe02c19c188)

## Features

- **Search** — Find games by name using the Steam app list, with configurable result limits
- **Browse** — Fetch bulk game data from SteamSpy by Top 100 (2 weeks / all time), genre, or tag
- **Enrich** — Upgrade SteamSpy rows with full Steam Store details (genres, metacritic, descriptions, etc.) via streaming SSE updates
- **Optional tag fetching** — Fetch SteamSpy per-app data for tags (slower due to 4 req/min rate limit), with estimated time shown before starting
- **Filter** — Client-side filtering by name, developer, publisher, genre, tag, price range, release date, platforms, free/discounted status, and clickable genre/tag badges
- **Sort & paginate** — Column sorting, configurable page sizes, column resizing
- **Inline editing** — Double-click any cell to edit. Edits persist through sorting/filtering and are included in CSV export
- **Column visibility** — Show/hide columns via dropdown
- **CSV export** — Export all rows or selected rows with edits included
- **Row selection** — Checkbox selection for targeted enrichment or export

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **TanStack Table v8** — data grid with sorting, filtering, pagination, editable cells, column resizing
- **Tailwind CSS v4 + shadcn/ui** — dark theme, New York style
- **PapaParse** — CSV export
- **Radix UI** — tooltips, dropdowns, selects, checkboxes

## APIs Used

| API | Purpose | Rate Limit |
|-----|---------|------------|
| Steam Web API (`api.steampowered.com`) | App list (appid + name) | Requires API key |
| Steam Store API (`store.steampowered.com/api/appdetails`) | Per-app details (genres, price, metacritic, platforms, etc.) | ~180 req / 5 min |
| SteamSpy API (`steamspy.com/api.php`) | Bulk data (owners, playtime, reviews) + per-app tags | 4 req / min |

All API calls are proxied through Next.js API routes to avoid CORS issues, secure the API key, and enforce rate limiting.

## Getting Started

### Prerequisites

- Node.js 18+
- A Steam Web API key ([get one here](https://steamcommunity.com/dev/apikey))

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
# Edit .env.local and add your Steam API key:
# STEAM_API_KEY=your_key_here

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
steamer/
├── app/
│   ├── layout.tsx                    # Root layout (dark theme, fonts, providers)
│   ├── page.tsx                      # Main page (tabs, filters, table)
│   └── api/
│       ├── applist/route.ts          # Full Steam app list (cached 24h)
│       ├── search/route.ts           # Name search with fuzzy scoring
│       ├── browse/route.ts           # SteamSpy bulk (top100, genre, tag)
│       ├── apps/route.ts             # Bulk app details by IDs
│       ├── apps/[appid]/route.ts     # Single app detail
│       └── apps/stream/route.ts      # SSE streaming enrichment
├── components/
│   ├── SearchPanel.tsx               # Search bar
│   ├── BrowsePanel.tsx               # Browse mode selector + enrich controls
│   ├── FilterBar.tsx                 # All filter controls (quick + expanded)
│   ├── GameTable.tsx                 # Data table with all columns
│   ├── EditableCell.tsx              # Double-click-to-edit cell
│   ├── ColumnToggle.tsx              # Show/hide columns dropdown
│   ├── ExportButton.tsx              # CSV export button
│   └── FetchProgress.tsx             # Progress bar for bulk fetches
├── hooks/
│   ├── useGameData.ts                # Central state management
│   └── useDebounce.ts                # Debounce utility
├── lib/
│   ├── steam.ts                      # Steam API client + normalization
│   ├── rate-limiter.ts               # Token-bucket rate limiter
│   ├── cache.ts                      # In-memory LRU cache (30min TTL)
│   ├── csv.ts                        # CSV generation
│   └── utils.ts                      # Formatting helpers
└── types/
    └── steam.ts                      # All TypeScript interfaces
```

## Architecture Notes

- **Server-side rate limiting** — Token-bucket limiters prevent hitting API rate limits (180/5min for Steam Store, 4/min for SteamSpy)
- **In-memory LRU cache** — App details cached for 30 minutes to avoid redundant API calls
- **SSE streaming** — Bulk enrichment streams results row-by-row so the table updates in real-time with a progress bar and stop button
- **Client-side filtering** — All filters run in-memory via `useMemo` for instant results without extra API calls
- **Edits are in-memory** — Modified cells persist through sorting/filtering and export, but are lost on page refresh
