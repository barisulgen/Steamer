import { NextRequest, NextResponse } from "next/server";
import {
  getAppDetails,
  normalizeStoreDetails,
  getSteamSpyApp,
  mergeSpyIntoEntry,
} from "@/lib/steam";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appid: string }> }
) {
  const { appid: appidStr } = await params;
  const appid = parseInt(appidStr, 10);

  if (isNaN(appid)) {
    return NextResponse.json({ error: "Invalid appid" }, { status: 400 });
  }

  try {
    const details = await getAppDetails(appid);
    if (!details) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    let entry = normalizeStoreDetails(details);

    const spyData = await getSteamSpyApp(appid);
    if (spyData) {
      entry = mergeSpyIntoEntry(entry, spyData);
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
