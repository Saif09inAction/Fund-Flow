// Stock Insights & Prediction Widget
// This script runs in the browser and populates the #stock-insights-section

const INSIGHTS_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'UNH', name: 'UnitedHealth Group' }
];

const NEWS_API_KEY = '374f955dce454569aa224db30d2d1e80'; // Replace with your NewsAPI key
const FINNHUB_API_KEY = 'd1mqrd1r01qlvnp44df0d1mqrd1r01qlvnp44dfg';

const section = document.getElementById('stock-insights-section');
const content = document.getElementById('stock-insights-content');

function showInsightsLoading() {
  section.style.display = 'block';
  content.innerHTML = '<div style="width:100%;text-align:center;padding:2rem 0;">'
    + '<span class="loader" style="display:inline-block;width:48px;height:48px;border:5px solid #e0e7ff;border-top:5px solid #7f53ac;border-radius:50%;animation:spin 1s linear infinite;"></span>'
    + '<div style="margin-top:1rem;color:#888;font-size:1.1rem;">Loading stock insights...</div>'
    + '</div>';
}

function hideInsightsLoading() {
  section.style.display = 'block';
}

function predictLinear(prices) {
  const n = prices.length;
  const x = [...Array(n).keys()];
  const xMean = x.reduce((a, b) => a + b) / n;
  const yMean = prices.reduce((a, b) => a + b) / n;
  const numerator = x.reduce((sum, xi, i) => sum + ((xi - xMean) * (prices[i] - yMean)), 0);
  const denominator = x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  const predicted = slope * n + intercept;
  return { predicted, slope, intercept, xMean, yMean, x, y: prices };
}

function simpleSentiment(text) {
  // Very basic: count positive/negative words
  const posWords = ['gain','up','rise','positive','growth','profit','strong','beat','record','high','bull','surge','increase','improve','optimistic'];
  const negWords = ['loss','down','fall','negative','drop','decline','weak','miss','low','bear','plunge','decrease','worse','pessimistic'];
  let score = 0;
  const words = text.toLowerCase().split(/\W+/);
  for (const w of words) {
    if (posWords.includes(w)) score++;
    if (negWords.includes(w)) score--;
  }
  return score;
}

async function fetchLast5Prices(symbol) {
  // Use Finnhub candles API for last 10 days, get last 5 closes
  const now = Math.floor(Date.now() / 1000);
  const tenDaysAgo = now - 12 * 24 * 60 * 60;
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${tenDaysAgo}&to=${now}&token=${FINNHUB_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.s === 'ok' && data.c && data.c.length >= 5) {
    return data.c.slice(-5);
  }
  throw new Error('Not enough price data');
}

async function fetchNews(symbol) {
  const url = `https://newsapi.org/v2/everything?q=${symbol}&language=en&pageSize=5&apiKey=${NEWS_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.articles) {
    return data.articles.map(a => ({ title: a.title, desc: a.description }));
  }
  return [];
}

function renderMiniChart(prices) {
  // Simple SVG line chart
  const w = 90, h = 36, pad = 6;
  const min = Math.min(...prices), max = Math.max(...prices);
  const points = prices.map((p, i) => {
    const x = pad + (i * (w - 2 * pad) / (prices.length - 1));
    const y = h - pad - ((p - min) / (max - min || 1)) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(' ');
  return `<svg width="${w}" height="${h}" style="background:#f7fafd;border-radius:8px;"><polyline points="${points}" fill="none" stroke="#647dee" stroke-width="2" /></svg>`;
}

function verdictText(predicted, current, sentiment) {
  if (predicted > current && sentiment > 0) return '<span style="color:#27ae60;font-weight:600;">Suggested to Watch</span>';
  if (predicted < current && sentiment < 0) return '<span style="color:#e74c3c;font-weight:600;">Negative Outlook</span>';
  return '<span style="color:#888;">Neutral</span>';
}

async function renderInsights() {
  showInsightsLoading();
  let html = '';
  for (const stock of INSIGHTS_STOCKS) {
    try {
      const prices = await fetchLast5Prices(stock.symbol);
      const { predicted } = predictLinear(prices);
      const current = prices[prices.length - 1];
      const news = await fetchNews(stock.symbol);
      const newsText = news.map(n => n.title + ' ' + (n.desc || '')).join('. ');
      const sentiment = simpleSentiment(newsText);
      html += `<div class="card" style="min-width:270px;max-width:320px;flex:1 1 270px;background:#f7fafd;border-radius:12px;box-shadow:0 2px 8px rgba(100,125,222,0.06);padding:1.2rem 1.1rem;display:flex;flex-direction:column;gap:0.7rem;">
        <div style="display:flex;align-items:center;gap:0.7rem;">
          <span style="font-size:1.5rem;color:#7f53ac;">📈</span>
          <span style="font-weight:700;font-size:1.1rem;color:#4b3fa7;">${stock.name} <span style="color:#888;font-size:0.98em;">(${stock.symbol})</span></span>
        </div>
        <div style="display:flex;align-items:center;gap:0.7rem;">
          ${renderMiniChart(prices)}
          <div style="font-size:0.98rem;color:#888;">Last 5: <br><b>${prices.map(p => p.toFixed(2)).join(', ')}</b></div>
        </div>
        <div style="font-size:0.98rem;">Predicted: <b style="color:#1976d2;">$${predicted.toFixed(2)}</b> <span style="color:#888;">Current: $${current.toFixed(2)}</span></div>
        <div style="font-size:0.98rem;">Sentiment: <b style="color:${sentiment > 0 ? '#27ae60' : sentiment < 0 ? '#e74c3c' : '#888'};">${sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'}</b></div>
        <div style="font-size:0.98rem;">Verdict: ${verdictText(predicted, current, sentiment)}</div>
        <div style="margin-top:0.5rem;">
          <div style="font-size:0.97rem;color:#647dee;font-weight:600;margin-bottom:0.2rem;">Latest News:</div>
          <ul style="padding-left:1.1em;margin:0;">
            ${news.map((n, i) => `<li style="color:#222;font-size:0.97rem;margin-bottom:0.1em;">${n.title}</li>`).join('')}
          </ul>
        </div>
      </div>`;
    } catch (err) {
      html += `<div class="card" style="min-width:270px;max-width:320px;flex:1 1 270px;background:#f7fafd;border-radius:12px;box-shadow:0 2px 8px rgba(100,125,222,0.06);padding:1.2rem 1.1rem;display:flex;flex-direction:column;gap:0.7rem;align-items:center;justify-content:center;min-height:220px;">
        <span style="font-size:1.5rem;color:#e74c3c;">⚠️</span>
        <div style="color:#e74c3c;font-weight:600;">${stock.name} (${stock.symbol})</div>
        <div style="color:#888;font-size:0.97rem;">Could not load data.</div>
      </div>`;
    }
  }
  content.innerHTML = html;
  hideInsightsLoading();
}

// Add spinner animation
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }`;
document.head.appendChild(style);

// Start rendering
if (section && content) {
  renderInsights();
} 