"use client";

import { useEffect, useState } from "react";

export type HistoryRow = {
  id: string | number;
  session_id: string | null;
  session_name: string | null;
  ticker: string;
  exchange: string | null;
  quantity: number;
  price: number;
  created_at: string;
};

export type HistorySession = {
  id: string;
  name: string;
  createdAt: string;
  trades: HistoryRow[];
};

type Props = {
  refreshKey?: number;
  onLoadSession: (session: HistorySession) => void;
};

export default function AnalysisHistory({
  refreshKey = 0,
  onLoadSession,
}: Props) {
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);

      try {
        const response = await fetch("/api/trades/history", {
          cache: "no-store",
        });

        if (!response.ok) {
          setHistory([]);
          return;
        }

        const data = await response.json();

        setHistory(data.history ?? []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [refreshKey]);

  const sessions = history.reduce<HistorySession[]>(
    (groups, row) => {
      // 새 데이터는 session_id 기준
      // 기존 데이터(session_id null)는 row 하나씩 독립 세션 처리
      const sessionKey =
        row.session_id ?? `legacy-${row.id}`;

      const existing = groups.find(
        (group) => group.id === sessionKey
      );

      if (existing) {
        existing.trades.push(row);

        if (
          new Date(row.created_at).getTime() >
          new Date(existing.createdAt).getTime()
        ) {
          existing.createdAt = row.created_at;
        }

        return groups;
      }

      groups.push({
        id: sessionKey,
        name:
          row.session_name?.trim() ||
          "Untitled Analysis",
        createdAt: row.created_at,
        trades: [row],
      });

      return groups;
    },
    []
  );

  if (loading) {
    return (
      <section className="history-section">
        <h3>📂 My Analysis History</h3>
        <p className="history-empty">
          Loading...
        </p>
      </section>
    );
  }

  if (!sessions.length) {
    return (
      <section className="history-section">
        <h3>📂 My Analysis History</h3>

        <p className="history-empty">
          No analysis history yet.
        </p>
      </section>
    );
  }

  return (
    <section className="history-section">
      <h3>📂 My Analysis History</h3>

      <div className="history-list">
        {sessions.map((session) => (
          <button
            type="button"
            className="history-session"
            key={session.id}
            onClick={() =>
              onLoadSession(session)
            }
          >
            <div className="history-session-header">
              <strong>
                {session.name}
              </strong>

              <span>
                {session.trades.length}{" "}
                {session.trades.length === 1
                  ? "stock"
                  : "stocks"}
              </span>
            </div>

            <div className="history-tickers">
              {session.trades.map((trade) => (
                <span key={trade.id}>
                  {trade.ticker} ×{" "}
                  {trade.quantity}
                </span>
              ))}
            </div>

            <div className="history-date">
              {new Date(
                session.createdAt
              ).toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}