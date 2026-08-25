"use client";

import { useState } from "react";

import AuthPanel from "@/components/AuthPanel";
import PdfDownloadButton from "@/components/PdfDownloadButton";
import AnalysisHistory, {
  HistorySession,
} from "@/components/AnalysisHistory";
import CombinedChart from "@/components/CombinedChart";
import StockChart, {
  HistoryPoint,
} from "@/components/StockChart";
import StockNews from "@/components/StockNews";

type TickerRow = {
  ticker: string;
  exchange: string;
  quantity: number;
};

type NewsItem = {
  id?: number | null;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: string | null;
};

type StockResult = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  previousClose: number;
  change: number;
  percentChange: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  quantity: number;
  history: HistoryPoint[];
  news: NewsItem[];
};

const exchanges = [
  { value: "US", label: "US" },
  { value: "CA", label: "CA" },
  { value: "UK", label: "UK" },
  { value: "DE", label: "DE" },
  { value: "JP", label: "JP" },
  { value: "KR", label: "KR" },
];

export default function Home() {
  const [period, setPeriod] = useState("1y");

  const [tickers, setTickers] = useState<TickerRow[]>([
    {
      ticker: "",
      exchange: "US",
      quantity: 1,
    },
  ]);

  const [results, setResults] = useState<StockResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const addTicker = () => {
    if (tickers.length >= 10) return;

    setTickers([
      ...tickers,
      {
        ticker: "",
        exchange: "US",
        quantity: 1,
      },
    ]);
  };

  const removeTicker = (index: number) => {
    if (tickers.length === 1) return;

    setTickers(
      tickers.filter((_, i) => i !== index)
    );
  };

  const updateTicker = (
    index: number,
    field: keyof TickerRow,
    value: string | number
  ) => {
    setTickers((current) =>
      current.map((row, i) =>
        i === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const analyze = async (
    overrideTickers?: TickerRow[],
    saveAnalysis = true,
    overrideSessionName?: string
  ) => {
    const sourceTickers =
      overrideTickers ?? tickers;

    const validTickers =
      sourceTickers.filter(
        (row) =>
          row.ticker.trim() !== ""
      );

    if (validTickers.length === 0) {
      setError(
        "Please enter at least one ticker."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const requests = validTickers.map(
        async (row) => {
          const params =
            new URLSearchParams({
              symbol:
                row.ticker.trim(),
              exchange:
                row.exchange,
              period,
            });

          const [
            stockResponse,
            historyResponse,
            newsResponse,
          ] = await Promise.all([
            fetch(
              `/api/stock?${params.toString()}`
            ),

            fetch(
              `/api/history?${params.toString()}`
            ),

            fetch(
              `/api/news?symbol=${encodeURIComponent(
                row.ticker.trim()
              )}`
            ),
          ]);

          const stockData =
            await stockResponse.json();

          const historyData =
            await historyResponse.json();

          const newsData =
            await newsResponse.json();

          if (!stockResponse.ok) {
            throw new Error(
              stockData.error ||
                `Failed to load ${row.ticker}`
            );
          }

          if (!historyResponse.ok) {
            throw new Error(
              historyData.error ||
                `Failed to load history for ${row.ticker}`
            );
          }

          if (!newsResponse.ok) {
            console.warn(
              `Failed to load news for ${row.ticker}:`,
              newsData.error
            );
          }

          return {
            ...stockData,
            quantity:
              row.quantity,
            history:
              historyData.values,
            news:
              newsResponse.ok
                ? newsData.news
                : [],
          } as StockResult;
        }
      );

      const data =
        await Promise.all(requests);

      setResults(data);

      if (saveAnalysis) {
        try {
          const saveResponse =
            await fetch(
              "/api/trades/save",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  sessionName:
                    overrideSessionName ??
                    sessionName,

                  trades: data.map(
                    (stock) => ({
                      ticker:
                        stock.symbol,

                      exchange:
                        stock.exchange,

                      quantity:
                        stock.quantity,

                      price:
                        stock.price,
                    })
                  ),
                }),
              }
            );

          if (saveResponse.ok) {
            setHistoryRefreshKey(
              (current) =>
                current + 1
            );
          } else if (
            saveResponse.status !== 401
          ) {
            const saveData =
              await saveResponse.json();

            console.warn(
              "Failed to save analysis:",
              saveData.error
            );
          }
        } catch (saveError) {
          console.warn(
            "Analysis result was not saved:",
            saveError
          );
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadHistorySession = async (
    session: HistorySession
  ) => {
    const restoredTickers:
      TickerRow[] =
      session.trades
        .slice(0, 10)
        .map((trade) => ({
          ticker:
            trade.ticker.toUpperCase(),

          exchange:
            trade.exchange ||
            "US",

          quantity:
            Number(
              trade.quantity
            ),
        }));

    if (
      restoredTickers.length ===
      0
    ) {
      return;
    }

    const restoredName =
      session.name ===
      "Untitled Analysis"
        ? ""
        : session.name;

    setTickers(
      restoredTickers
    );

    setSessionName(
      restoredName
    );

    setError("");

    await analyze(
      restoredTickers,
      false,
      restoredName
    );
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h2>⚙️ Settings</h2>

        <div className="divider" />

        <AuthPanel />

        <AnalysisHistory
          refreshKey={
            historyRefreshKey
          }
          onLoadSession={
            loadHistorySession
          }
        />

        <div className="divider" />

        <section>
          <h3>
            📅 Select Period
          </h3>

          <select
            className="input"
            value={period}
            onChange={(e) =>
              setPeriod(
                e.target.value
              )
            }
          >
            <option value="1d">
              1 Day
            </option>

            <option value="5d">
              5 Days
            </option>

            <option value="1wk">
              1 Week
            </option>

            <option value="2wk">
              2 Weeks
            </option>

            <option value="1mo">
              1 Month
            </option>

            <option value="3mo">
              3 Months
            </option>

            <option value="6mo">
              6 Months
            </option>

            <option value="1y">
              1 Year
            </option>

            <option value="2y">
              2 Years
            </option>

            <option value="5y">
              5 Years
            </option>
          </select>
        </section>

        <div className="divider" />

        <section>
          <h3>
            🏢 Enter Tickers
          </h3>

          {tickers.map(
            (row, index) => (
              <div
                className="ticker-block"
                key={index}
              >
                <div className="ticker-row">
                  <input
                    className="input"
                    placeholder={`Ticker ${
                      index + 1
                    }`}
                    value={
                      row.ticker
                    }
                    onChange={(e) =>
                      updateTicker(
                        index,
                        "ticker",
                        e.target.value.toUpperCase()
                      )
                    }
                  />

                  <select
                    className="exchange"
                    value={
                      row.exchange
                    }
                    onChange={(e) =>
                      updateTicker(
                        index,
                        "exchange",
                        e.target.value
                      )
                    }
                  >
                    {exchanges.map(
                      (
                        exchange
                      ) => (
                        <option
                          key={
                            exchange.value
                          }
                          value={
                            exchange.value
                          }
                        >
                          {
                            exchange.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="quantity-row">
                  <input
                    className="input"
                    type="number"
                    min="1"
                    value={
                      row.quantity
                    }
                    onChange={(e) =>
                      updateTicker(
                        index,
                        "quantity",
                        Math.max(
                          1,
                          Number(
                            e.target.value
                          )
                        )
                      )
                    }
                  />

                  {tickers.length >
                    1 && (
                    <button
                      className="remove-button"
                      onClick={() =>
                        removeTicker(
                          index
                        )
                      }
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {tickers.length <
            10 && (
            <button
              className="add-button"
              onClick={
                addTicker
              }
              type="button"
            >
              ＋ Add Ticker
            </button>
          )}

          <p className="ticker-count">
            {tickers.length} /
            10 tickers
          </p>

          <input
            className="input"
            type="text"
            placeholder="Analysis Name (optional)"
            value={
              sessionName
            }
            onChange={(e) =>
              setSessionName(
                e.target.value
              )
            }
          />

          <button
            className="primary-button"
            onClick={() =>
              analyze()
            }
            type="button"
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "🔍 Analyze"}
          </button>
        </section>
      </aside>

      <section className="content">
        
        <h1>
          📈 Stock Analyzer
        </h1>

        {results.length === 0 &&
          !loading &&
          !error && (
            <div className="welcome-card">
              👈 Enter a period and
              tickers on the left,
              then click Analyze.
            </div>
          )}

        {error && (
          <div className="error-card">
            {error}
          </div>
        )}

        {loading && (
          <div className="loading-card">
            Loading stock data,
            charts and news...
          </div>
        )}

        {results.length > 0 && (
  <section
    className="results-section"
    id="analysis-report"
  >
            <h2>
              📋 Portfolio Summary
            </h2>

            <PdfDownloadButton
  targetId="analysis-report"
  fileName={
    sessionName.trim() ||
    "stock-analysis"
  }
/>

            <div className="combined-section">
              <h2>
                📊 Combined Close
                Price Chart
              </h2>

              <CombinedChart
                stocks={results.map(
                  (stock) => ({
                    symbol:
                      stock.symbol,

                    history:
                      stock.history,
                  })
                )}
              />
            </div>

            {results.map(
              (stock) => {
                const marketValue =
                  stock.price *
                  stock.quantity;

                return (
                  <div
                    className="stock-result"
                    key={`${stock.symbol}-${stock.exchange}`}
                  >
                    <article className="stock-card">
                      <div className="stock-card-header">
                        <div>
                          <h3>
                            {
                              stock.symbol
                            }
                          </h3>

                          <p>
                            {
                              stock.name
                            }
                          </p>
                        </div>

                        <strong>
                          {stock.currency ===
                          "USD"
                            ? "$"
                            : ""}

                          {stock.price.toFixed(
                            2
                          )}
                        </strong>
                      </div>

                      <div
                        className={
                          stock.percentChange >=
                          0
                            ? "change positive"
                            : "change negative"
                        }
                      >
                        {stock.percentChange >=
                        0
                          ? "+"
                          : ""}

                        {stock.percentChange.toFixed(
                          2
                        )}
                        %
                      </div>

                      <div className="stock-details">
                        <div>
                          <span>
                            Quantity
                          </span>

                          <strong>
                            {
                              stock.quantity
                            }
                          </strong>
                        </div>

                        <div>
                          <span>
                            Market
                            Value
                          </span>

                          <strong>
                            $
                            {marketValue.toLocaleString(
                              undefined,
                              {
                                minimumFractionDigits:
                                  2,

                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Previous
                            Close
                          </span>

                          <strong>
                            $
                            {stock.previousClose.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Open
                          </span>

                          <strong>
                            $
                            {stock.open.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            High
                          </span>

                          <strong>
                            $
                            {stock.high.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Low
                          </span>

                          <strong>
                            $
                            {stock.low.toFixed(
                              2
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Volume
                          </span>

                          <strong>
                            {stock.volume.toLocaleString()}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Exchange
                          </span>

                          <strong>
                            {
                              stock.exchange
                            }
                          </strong>
                        </div>
                      </div>
                    </article>

                    <StockChart
                      symbol={
                        stock.symbol
                      }
                      values={
                        stock.history
                      }
                    />

                    <StockNews
                      symbol={
                        stock.symbol
                      }
                      news={
                        stock.news
                      }
                    />
                  </div>
                );
              }
            )}
          </section>
        )}
      </section>
    </main>
  );
}