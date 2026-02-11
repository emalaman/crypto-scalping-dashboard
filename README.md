# 🚀 Crypto Scalping Dashboard

Polymarket crypto opportunities with 15-minute price history snapshots.

**Live Demo:** https://emalaman.github.io/crypto-scalping-dashboard/

---

## ✨ Features

- 🔍 **Crypto-focused**: Filters Polymarket markets for crypto-related events (excludes sports teams)
- 📈 **15min History Charts**: Line charts showing YES price evolution from Polymarket snapshots (collected every 15min)
- 🎯 **Scalping Signals**: BUY/SELL signals based on spread analysis
- 🎨 **Modern UI**: Dark theme with responsive grid layout
- 📊 **Advanced Filters**: Filter by signal, spread, and history timeframe
- ⏱️ **Auto-refresh**: Data updates every 15 minutes (via GitHub Actions)

---

## 📊 Data Sources & Charting

⚠️ **Important**: The Polymarket Gamma API does not expose dedicated 15-minute markets (`/crypto/15M` page uses a different data source). This dashboard shows **all crypto-related markets** (any duration) with the following:

- **Market data**: Polymarket Gamma API (prices, volume, end date)
- **Historical prices**: Snapshots taken every 15 minutes and stored locally (`historical/` directory)
- **Charts**: Line graphs of YES contract prices over time (from our own snapshots)

Currently, the only opportunity meeting our criteria (spread 1.5%-50%, volume > $10k, active, with history) is:

| Market | Symbol | Signal | Spread | Volume | History |
|--------|--------|--------|--------|--------|---------|
| Will bitcoin hit $1m before GTA VI? | BTCUSDT | BUY | 1.5% | $3.08M | ✅ |

*Note: As more snapshots are collected (every 15min), the chart will show a line with multiple points.*

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS + Tailwind CSS
- **Charts**: TradingView Lightweight Charts
- **Data Sources**:
  - Polymarket Gamma API (market data)
  - Custom snapshots (15min intervals, stored in `historical/`)
- **Deployment**: GitHub Pages + GitHub Actions

---

## 🚀 Quick Start (Local)

```bash
cd crypto-scalping-dashboard
npm install
npm run collect-history  # Take 15min snapshot of crypto markets
npm run fetch            # Fetch market data + load historical snapshots
npm run generate         # Generate index.html
npm run build            # collect-history + fetch + generate
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

1. **collect-history.js**:
   - Pulls active crypto markets from Polymarket API
   - Takes a snapshot of YES/NO prices and volume
   - Appends to `historical/{marketId}.json` (circular buffer, max 96 points = 24h)
   - Updates `history-summary.json`

2. **fetch.js**:
   - Pulls active markets from Polymarket API
   - Filters by crypto keywords (bitcoin, ethereum, solana, etc.) and excludes sports teams
   - Loads historical snapshots from `historical/` directory
   - Filters by spread (1.5%-50%), volume (>$10k), and active status
   - Outputs `data.json`

3. **generate.js**:
   - Loads `data.json` + `index.html` template
   - Replaces `%OPPORTUNITIES_JSON%` with data
   - Writes final `index.html`

4. **GitHub Actions** (deploy.yml):
   - Runs every 15 minutes or on push
   - Repeats: collect-history → fetch → generate → commit → push
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

1. **Limited 15min markets**: The Polymarket Gamma API does not surface the `/crypto/15M` markets directly. This dashboard shows all crypto events (any duration). Historical snapshots are still collected every 15min.
2. **False positives**: Some non-crypto markets may slip through (e.g., "Avalanche" hockey team). Sports-team blacklist mitigates this.
3. **Symbol mapping**: Not all crypto projects are mapped yet. Can be extended in `extractCryptoSymbol()`.
4. **Rate limits**: Gamma API rate limits may affect large fetches; current limit=500 is safe.

---

## 🔧 Customization

- **Change page size**: Edit `PAGE_SIZE` in `index.html` template
- **Adjust filters**: Modify `MIN_SPREAD`, `MAX_SPREAD`, `MIN_VOLUME` in `fetch.js`
- **History buffer size**: Change `MAX_HISTORY_POINTS` in `collect-history.js` (default 96 = 24h at 15min intervals)
- **Snapshot frequency**: Adjust GitHub Actions schedule in `.github/workflows/deploy.yml`
- **Template styling**: Edit CSS in `<head>` of `index.html`
- **Symbol mapping**: Extend `extractCryptoSymbol()` in `fetch.js` to recognize more crypto tokens

---

## 📝 License

MIT

---

**Made with 🧠 by EmilIA**
