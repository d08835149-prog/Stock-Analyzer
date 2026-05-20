import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from supabase import create_client
import requests
from datetime import datetime, timedelta

# ── 페이지 설정 ──────────────────────────────────────────────
st.set_page_config(page_title="Thornhill Quant League", layout="wide")

# ── Supabase 연결 ─────────────────────────────────────────────
@st.cache_resource
def init_supabase():
    return create_client(st.secrets["SUPABASE_URL"], st.secrets["SUPABASE_KEY"])

supabase = init_supabase()

# ── 제목 ──────────────────────────────────────────────────────
st.title("📈 Thornhill Quant League Engine")

# ════════════════════════════════════════════════════════════
# 사이드바: 날짜 범위 + 기업 입력 + 수량 입력
# ════════════════════════════════════════════════════════════
with st.sidebar:
    st.header("⚙️ 설정")

    # 날짜 범위 선택
    period_map = {
        "1일":   "1d",
        "3일":   "5d",
        "1주일": "1wk",
        "1개월": "1mo",
        "3개월": "3mo",
        "6개월": "6mo",
        "1년":   "1y",
        "2년":   "2y",
        "5년":   "5y",
    }
    period_label = st.selectbox("📅 기간 선택", list(period_map.keys()), index=6)
    period = period_map[period_label]

    st.divider()
    st.subheader("🏢 기업 입력 (최대 10개)")
    st.caption("티커와 수량을 입력한 뒤 분석하기를 눌러주세요")

    ticker_qty_list = []
    for i in range(10):
        col_t, col_q = st.columns([2, 1])
        t = col_t.text_input(f"티커 {i+1}", key=f"ticker_{i}", placeholder="AAPL")
        q = col_q.number_input("수량", min_value=1, value=1, key=f"qty_{i}", label_visibility="visible")
        if t.strip():
            ticker_qty_list.append({"ticker": t.strip().upper(), "qty": int(q)})

    st.divider()
    analyze = st.button("🔍 분석하기", use_container_width=True)

# ════════════════════════════════════════════════════════════
# 분석 실행
# ════════════════════════════════════════════════════════════
if analyze and ticker_qty_list:

    tickers_input = [item["ticker"] for item in ticker_qty_list]
    qty_map       = {item["ticker"]: item["qty"] for item in ticker_qty_list}

    # ── 데이터 로드 ────────────────────────────────────────
    all_close   = {}
    ticker_data = {}

    with st.spinner("데이터 불러오는 중..."):
        for tk in tickers_input:
            obj  = yf.Ticker(tk)
            hist = obj.history(period=period)
            if not hist.empty:
                all_close[tk]   = hist["Close"]
                ticker_data[tk] = {"hist": hist, "info": obj.info}
            else:
                st.warning(f"⚠️ {tk} 데이터를 찾을 수 없어요.")

    if not all_close:
        st.error("유효한 종목 데이터가 없어요.")
        st.stop()

    # ── Supabase 저장 ──────────────────────────────────────
    try:
        for tk in ticker_data:
            close = ticker_data[tk]["hist"]["Close"]
            current_price = float(close.iloc[-1])
            supabase.table("trades").insert({
                "user_id":  "Ditto",
                "ticker":   tk,
                "quantity": qty_map[tk],
                "price":    current_price,
            }).execute()
        st.toast("✅ Supabase에 저장 완료!", icon="💾")
    except Exception as e:
        st.warning(f"저장 실패: {e}")

    # ── 1. 포트폴리오 요약 테이블 ─────────────────────────
    st.subheader("📋 포트폴리오 요약")

    summary_rows = []
    for tk in tickers_input:
        if tk not in ticker_data:
            continue
        hist         = ticker_data[tk]["hist"]
        info         = ticker_data[tk]["info"]
        close        = hist["Close"]
        qty          = qty_map[tk]

        start_price   = close.iloc[0]
        current_price = close.iloc[-1]
        ret_pct       = (current_price - start_price) / start_price * 100
        hold_value    = current_price * qty
        profit        = (current_price - start_price) * qty

        summary_rows.append({
            "티커":       tk,
            "수량":       qty,
            f"시작가 ({period_label})": f"${start_price:.2f}",
            "현재가":     f"${current_price:.2f}",
            "수익률":     f"{ret_pct:+.2f}%",
            "평가금액":   f"${hold_value:,.2f}",
            "손익":       f"${profit:+,.2f}",
        })

    summary_df = pd.DataFrame(summary_rows)
    st.dataframe(
        summary_df,
        hide_index=True,
        use_container_width=True,
        column_config={
            "수익률": st.column_config.TextColumn("수익률"),
            "손익":   st.column_config.TextColumn("손익"),
        },
    )

    # ── 2. 통합 종가 차트 ─────────────────────────────────
    st.divider()
    st.subheader("📊 통합 종가 비교 차트")
    fig_combined = go.Figure()
    for tk, close_series in all_close.items():
        fig_combined.add_trace(go.Scatter(
            x=close_series.index,
            y=close_series.values,
            mode="lines",
            name=tk,
            line=dict(width=2),
        ))
    fig_combined.update_layout(
        height=420,
        margin=dict(l=0, r=0, t=30, b=0),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        xaxis_title="날짜",
        yaxis_title="종가 (USD)",
        hovermode="x unified",
    )
    st.plotly_chart(fig_combined, use_container_width=True, config={"displayModeBar": False})

    # ── 3. 개별 기업 상세 차트 ───────────────────────────
    st.divider()
    st.subheader("🔬 개별 종목 상세 분석")

    for tk in tickers_input:
        if tk not in ticker_data:
            continue

        hist = ticker_data[tk]["hist"]
        info = ticker_data[tk]["info"]
        close = hist["Close"]

        # 보조지표
        ma20        = close.rolling(20).mean()
        ma50        = close.rolling(50).mean()
        rolling_std = close.rolling(20).std()
        bb_upper    = ma20 + 2 * rolling_std
        bb_lower    = ma20 - 2 * rolling_std

        # 메타 정보
        current_price = info.get("currentPrice") or close.iloc[-1]
        prev_close    = info.get("previousClose", "N/A")
        open_price    = info.get("open", "N/A")
        day_high      = info.get("dayHigh", "N/A")
        day_low       = info.get("dayLow", "N/A")
        bid           = info.get("bid", "N/A")
        ask           = info.get("ask", "N/A")
        mkt_cap       = info.get("marketCap", None)
        mkt_cap_str   = f"${mkt_cap:,.0f}" if mkt_cap else "N/A"

        start_price = close.iloc[0]
        ret_pct     = (current_price - start_price) / start_price * 100
        ret_str     = f"{ret_pct:+.2f}%"

        with st.expander(f"📌 {tk}  |  현재가 ${current_price:.2f}  |  수익률 {ret_str}", expanded=True):

            col1, col2, col3, col4 = st.columns(4)
            col1.metric("현재가",    f"${current_price:.2f}" if isinstance(current_price, float) else current_price,
                        delta=ret_str)
            col2.metric("전일 종가", f"${prev_close:.2f}"    if isinstance(prev_close, float)    else prev_close)
            col3.metric("시가총액",  mkt_cap_str)
            col4.metric("Bid / Ask", f"${bid} / ${ask}"      if bid != "N/A"                    else "N/A")

            col5, col6, col7, col8 = st.columns(4)
            col5.metric("시가",  f"${open_price:.2f}" if isinstance(open_price, float) else open_price)
            col6.metric("종가",  f"${close.iloc[-1]:.2f}")
            col7.metric("고가",  f"${day_high:.2f}"   if isinstance(day_high, float)   else day_high)
            col8.metric("저가",  f"${day_low:.2f}"    if isinstance(day_low, float)    else day_low)

            # 캔들 + 보조지표 차트
            fig = make_subplots(
                rows=2, cols=1,
                shared_xaxes=True,
                row_heights=[0.75, 0.25],
                vertical_spacing=0.03,
                subplot_titles=(f"{tk} 캔들 차트 + 보조지표", "거래량"),
            )

            fig.add_trace(go.Candlestick(
                x=hist.index,
                open=hist["Open"], high=hist["High"],
                low=hist["Low"],   close=hist["Close"],
                name="OHLC",
                increasing_line_color="#26a69a",
                decreasing_line_color="#ef5350",
            ), row=1, col=1)

            fig.add_trace(go.Scatter(x=hist.index, y=ma20, name="MA20",
                                     line=dict(color="#FFA726", width=1.5)), row=1, col=1)
            fig.add_trace(go.Scatter(x=hist.index, y=ma50, name="MA50",
                                     line=dict(color="#42A5F5", width=1.5)), row=1, col=1)

            fig.add_trace(go.Scatter(
                x=pd.concat([hist.index.to_series(), hist.index.to_series()[::-1]]),
                y=pd.concat([bb_upper, bb_lower[::-1]]),
                fill="toself", fillcolor="rgba(144,202,249,0.15)",
                line=dict(color="rgba(0,0,0,0)"), name="Bollinger Band",
            ), row=1, col=1)
            fig.add_trace(go.Scatter(x=hist.index, y=bb_upper, name="BB Upper",
                                     line=dict(color="#90CAF9", width=1, dash="dash")), row=1, col=1)
            fig.add_trace(go.Scatter(x=hist.index, y=bb_lower, name="BB Lower",
                                     line=dict(color="#90CAF9", width=1, dash="dash")), row=1, col=1)

            colors = ["#26a69a" if c >= o else "#ef5350"
                      for c, o in zip(hist["Close"], hist["Open"])]
            fig.add_trace(go.Bar(
                x=hist.index, y=hist["Volume"],
                marker_color=colors, name="거래량", showlegend=False,
            ), row=2, col=1)

            fig.update_layout(
                height=580,
                margin=dict(l=0, r=0, t=40, b=0),
                xaxis_rangeslider_visible=False,
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            )
            st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})

            # ── 뉴스 섹션 ──────────────────────────────────
            st.subheader(f"📰 {tk} 최신 뉴스")
            finnhub_key = st.secrets.get("FINNHUB_API_KEY", "")
            if finnhub_key:
                try:
                    date_to   = datetime.now().strftime("%Y-%m-%d")
                    date_from = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
                    url = (
                        f"https://finnhub.io/api/v1/company-news"
                        f"?symbol={tk}&from={date_from}&to={date_to}&token={finnhub_key}"
                    )
                    resp = requests.get(url, timeout=5)
                    if resp.status_code == 200:
                        news = resp.json()
                        # 티커 관련 뉴스 우선 필터링
                        filtered = [n for n in news if tk in n.get("headline", "").upper()][:5]
                        if not filtered:
                            filtered = news[:5]
                        if filtered:
                            for item in filtered:
                                headline = item.get("headline", "제목 없음")
                                news_url = item.get("url", "#")
                                source   = item.get("source", "")
                                dt       = datetime.fromtimestamp(item.get("datetime", 0)).strftime("%Y-%m-%d") if item.get("datetime") else ""
                                st.markdown(f"- **[{headline}]({news_url})** `{source}` {dt}")
                        else:
                            st.caption("최근 7일간 뉴스가 없어요.")
                    else:
                        st.caption("뉴스를 불러오지 못했어요.")
                except Exception as e:
                    st.caption(f"뉴스 오류: {e}")
            else:
                st.caption("🔑 `FINNHUB_API_KEY`를 Streamlit secrets에 추가하면 뉴스가 표시돼요.")

elif analyze and not ticker_qty_list:
    st.warning("최소 1개 이상의 티커를 입력해주세요.")
else:
    st.info("👈 왼쪽 사이드바에서 기간과 종목/수량을 입력하고 **분석하기** 버튼을 눌러주세요.")