import { NextRequest, NextResponse } from "next/server";
import {
  getAppDetails,
  normalizeStoreDetails,
  getSteamSpyApp,
  mergeSpyIntoEntry,
} from "@/lib/steam";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids");
  const enrichSpy = searchParams.get("steamspy") === "true";

  if (!idsParam) {
    return NextResponse.json(
      { error: "ids parameter required (comma-separated appids)" },
      { status: 400 }
    );
  }

  const ids = idsParam
    .split(",")
    .map(Number)
    .filter((n) => !isNaN(n));

  if (ids.length > 100) {
    return NextResponse.json(
      { error: "Maximum 100 apps per request" },
      { status: 400 }
    );
  }

  try {
    const results = [];
    const errors: string[] = [];

    for (const id of ids) {
      try {
        const details = await getAppDetails(id);
        if (details) {
          let entry = normalizeStoreDetails(details);
          if (enrichSpy) {
            const spyData = await getSteamSpyApp(id);
            if (spyData) {
              entry = mergeSpyIntoEntry(entry, spyData);
            }
          }
          results.push(entry);
        } else {
          errors.push(`App ${id}: not found`);
        }
      } catch {
        errors.push(`App ${id}: fetch failed`);
      }
    }

    return NextResponse.json({
      data: results,
      meta: {
        total: ids.length,
        fetched: results.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Batch fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
