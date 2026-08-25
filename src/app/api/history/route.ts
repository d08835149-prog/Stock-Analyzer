import { NextRequest, NextResponse } from "next/server";

const PERIOD_TO_TD: Record<string, [string, number]> = {
  "1d": ["1min", 1000],
  "5d": ["15min", 1000],
  "1wk": ["1h", 1000],
  "2wk": ["1day", 1000],
  "1mo": ["1day", 1000],
  "3mo": ["1day", 1000],
  "6mo": ["1day", 1000],
  "1y": ["1day", 1000],
  "2y": ["1day", 2000],
  "5y": ["1day", 2000],
};

function getTwelveDataSymbol(symbol: string, exchange: string) {
  const upper = symbol.toUpperCase();

  switch (exchange) {
    case "CA":
      return `${upper}:TSX`;
    case "UK":
      return `${upper}:LSE`;
    case "DE":
      return `${upper}:XETR`;
    case "JP":
      return `${upper}:JPX`;
    case "KR":
      return `${upper}:KRX`;
    default:
      return upper;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const symbol = searchParams.get("symbol");
    const exchange = searchParams.get("exchange") || "US";
    const period = searchParams.get("period") || "1y";

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

    const [interval, outputsize] =
      PERIOD_TO_TD[period] || ["1day", 1000];

    const twelveDataSymbol = getTwelveDataSymbol(
      symbol,
      exchange
    );

    const params = new URLSearchParams({
      symbol: twelveDataSymbol,
      interval,
      outputsize: String(outputsize),
      order: "ASC",
      apikey: apiKey,
    });

    const url =
      `https://api.twelvedata.com/time_series?${params.toString()}`;

    const response = await fetch(url, {
      next: {
        revalidate: 1200,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to contact Twelve Data." },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (
      data.status === "error" ||
      !Array.isArray(data.values)
    ) {
      return NextResponse.json(
        {
          error:
            data.message ||
            `No historical data found for ${symbol}.`,
        },
        { status: 400 }
      );
    }

    const points = data.values.map(
      (item: {
        datetime: string;
        open?: string;
        high?: string;
        low?: string;
        close?: string;
        volume?: string;
      }) => ({
        datetime: item.datetime,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume ?? 0),
      })
    );

    function filterByPeriod(
  points: {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[],
  period: string
) {
  const now = new Date();

  const daysMap: Record<string, number> = {
    "1d": 1,
    "5d": 5,
    "1wk": 7,
    "2wk": 14,
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "2y": 730,
    "5y": 1825,
  };

  const days = daysMap[period];

  if (!days) {
    return points;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  return points.filter(
    (point) => new Date(point.datetime) >= cutoff
  );
}

    const filteredPoints = filterByPeriod(
  points,
  period
);

return NextResponse.json({
  symbol: data.meta?.symbol ?? twelveDataSymbol,
  interval,
  period,
  cachedForSeconds: 1200,
  values: filteredPoints,
});
  } catch (error) {
    console.error("History API error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}