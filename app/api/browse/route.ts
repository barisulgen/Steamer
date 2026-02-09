import { NextRequest, NextResponse } from "next/server";
import { getSteamSpyBulk, normalizeSteamSpyData } from "@/lib/steam";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const value = searchParams.get("value") ?? "";

  if (!mode) {
    return NextResponse.json({ error: "mode is required" }, { status: 400 });
  }

  const validModes = ["top100in2weeks", "top100forever", "genre", "tag"];
  if (!validModes.includes(mode)) {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  if ((mode === "genre" || mode === "tag") && !value) {
    return NextResponse.json(
      { error: `value is required for mode '${mode}'` },
      { status: 400 }
    );
  }

  try {
    const rawData = await getSteamSpyBulk(
      mode as "top100in2weeks" | "top100forever" | "genre" | "tag",
      value || undefined
    );
    const entries = rawData.map(normalizeSteamSpyData);

    return NextResponse.json({
      data: entries,
      meta: { total: entries.length },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Browse failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
