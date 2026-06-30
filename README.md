# 📈Stock analyzer


Before we begin, please send all issues, bug reports, feedback, questions, language additions, etc. regarding this site to d08835149@gmail.com.



A multi-language stock analysis platform 
---

## 🚀 Features

### 📊 Analysis
- Analyze up to **10 tickers simultaneously**
- Supported exchanges: 🇺🇸 US, 🇨🇦 CA, 🇬🇧 UK, 🇩🇪 DE, 🇯🇵 JP, 🇰🇷 KR
- Time periods: 1 Day → 5 Years (including exact 2-week window)
- **Combined price chart** for side-by-side comparison
- **Individual stock charts** with:
  - Candlestick (OHLC)
  - MA20 / MA50
  - Bollinger Bands (Upper / Lower)
  - Volume bars
- Key metrics: Current Price, Prev Close, Market Cap, Bid/Ask, Open, Close, High, Low
- **Latest news** per ticker via Finnhub API

### 💼 Portfolio
- Quantity input per ticker
- Portfolio summary table: Start Price, Current Price, Return %, Market Value, P&L
- Name and save each analysis session
- Load previous analysis sessions from history

### 👤 User System
- Nickname + Password authentication (SHA-256 hashed)
- Sign up / Login / Logout
- Change password
- Personal analysis history (last 20 records)

### 🌐 Multilingual Support
- 🇬🇧 English
- 🇫🇷 Français
- 🇮🇷 فارسی (Persian)
- 🇨🇳 中文
- 🇰🇷 한국어

### ⚡ Performance
- Data cached for **20 minutes** to prevent API rate limiting
- Cache timestamp displayed on screen

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Streamlit |
| Charts | Plotly |
| Market Data | TwelveData |
| News | Finnhub API |
| Database | NeonDatabase |
| Hosting | Streamlit Community Cloud |

---
**## How to Use**
1. Sign up and log in. (This is not mandatory, but it is recommended if you wish to save your analysis records.)

2. Select an analysis period.

3. Enter the tickers. (A ticker is a 4-digit code representing a company (usually 4 digits, but 5 digits also exist). Examples include MSFT, AAPL, GOOGL, NVDA, etc.) [Up to 10 companies are allowed]

4. Click "Analyze"!! Then, enjoy the graphs and information. If you wish to save the data, you can also download a PDF file.



## ⚙️ Setup

### 1. Clone the repo
```bash
git clone https://github.com/your-username/Stock-Analyzer.git
cd Stock-Analyzer
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure secrets
Create `.streamlit/secrets.toml`:
```toml
TWELVEDATA_API_KEY = "your-twelveData-API-Key"
NEON_DATABASE_URL = "your-neon-url"
FINNHUB_API_KEY = "your_finnhub_key"
ADMIN_NICKNAME = "your_admin_nickname"
ADMIN_PASSWORD = "your_admin_password"
```

### 4. Set up Supabase tables
Run in Neon SQL Editor:
```sql
create table users (
  id uuid default gen_random_uuid() primary key,
  nickname text unique not null,
  password text not null,
  created_at timestamptz default now()
);

create table trades (
  id bigint primary key generated always as identity,
  user_id text,
  nickname text,
  ticker text,
  quantity integer,
  price numeric,
  session_name text,
  analysis_style text,
  created_at timestamptz default now()
);
```

### 5. Run locally
```bash
streamlit run app.py
```

---

## 🌐 Deployment

Deployed on **Streamlit Community Cloud**.  
Add all secrets under **App Settings → Secrets** in the Streamlit Cloud dashboard.

---

## 📌 Notes

- This app is for **analysis purposes only**
- Stock data refreshes every **20 minutes** to avoid API rate limits

---

## 🍁 Made for Thornhill Stock League — Canada

---

## 👨‍💻 Credits

| Role | Name |
|---|---|
| Developer | Ditto A. |
| Feedback Source | Miguel |
| AI Assistant | ChatGPT and Gemini |


