import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { sql } from "@/lib/db";
import { verifySessionToken } from "@/lib/auth";

export async function GET() {
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

    if (!nickname) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 401 }
      );
    }

    const rows = await sql`
      SELECT
        id,
        nickname,
        session_id,
        session_name,
        ticker,
        exchange,
        quantity,
        price,
        created_at
      FROM trades
      WHERE nickname = ${nickname}
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return NextResponse.json({
      history: rows,
    });
  } catch (error) {
    console.error(
      "Trade history error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load history.",
      },
      { status: 500 }
    );
  }
}