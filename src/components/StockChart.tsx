"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(
  () => import("react-plotly.js"),
  {
    ssr: false,
  }
);

export type HistoryPoint = {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Props = {
  symbol: string;
  values: HistoryPoint[];
};

function movingAverage(
  values: number[],
  period: number
) {
  return values.map((_, index) => {
    if (index < period - 1) {
      return null;
    }

    const slice = values.slice(
      index - period + 1,
      index + 1
    );

    return (
      slice.reduce(
        (sum, value) => sum + value,
        0
      ) / period
    );
  });
}

function standardDeviation(
  values: number[]
) {
  const average =
    values.reduce(
      (sum, value) => sum + value,
      0
    ) / values.length;

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(value - average, 2),
      0
    ) / values.length;

  return Math.sqrt(variance);
}

function bollingerBands(
  values: number[],
  period = 20
) {
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  values.forEach((_, index) => {
    if (index < period - 1) {
      upper.push(null);
      lower.push(null);
      return;
    }

    const slice = values.slice(
      index - period + 1,
      index + 1
    );

    const average =
      slice.reduce(
        (sum, value) => sum + value,
        0
      ) / period;

    const std =
      standardDeviation(slice);

    upper.push(
      average + 2 * std
    );

    lower.push(
      average - 2 * std
    );
  });

  return {
    upper,
    lower,
  };
}

export default function StockChart({
  symbol,
  values,
}: Props) {
  if (!values.length) {
    return null;
  }

  const dates =
    values.map(
      (point) => point.datetime
    );

  const close =
    values.map(
      (point) => point.close
    );

  const ma20 =
    movingAverage(close, 20);

  const ma50 =
    movingAverage(close, 50);

  const bands =
    bollingerBands(close);

  const volumeColors =
    values.map((point) =>
      point.close >= point.open
        ? "#26a69a"
        : "#ef5350"
    );

  return (
    <div className="chart-card">
      <Plot
        data={[
          {
            type: "candlestick",
            x: dates,
            open: values.map(
              (point) => point.open
            ),
            high: values.map(
              (point) => point.high
            ),
            low: values.map(
              (point) => point.low
            ),
            close,
            name: symbol,
            xaxis: "x",
            yaxis: "y",
          },

          {
            type: "scatter",
            mode: "lines",
            x: dates,
            y: ma20,
            name: "MA20",
            line: {
              color: "#ffa726",
              width: 1.5,
            },
            xaxis: "x",
            yaxis: "y",
          },

          {
            type: "scatter",
            mode: "lines",
            x: dates,
            y: ma50,
            name: "MA50",
            line: {
              color: "#42a5f5",
              width: 1.5,
            },
            xaxis: "x",
            yaxis: "y",
          },

          {
            type: "scatter",
            mode: "lines",
            x: dates,
            y: bands.upper,
            name: "BB Upper",
            line: {
              color: "#90caf9",
              width: 1,
              dash: "dash",
            },
            xaxis: "x",
            yaxis: "y",
          },

          {
            type: "scatter",
            mode: "lines",
            x: dates,
            y: bands.lower,
            name: "BB Lower",
            line: {
              color: "#90caf9",
              width: 1,
              dash: "dash",
            },
            fill: "tonexty",
            fillcolor:
              "rgba(144, 202, 249, 0.08)",
            xaxis: "x",
            yaxis: "y",
          },

          {
            type: "bar",
            x: dates,
            y: values.map(
              (point) => point.volume
            ),
            marker: {
              color: volumeColors,
            },
            name: "Volume",
            showlegend: false,
            xaxis: "x2",
            yaxis: "y2",
          },
        ]}
        layout={{
          autosize: true,

          height: 620,

          paper_bgcolor:
            "#171b22",

          plot_bgcolor:
            "#171b22",

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
            text:
              `${symbol} Candlestick + Indicators`,
          },

          legend: {
            orientation: "h",
            x: 0,
            y: 1.08,
          },

          xaxis: {
            domain: [0, 1],
            anchor: "y",
            rangeslider: {
              visible: false,
            },
            gridcolor: "#2d333b",
          },

          yaxis: {
            domain: [0.28, 1],
            gridcolor: "#2d333b",
          },

          xaxis2: {
            domain: [0, 1],
            anchor: "y2",
            matches: "x",
            gridcolor: "#2d333b",
          },

          yaxis2: {
            domain: [0, 0.2],
            gridcolor: "#2d333b",
          },
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