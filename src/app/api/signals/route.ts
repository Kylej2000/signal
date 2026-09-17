import { NextResponse } from "next/server";
import { getFeed, getFeedItem } from "@/lib/data";

export const dynamic = "force-dynamic";

/**
 * GET /api/signals            -> recent feed items (used as a fallback/poll)
 * GET /api/signals?id=<id>    -> a single feed item (used by realtime hydrate)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (id) {
    const item = await getFeedItem(id);
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ item });
  }
  const limit = Number(searchParams.get("limit") ?? 100);
  const items = await getFeed({ limit });
  return NextResponse.json({ items });
}
