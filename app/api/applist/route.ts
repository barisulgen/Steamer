import { NextResponse } from "next/server";
import { getAppList } from "@/lib/steam";

export async function GET() {
  try {
    const apps = await getAppList();
    return NextResponse.json({ data: apps, meta: { total: apps.length } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch app list";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
