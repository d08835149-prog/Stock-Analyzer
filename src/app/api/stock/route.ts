import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const symbol = searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Ticker symbol is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.TWELVEDATA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Twelve Data API key is not configured." },
        { status: 500 }
      );
    }

    const twelveDataSymbol = symbol.toUpperCase();

    const url =
      `https://api.twelvedata.com/quote` +
      `?symbol=${encodeURIComponent(twelveDataSymbol)}` +
      `&apikey=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to contact Twelve Data." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.status === "error") {
      return NextResponse.json(
        {
          error: data.message || "Twelve Data returned an error.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      symbol: data.symbol ?? twelveDataSymbol,
      name: data.name ?? twelveDataSymbol,
      exchange: data.exchange ?? "US",
      currency: data.currency ?? "USD",
      price: Number(data.close),
      previousClose: Number(data.previous_close),
      change: Number(data.change),
      percentChange: Number(data.percent_change),
      open: Number(data.open),
      high: Number(data.high),
      low: Number(data.low),
      volume: Number(data.volume),
    });
  } catch (error) {
    console.error("Stock API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}