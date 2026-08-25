import { NextRequest, NextResponse } from "next/server";

type FinnhubNewsItem = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

const COMPANY_NAMES: Record<string, string[]> = {
  AAPL: ["APPLE"],
  NVDA: ["NVIDIA"],
  MSFT: ["MICROSOFT"],
  AMZN: ["AMAZON"],
  GOOGL: ["GOOGLE", "ALPHABET"],
  GOOG: ["GOOGLE", "ALPHABET"],
  META: ["META", "FACEBOOK"],
  TSLA: ["TESLA"],
  AMD: ["AMD", "ADVANCED MICRO DEVICES"],
  NFLX: ["NETFLIX"],
  INTC: ["INTEL"],
  ORCL: ["ORACLE"],
  IBM: ["IBM"],
  CRM: ["SALESFORCE"],
  AVGO: ["BROADCOM"],
  QCOM: ["QUALCOMM"],
};

export async function GET(request: NextRequest) {
  try {
    const symbol = request.nextUrl.searchParams.get("symbol");

    if (!symbol) {
      return NextResponse.json(
        { error: "Ticker symbol is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "FINNHUB_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const upperSymbol = symbol.toUpperCase();

    // Recent 7 days
    const today = new Date();

    const fromDate = new Date();
    fromDate.setDate(today.getDate() - 7);

    const formatDate = (date: Date) =>
      date.toISOString().split("T")[0];

    const params = new URLSearchParams({
      symbol: upperSymbol,
      from: formatDate(fromDate),
      to: formatDate(today),
      token: apiKey,
    });

    const response = await fetch(
      `https://finnhub.io/api/v1/company-news?${params.toString()}`,
      {
        next: {
          revalidate: 900,
        },
      }
    );

    if (!response.ok) {
      console.error(
        "Finnhub response:",
        response.status,
        response.statusText
      );

      return NextResponse.json(
        {
          error: "Failed to fetch news from Finnhub.",
        },
        { status: 502 }
      );
    }

    const data: FinnhubNewsItem[] =
      await response.json();

    if (!Array.isArray(data)) {
      return NextResponse.json(
        {
          error: "Invalid response from Finnhub.",
        },
        { status: 502 }
      );
    }

    const keywords = [
      upperSymbol,
      ...(COMPANY_NAMES[upperSymbol] ?? []),
    ];

    const directNews = data.filter((item) => {
      if (!item.headline || !item.url) {
        return false;
      }

      const searchableText = [
        item.headline,
        item.summary,
        item.related,
      ]
        .filter(Boolean)
        .join(" ")
        .toUpperCase();

      return keywords.some((keyword) =>
        searchableText.includes(keyword)
      );
    });

    const news = directNews
      .sort(
        (a, b) =>
          (b.datetime ?? 0) -
          (a.datetime ?? 0)
      )
      .slice(0, 5)
      .map((item) => ({
        id: item.id ?? null,

        headline:
          item.headline ?? "Untitled",

        summary:
          item.summary ?? "",

        source:
          item.source ?? "Unknown",

        url:
          item.url ?? "",

        image:
          item.image ?? "",

        datetime: item.datetime
          ? new Date(
              item.datetime * 1000
            ).toISOString()
          : null,
      }));

    return NextResponse.json({
      symbol: upperSymbol,
      cachedForSeconds: 900,
      news,
    });
  } catch (error) {
    console.error(
      "News API error:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}