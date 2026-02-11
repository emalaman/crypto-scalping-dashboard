# 🚀 Crypto Scalping Dashboard

Real-time Polymarket crypto opportunities with 15-minute Binance chart integration.

**Live Demo:** (to be deployed on GitHub Pages)

---

## ✨ Features

- 🔍 **Crypto-focused**: Filters Polymarket markets for crypto-related events
- 📈 **15min Charts**: Real-time candlestick charts from Binance
- 🎯 **Scalping Signals**: BUY/SELL signals based on spread analysis
- 🎨 **Modern UI**: Dark theme with responsive grid layout
- 📊 **Advanced Filters**: Filter by signal strength and spread
- ⏱️ **Auto-refresh**: Data updates every 5 minutes (via GitHub Actions)

---

## 📊 Current Opportunities (Sample)

| Market | Symbol | Signal | Spread | Volume | Chart |
|--------|--------|--------|--------|--------|-------|
| Will bitcoin hit $1m before GTA VI? | BTCUSDT | BUY | 1.5% | $3.08M | ✅ |
| Will the Colorado Avalanche win... | AVAXUSDT | STRONG_BUY | 28% | $1.19M | ✅ |

*(Note: AVAX chart included, though market is about NHL team)*

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS + Tailwind CSS
- **Charts**: TradingView Lightweight Charts
- **Data Sources**:
  - Polymarket Gamma API (market data)
  - Binance API (15min candle data)
- **Deployment**: GitHub Pages + GitHub Actions

---

## 🚀 Quick Start (Local)

```bash
cd crypto-scalping-dashboard
npm install
npm run fetch   # Fetch market data + Binance candles
npm run generate # Generate index.html
npm run build   # Fetch + generate
```

Open `index.html` in browser.

---

## ⚙️ Configuration

### Environment Variables
- `POLYMARKET_API_KEY`: Optional API key for Polymarket (higher rate limits)

### Filters (adjust in fetch.js):
- `MIN_SPREAD = 0.015` (1.5%)
- `MAX_SPREAD = 0.50` (50%)
- `MIN_VOLUME = 10000` ($10k)

---

## 📦 Project Structure

```
crypto-scalping-dashboard/
├── fetch.js          # Fetch Polymarket + Binance data
├── generate.js       # Generate HTML from data.json
├── index.html        # Template (with %OPPORTUNITIES_JSON%)
├── data.json         # Generated data (auto)
├── package.json
└── .github/workflows/deploy.yml  # Auto-deploy
```

---

## 🐙 Deploy to GitHub Pages

1. **Create repo** on GitHub: `crypto-scalping-dashboard`
2. **Add remote**: `git remote add origin https://github.com/yourusername/crypto-scalping-dashboard.git`
3. **Push**: `git push -u origin main`
4. **Enable Pages**: Settings → Pages → Source: `GitHub Actions`
5. Access: `https://yourusername.github.io/crypto-scalping-dashboard/`

---

## 🔄 How It Works

1. **fetch.js**:
   - Pulls active markets from Polymarket API
   - Filters by crypto keywords (bitcoin, ethereum, solana, etc.)
   - Maps each market to a Binance symbol (e.g., BTC → BTCUSDT)
   - Fetches 100 candles (15min intervals) from Binance
   - Outputs `data.json`

2. **generate.js**:
   - Loads `data.json` + `index.html` template
   - Replaces `%OPPORTUNITIES_JSON%` with data
   - Writes final `index.html`

3. **GitHub Actions** (deploy.yml):
   - Runs every 5 minutes or on push
   - Repeats fetch → generate → commit → push
   - Triggers GitHub Pages rebuild

---

## 🎯 Filtering Logic

Only markets with:
- ✅ Spread between 1.5% - 50%
- ✅ Volume ≥ $10k
- ✅ Defined end date (`timeLeft > 0`)
- ✅ Crypto-related keywords in question

---

## 📈 Chart Integration

Uses [Lightweight Charts](https://tradingview.github.io/lightweight-charts/) by TradingView.
- Shows 50 most recent 15-minute candles
- Green/Red candlesticks
- Auto-resizes with window

---

## 🐛 Known Issues

1. **False positives**: Some non-crypto markets may match crypto symbols (e.g., "Avalanche" hockey team → AVAX). Needs smarter filtering.
2. **Symbol mapping**: Not all crypto projects are mapped yet. Can be extended in `extractCryptoSymbol()`.
3. **Rate limits**: Binance API has public rate limits (1200 weight/minute). Should be fine for ~20 symbols.

---

## 🔧 Customization

- **Change page size**: Edit `PAGE_SIZE` in `index.html` template
- **Adjust filters**: Modify `MIN_SPREAD`, `MAX_SPREAD`, `MIN_VOLUME` in `fetch.js`
- **Chart timeframe**: Change `limit` parameter in `fetchCandleData()` (currently 100 candles × 15min = 25 hours)
- **Template styling**: Edit CSS in `<head>` of `index.html`

---

## 📝 License

MIT

---

**Made with 🧠 by EmilIA**
