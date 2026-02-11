#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_URL = 'https://gamma-api.polymarket.com/markets';
const HIST_DIR = 'historical';
const MAX_POINTS = 96; // 24 horas (96 x 15min)

// Ensure historical directory exists
if (!fs.existsSync(HIST_DIR)) {
  fs.mkdirSync(HIST_DIR);
}

// Crypto keywords
const CRYPTO_KEYWORDS = /\b(bitcoin|btc|ethereum|eth|solana|sol|polkadot|dot|cardano|ada|avalanche|avax|chainlink|link|polygon|matic|litecoin|ltc|dogecoin|doge|shiba|shib|arbitrum|arb|optimism|op|curve|crv|uniswap|uni|aave|compound|comp|maker|mkr|ripple|xrp|stellar|xlm|monero|xmr|zcash|zec|dash|etc|neo|iota|trx|eos|cosmos|atom|tezos|xtz|flow|chiliz|chz|sandbox|sand|decentraland|mana|axie|axs|crypto|blockchain|defi|nft|web3)\b/;

async function fetchCryptoMarkets() {
  const url = `${API_URL}?active=true&closed=false&limit=500`;
  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
  }

  let markets = JSON.parse(text);
  if (!Array.isArray(markets)) markets = markets.markets || markets.data || [];

  // Filter crypto
  return markets.filter(m => {
    const text = (m.question + ' ' + (m.events?.[0]?.slug || '')).toLowerCase();
    return CRYPTO_KEYWORDS.test(text);
  });
}

function extractYesPrice(market) {
  let prices = market.outcomePrices;
  if (!prices) return null;
  if (typeof prices === 'string') {
    try { prices = JSON.parse(prices); } catch (e) { return null; }
  }
  return parseFloat(prices[0]) || null;
}

function extractNoPrice(market) {
  let prices = market.outcomePrices;
  if (!prices) return null;
  if (typeof prices === 'string') {
    try { prices = JSON.parse(prices); } catch (e) { return null; }
  }
  return parseFloat(prices[1]) || null;
}

function getMarketId(market) {
  return `${market.id}`;
}

function getHistoricalPath(marketId) {
  return path.join(HIST_DIR, `${marketId}.json`);
}

function loadHistory(marketId) {
  const histPath = getHistoricalPath(marketId);
  if (!fs.existsSync(histPath)) {
    return [];
  }
  try {
    const data = JSON.parse(fs.readFileSync(histPath, 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveHistory(marketId, history) {
  const histPath = getHistoricalPath(marketId);
  // Keep only last MAX_POINTS
  const trimmed = history.slice(-MAX_POINTS);
  fs.writeFileSync(histPath, JSON.stringify(trimmed, null, 2));
}

function addSnapshot(marketId, yesPrice, noPrice, volume, timestamp) {
  const history = loadHistory(marketId);
  history.push({
    t: Math.floor(timestamp / 1000), // seconds
    yes: yesPrice,
    no: noPrice,
    v: parseFloat(volume) || 0
  });
  saveHistory(marketId, history);
  return history.length;
}

async function main() {
  console.log('Collecting 15min historical data for crypto markets...');
  
  try {
    const markets = await fetchCryptoMarkets();
    console.log(`Found ${markets.length} crypto markets`);

    let collected = 0;
    for (const market of markets) {
      const marketId = getMarketId(market);
      const yesPrice = extractYesPrice(market);
      const noPrice = extractNoPrice(market);

      if (yesPrice === null || noPrice === null) continue;

      const volume = market.volume || 0;
      const timestamp = new Date(market.updatedAt).getTime();

      const count = addSnapshot(marketId, yesPrice, noPrice, volume, timestamp);
      console.log(`✓ ${market.question.substring(0, 40)}... (${count} points)`);
      collected++;
    }

    console.log(`\n✅ Collected ${collected} markets. Historical data stored in ${HIST_DIR}/`);
    console.log(`   Each market has up to ${MAX_POINTS} data points (latest first)`);
    
    // Generate summary
    const summary = {
      generatedAt: new Date().toISOString(),
      totalMarkets: collected,
      historicalDir: HIST_DIR,
      maxPoints: MAX_POINTS
    };
    fs.writeFileSync('history-summary.json', JSON.stringify(summary, null, 2));
    console.log('📊 history-summary.json updated');

  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

main();
