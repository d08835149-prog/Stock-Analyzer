"use client";

import dynamic from "next/dynamic";
import { HistoryPoint } from "@/components/StockChart";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
});

type StockSeries = {
  symbol: string;
  history: HistoryPoint[];
};

type Props = {
  stocks: StockSeries[];
};

export default function CombinedChart({ stocks }: Props) {
  if (!stocks.length) {
    return null;
  }

  return (
    <div className="chart-card">
      <Plot
        data={stocks.map((stock) => ({
          type: "scatter",
          mode: "lines",
          name: stock.symbol,
          x: stock.history.map((point) => point.datetime),
          y: stock.history.map((point) => point.close),
          line: {
            width: 2,
          },
        }))}
        layout={{
          autosize: true,
          height: 420,
          paper_bgcolor: "#171b22",
          plot_bgcolor: "#171b22",
          font: {
            color: "#fafafa",
          },
          margin: {
            l: 55,
            r: 20,
            t: 60,
            b: 50,
          },
          title: {
            text: "Combined Close Price Chart",
          },
          legend: {
            orientation: "h",
            x: 0,
            y: 1.08,
          },
          xaxis: {
            title: {
              text: "Date",
            },
            gridcolor: "#2d333b",
          },
          yaxis: {
            title: {
              text: "Close Price",
            },
            gridcolor: "#2d333b",
          },
          hovermode: "x unified",
        }}
        config={{
          responsive: true,
          displaylogo: false,
        }}
        style={{
          width: "100%",
        }}
        useResizeHandler
      />
    </div>
  );
}