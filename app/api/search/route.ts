import { NextRequest, NextResponse } from "next/server";
import { getAppList, getAppDetails, normalizeStoreDetails } from "@/lib/steam";
import type { GameEntry } from "@/types/steam";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.toLowerCase() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const fetchDetails = searchParams.get("details") === "true";

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const allApps = await getAppList();

    // Score-based matching: exact > starts with > contains
    const scored = allApps
      .filter((app) => app.name.toLowerCase().includes(query))
      .map((app) => ({
        ...app,
        score:
          app.name.toLowerCase() === query
            ? 0
            : app.name.toLowerCase().startsWith(query)
              ? 1
              : 2,
      }))
      .sort((a, b) => a.score - b.score || a.name.length - b.name.length)
      .slice(0, limit);

    if (!fetchDetails) {
      return NextResponse.json({
        data: scored.map((s) => ({ appid: s.appid, name: s.name })),
        meta: { total: scored.length },
      });
    }

    const entries: GameEntry[] = [];
    const errors: string[] = [];

    for (const app of scored) {
      try {
        const details = await getAppDetails(app.appid);
        if (details) {
          entries.push(normalizeStoreDetails(details));
        } else {
          errors.push(`App ${app.appid} (${app.name}): not found`);
        }
      } catch {
        errors.push(`App ${app.appid} (${app.name}): fetch failed`);
      }
    }

    return NextResponse.json({
      data: entries,
      meta: { total: entries.length, errors: errors.length > 0 ? errors : undefined },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
