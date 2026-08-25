import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { sql } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

type TradeItem = {
  ticker: string;
  exchange: string;
  quantity: number;
  price: number;
};

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("stock_analyzer_session")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Login required." },
        { status: 401 }
      );
    }

    const payload =
      await verifySessionToken(token);

    const nickname =
      String(payload.nickname ?? "");

    const userId =
      String(payload.userId ?? "");

    if (!nickname || !userId) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const body =
      await request.json();

    const sessionName =
      String(body.sessionName ?? "").trim() || null;

    const trades: TradeItem[] =
      Array.isArray(body.trades)
        ? body.trades
        : [];

    if (trades.length === 0) {
      return NextResponse.json(
        { error: "No trades to save." },
        { status: 400 }
      );
    }

    const sessionId =
      randomUUID();

    for (const trade of trades) {
      await sql`
        INSERT INTO trades (
          user_id,
          nickname,
          session_id,
          session_name,
          ticker,
          exchange,
          quantity,
          price
        )
        VALUES (
          ${userId},
          ${nickname},
          ${sessionId},
          ${sessionName},
          ${trade.ticker},
          ${trade.exchange},
          ${trade.quantity},
          ${trade.price}
        )
      `;
    }

    return NextResponse.json({
      success: true,
      sessionId,
      saved: trades.length,
    });
  } catch (error) {
    console.error(
      "Save trades error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to save analysis.",
      },
      { status: 500 }
    );
  }
}