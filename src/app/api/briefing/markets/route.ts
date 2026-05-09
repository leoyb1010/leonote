import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { getLiveMarketSnapshots } from "@/lib/briefing/live-market";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("refresh") === "1";
  const marketState = await getLiveMarketSnapshots({ force });

  return NextResponse.json({
    ok: true,
    markets: marketState.markets,
    marketStatus: {
      refreshed: marketState.refreshed,
      stale: marketState.stale,
      error: marketState.error,
    },
  });
}
