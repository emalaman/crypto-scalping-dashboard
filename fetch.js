#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_URL = 'https://gamma-api.polymarket.com/markets';
const MIN_SPREAD = 0.015;
const MAX_SPREAD = 0.50;
const MIN_VOLUME = 10000;
const HIST_DIR = 'historical';

// Crypto keywords detection
const CRYPTO_KEYWORDS = /\b(bitcoin|btc|ethereum|eth|solana|sol|polkadot|dot|cardano|ada|avalanche|avax|chainlink|link|polygon|matic|litecoin|ltc|dogecoin|doge|shiba|shib|arbitrum|arb|optimism|op|curve|crv|uniswap|uni|aave|compound|comp|maker|mkr|ripple|xrp|stellar|xlm|monero|xmr|zcash|zec|dash|etc|neo|iota|trx|eos|cosmos|atom|tezos|xtz|flow|chiliz|chz|sandbox|sand|decentraland|mana|axie|axs|crypto|blockchain|defi|nft|web3)\b/;

// Load historical data for a market
function loadHistory(marketId) {
  const histPath = path.join(HIST_DIR, `${marketId}.json`);
  if (!fs.existsSync(histPath)) {
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(histPath, 'utf8'));
    return Array.isArray(data) ? data : null;
  } catch (e) {
    return null;
  }
}

// Crypto symbols mapping
function extractCryptoSymbol(question, eventSlug) {
  const text = (question + ' ' + (eventSlug || '')).toLowerCase();

  // Exclude sports contexts more narrowly - only when combined with team/league names
  const sportsTeams = /\b(colorado avalanche|los angeles lakers|new york knicks|chicago bulls|boston celtics|golden state warriors|dallas mavericks|houston rockets|san antonio spurs|phoenix suns|miami heat|orlando magic|atlanta hawks|cleveland cavaliers|oklahoma city thunder|milwaukee bucks|toronto raptors|indiana pacers|minnesota timberwolves|detroit pistons|charlotte hornets|washington wizards|brooklyn nets|sacramento kings|memphis grizzlies|utah jazz|new orleans pelicans)\b/;
  if (sportsTeams.test(text)) {
    return null;
  }

  const mappings = [
    { pattern: /\bbitcoin\b|\bbtc\b/, symbol: 'BTCUSDT' },
    { pattern: /\bethereum\b|\beth\b/, symbol: 'ETHUSDT' },
    { pattern: /\bsolana\b|\bsol\b/, symbol: 'SOLUSDT' },
    { pattern: /\bpolkadot\b|\bdot\b/, symbol: 'DOTUSDT' },
    { pattern: /\bcardano\b|\bada\b/, symbol: 'ADAUSDT' },
    { pattern: /\bavalanche\b|\bavax\b/, symbol: 'AVAXUSDT' },
    { pattern: /\bchainlink\b|\blink\b/, symbol: 'LINKUSDT' },
    { pattern: /\bpolygon\b|\bmatic\b/, symbol: 'MATICUSDT' },
    { pattern: /\blitecoin\b|\bltc\b/, symbol: 'LTCUSDT' },
    { pattern: /\bdogecoin\b|\bdoge\b/, symbol: 'DOGEUSDT' },
    { pattern: /\bshiba?\b|\bshib\b/, symbol: 'SHIBUSDT' },
    { pattern: /\barbitrum\b|\barb\b/, symbol: 'ARBUSDT' },
    { pattern: /\boptimism\b|\bop\b/, symbol: 'OPUSDT' },
    { pattern: /\bcurve\b|\bcrv\b/, symbol: 'CRVUSDT' },
    { pattern: /\buniswap\b|\buni\b/, symbol: 'UNIUSDT' },
    { pattern: /\baave\b/, symbol: 'AAVEUSDT' },
    { pattern: /\bcompound\b|\bcomp\b/, symbol: 'COMPUSDT' },
    { pattern: /\bmaker\b|\bmkr\b/, symbol: 'MKRUSDT' },
    { pattern: /\bripple\b|\bxrp\b/, symbol: 'XRPUSDT' },
    { pattern: /\bstellar\b|\bxlm\b/, symbol: 'XLMUSDT' },
    { pattern: /\bmonero\b|\bxmr\b/, symbol: 'XMRUSDT' },
    { pattern: /\bzcash\b|\bzec\b/, symbol: 'ZECUSDT' },
    { pattern: /\bdash\b/, symbol: 'DASHUSDT' },
    { pattern: /\betc\b/, symbol: 'ETCUSDT' },
    { pattern: /\bneo\b|\bneeo\b/, symbol: 'NEOUSDT' },
    { pattern: /\biota\b|\bmiota\b/, symbol: 'IOTAUSDT' },
    { pattern: /\btron\b|\btrx\b/, symbol: 'TRXUSDT' },
    { pattern: /\beos\b/, symbol: 'EOSUSDT' },
    { pattern: /\bcosmos\b|\batom\b/, symbol: 'ATOMUSDT' },
    { pattern: /\btezos\b|\bxtz\b/, symbol: 'XTZUSDT' },
    { pattern: /\bflow\b|\bhash\b/, symbol: 'FLOWUSDT' },
    { pattern: /\bchiliz\b|\bchz\b/, symbol: 'CHZUSDT' },
    { pattern: /\bsandbox\b|\bsand\b/, symbol: 'SANDUSDT' },
    { pattern: /\bdecentraland\b|\bmana\b/, symbol: 'MANAUSDT' },
    { pattern: /\baxie\s+infinity\b|\baxs\b/, symbol: 'AXSUSDT' },
    { pattern: /\bthailand\b|\bthai\b/, symbol: 'THAIUSDT' }
  ];

  for (const mapping of mappings) {
    if (mapping.pattern.test(text)) {
      return mapping.symbol;
    }
  }

  // Check for price targets
  const priceMatch = text.match(/\$(\d+(?:\.\d+)?)\s*(?:k|m|b|milhão|milh[ãa]o|bilh[ãa]o|trilh[ãa]o)?/i);
  if (priceMatch) {
    return 'BTCUSDT';
  }

  return null;
}

function getSignal(price, side) {
  if (side === 'YES') {
    if (price < 0.48) return 'STRONG_BUY';
    if (price < 0.49) return 'BUY';
    return 'NEUTRAL';
  } else if (side === 'NO') {
    if (price < 0.48) return 'STRONG_SELL';
    if (price < 0.49) return 'SELL';
    return 'NEUTRAL';
  }
  return 'NEUTRAL';
}

async function fetchMarkets() {
  try {
    const url = `${API_URL}?active=true&closed=false&limit=500`;
    console.log(`Fetching markets from ${url}`);
    const res = await fetch(url);
    const text = await res.text();

    if (!res.ok) {
      console.log(`HTTP ${res.status}: ${text.substring(0, 200)}...`);
      throw new Error(`HTTP ${res.status}`);
    }

    let markets = JSON.parse(text);
    if (!Array.isArray(markets)) markets = markets.markets || markets.data || [];
    console.log(`Fetched ${markets.length} markets`);
    return markets.filter(m => m.active === true || m.closed === false);
  } catch (error) {
    console.error('Fetch failed:', error.message);
    return [];
  }
}

function analyzeMarket(market) {
  let prices = market.outcomePrices;
  if (!prices) return null;
  if (typeof prices === 'string') {
    try { prices = JSON.parse(prices); } catch (e) { return null; }
  }

  const yes = parseFloat(prices[0]) || 0, no = parseFloat(prices[1]) || 0;
  if (yes === 0 && no === 0) return null;

  const yesSpread = Math.abs(yes - 0.5), noSpread = Math.abs(no - 0.5);
  const maxSpread = Math.max(yesSpread, noSpread);
  const underpricedSide = yes < 0.5 ? 'YES' : no < 0.5 ? 'NO' : 'BALANCED';
  const underpricedPrice = underpricedSide === 'YES' ? yes : no;

  let marketUrl = `https://polymarket.com/market/${market.id}`;
  if (market.events && market.events[0] && market.events[0].slug && market.slug) {
    marketUrl = `https://polymarket.com/event/${market.events[0].slug}/${market.slug}`;
  }

  // Calculate timeLeft and duration
  let timeLeft = 0;
  let durationHours = 0;
  const startIso = market.startDateIso || market.startDate;
  const endIso = market.endDateIso || market.endDate;
  
  if (startIso && endIso) {
    const startTime = new Date(startIso).getTime();
    const endTime = new Date(endIso).getTime();
    durationHours = Math.round((endTime - startTime) / (1000 * 60 * 60));
  }
  
  if (endIso) {
    const endTime = new Date(endIso).getTime();
    timeLeft = Math.max(0, endTime - Date.now());
  }

  return {
    id: market.id,
    question: market.question,
    category: 'Crypto',
    yes, no,
    yesSpread, noSpread, maxSpread,
    underpricedSide, underpricedPrice,
    signal: getSignal(underpricedPrice, underpricedSide),
    volume: parseFloat(market.volume) || 0,
    liquidity: parseFloat(market.liquidity) || 0,
    updatedAt: market.updatedAt,
    timeLeft,
    durationHours,
    is15Min: durationHours <= 1, // approximate: 15min markets have very short total duration
    marketUrl,
    cryptoSymbol: extractCryptoSymbol(market.question, market.events?.[0]?.slug)
  };
}

async function main() {
  console.log('Fetching and analyzing crypto markets with historical data...');

  // Fetch markets
  const markets = await fetchMarkets();

  // Filter crypto markets (any duration) - exclude sports teams
  const cryptoMarkets = markets.filter(m => {
    const text = (m.question + ' ' + (m.events?.[0]?.slug || '')).toLowerCase();
    const isCrypto = CRYPTO_KEYWORDS.test(text);
    // Exclude sports teams specifically
    const sportsTeams = /\b(colorado avalanche|los angeles lakers|new york knicks|chicago bulls|boston celtics|golden state warriors|dallas mavericks|houston rockets|san antonio spurs|phoenix suns|miami heat|orlando magic|atlanta hawks|cleveland cavaliers|oklahoma city thunder|milwaukee bucks|toronto raptors|indiana pacers|minnesota timberwolves|detroit pistons|charlotte hornets|washington wizards|brooklyn nets|sacramento kings|memphis grizzlies|utah jazz|new orleans pelicans)\b/;
    const isSportsTeam = sportsTeams.test(text);
    return isCrypto && !isSportsTeam;
  });

  console.log(`Found ${cryptoMarkets.length} crypto-related markets`);

  // Analyze and load history
  const analyzed = [];
  for (const market of cryptoMarkets) {
    const analyzedMarket = analyzeMarket(market);
    if (!analyzedMarket) continue;

    // Load historical data
    const history = loadHistory(market.id);
    if (history && history.length > 0) {
      analyzedMarket.history = history;
      analyzedMarket.historyPoints = history.length;
    } else {
      analyzedMarket.history = null;
      analyzedMarket.historyPoints = 0;
    }

    analyzed.push(analyzedMarket);
  }

  // Filter by spread, volume, timeLeft, and history
  const filtered = analyzed.filter(o => 
    o && 
    o.maxSpread >= MIN_SPREAD && 
    o.maxSpread <= MAX_SPREAD && 
    o.volume >= MIN_VOLUME && 
    o.timeLeft > 0 &&
    o.historyPoints > 0
  ).sort((a, b) => a.maxSpread - b.maxSpread);

  console.log(`Found ${filtered.length} crypto opportunities with history`);

  if (filtered.length === 0 && analyzed.length > 0) {
    console.warn('No opportunities with history. Using all analyzed crypto markets (even without history)...');
    const allCrypto = analyzed.filter(Boolean).sort((a, b) => a.maxSpread - b.maxSpread);
    console.log(`Using all ${allCrypto.length} crypto markets`);
    filtered = allCrypto;
  }

  const output = {
    generatedAt: new Date().toISOString(),
    totalCount: filtered.length,
    filters: { minSpread: MIN_SPREAD, maxSpread: MAX_SPREAD, minVolume: MIN_VOLUME },
    opportunities: filtered
  };

  fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
  console.log('✅ data.json generated with', filtered.length, 'crypto opportunities (with 15min history)');
}

main().catch(err => {
  console.error('❌ Fetch failed:', err);
  process.exit(1);
});
