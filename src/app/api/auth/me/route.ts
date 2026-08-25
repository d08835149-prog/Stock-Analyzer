import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();

    const token =
      cookieStore.get("stock_analyzer_session")?.value;

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 401 }
      );
    }

    const payload =
      await verifySessionToken(token);

    return NextResponse.json({
      user: {
        id: payload.userId,
        nickname: payload.nickname,
      },
    });
  } catch {
    return NextResponse.json(
      { user: null },
      { status: 401 }
    );
  }
}