# 📈Stock analyzer

<img width="1914" height="773" alt="github-photos" src="https://github.com/user-attachments/assets/67393766-de42-4ef8-a9cf-6865ed309747" />










Before we begin, please send all issues, bug reports, feedback, questions, language additions, etc. regarding this site to d08835149@gmail.com.


#The stock analyzer I created is a website developed in Python capable of analyzing stocks.


##The features supported by my website include:

Simultaneous analysis of 10 stocks and support for stock exchanges in the US, Canada, the UK, Germany, Japan, and Korea. It provides data for periods ranging from 1 day to 5 years, allows for stock comparison via price charts, and offers individual stock charts.

Individual stock charts include data such as candlesticks (open/horizontal/vertical), 20-day moving averages, 50-day moving averages, Bollinger Bands (upper/lower), and volume bars, including current price, previous day's closing price, market capitalization, bid/ask prices, opening price, closing price, high price, and low price.

Additionally, it provides the latest news for each stock via the Finnhub API.


###In addition, it supports a user system that enables sign-up, login, logout, and password changes using nickname + password authentication (SHA-256 hash).

###It also supports English, Chinese, Persian, French, Spanish, Japanese, and Korean.


###The detailed features include:

- Data cached for **20 minutes** to prevent API rate limiting

- Cache timestamp displayed on screen

This has been included.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Streamlit |
| Charts | Plotly |
| Market Data | TwelveData |
| News | Finnhub API |
| Database | NeonDatabase |
| Hosting | Streamlit Community Cloud |


## How to Use
1. Sign up and log in. (This is not mandatory, but it is recommended if you wish to save your analysis records.)

2. Select an analysis period.

3. Enter the tickers. (A ticker is a 4-digit code representing a company (usually 4 digits, but 5 digits also exist). Examples include MSFT, AAPL, GOOGL, NVDA, etc.) [Up to 10 companies are allowed]

4. Click “Analyze”!! Then, enjoy the graphs and information. If you wish to save the data, you can also download a PDF file.


## Deployment

Deployed to Streamlit Community Cloud.

Add all secret keys in App Settings → Secrets on the Streamlit Cloud Dashboard.

---

## Note

- This app is for analytics purposes only.

- Stock data is updated every 20 minutes to avoid API usage limits.

Therefore, it is not perfectly real-time....

## Additional Features I Want to Add

Additional features I want to add include...

- I want to support cryptocurrencies such as Bitcoin and Ethereum, not just stocks.

- A website with smooth speed achieved through a major transition to the C programming language.


## Production Team

| Role | Name |

|---|---|

| Developer | Ditto A. |

| Feedback Provider | Miguel |

| AI Assistant | ChatGPT and Gemini |
