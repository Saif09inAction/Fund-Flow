async function fetchStocks() {
  const res = await fetch('/api/stocks');
  const data = await res.json();
  displayStocks(data);
}

async function searchStock() {
  const input = document.getElementById('search-input').value.trim().toUpperCase();
  if (!input) return;

  try {
    const res = await fetch(`/api/stocks/${input}`);
    if (!res.ok) return alert('Symbol not found!');
    const stock = await res.json();
    displayStocks([stock]);
  } catch (err) {
    alert('Error fetching stock');
  }
}

function displayStocks(stocks) {
  const container = document.getElementById('stocks-container');
  container.innerHTML = '';
  stocks.forEach(stock => {
    const div = document.createElement('div');
    div.className = 'stock';
    div.innerHTML = `
      <div class="stock-header">${stock.symbol}
        <span class="verdict-badge ${stock.finalVerdict.includes('✅') ? 'positive' : 'negative'}">
          ${stock.finalVerdict}
        </span>
      </div>
      <div class="section-title">Last 5 Prices:</div>
      <div>${stock.last5Prices.map(p => `$${p.toFixed(2)}`).join(', ')}</div>
      <div class="section-title">Prediction:</div>
      <div class="prediction-grid">
        <div>Predicted:</div><div class="highlight">$${stock.predicted.toFixed(2)}</div>
        <div>Current:</div><div class="highlight">$${stock.currentPrice.toFixed(2)}</div>
        <div>Direction:</div><div>${stock.predicted > stock.currentPrice ? 'Up' : 'Down'}</div>
        <div>News Sentiment:</div><div>${stock.sentimentScore > 0 ? 'Positive' : 'Negative'}</div>
      </div>
      <div class="section-title">Recent News:</div>
      <ul class="news-list">${stock.news.map(n => `<li>${n}</li>`).join('')}</ul>
    `;
    container.appendChild(div);
  });
}

fetchStocks();
