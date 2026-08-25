"use client";

type NewsItem = {
  id?: number | null;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: string | null;
};

type Props = {
  symbol: string;
  news: NewsItem[];
};

export default function StockNews({
  symbol,
  news,
}: Props) {
  if (!news.length) {
    return (
      <section className="news-section">
        <h3>📰 Latest News — {symbol}</h3>

        <div className="no-news">
          No recent news found.
        </div>
      </section>
    );
  }

  return (
    <section className="news-section">
      <h3>📰 Latest News — {symbol}</h3>

      <div className="news-grid">
        {news.map((item, index) => (
          <a
            key={item.id ?? index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.headline}
                className="news-image"
              />
            )}

            <div className="news-content">
              <h4>{item.headline}</h4>

              {item.summary && (
                <p>{item.summary}</p>
              )}

              <div className="news-meta">
                <span>{item.source}</span>

                {item.datetime && (
                  <span>
                    {new Date(
                      item.datetime
                    ).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}