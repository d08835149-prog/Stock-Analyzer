import { NextResponse } from "next/server";

export async function POST() {
  const response =
    NextResponse.json({
      success: true,
    });

  response.cookies.set(
    "stock_analyzer_session",
    "",
    {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    }
  );

  return response;
}