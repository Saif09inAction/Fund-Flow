// Use 10 major stocks for free tier (fewer API calls, lower credit usage)
const STOCK_LIST = [
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

const DEFAULT_USER = {
  name: 'Demo User',
  email: 'demo@example.com',
  wallet: 20000,
  portfolio: {},
  buyPrices: {}, // Store average buy price for each stock
  transactionHistory: [], // Store all buy/sell transactions
  totalProfit: 0 // Track total profit/loss
};

function getUser() {
  const user = localStorage.getItem('user');
  if (user) return JSON.parse(user);
  localStorage.setItem('user', JSON.stringify(DEFAULT_USER));
  return { ...DEFAULT_USER };
}
function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

// Function to update portfolio value in localStorage for dashboard
function updatePortfolioValueForDashboard() {
  const user = getUser();
  let portfolioValue = 0;
  
  for (const symbol in user.portfolio) {
    const stock = STOCK_LIST.find(s => s.symbol === symbol);
    if (stock && stock.price) {
      portfolioValue += user.portfolio[symbol] * stock.price;
    }
  }
  
  localStorage.setItem('fundflow_portfolio_value', `₹${portfolioValue.toFixed(2)}`);
}

// Function to update portfolio prices in background without blocking UI
async function updatePortfolioPricesInBackground() {
  const user = getUser();
  if (!user.portfolio || Object.keys(user.portfolio).length === 0) {
    return; // No portfolio to update
  }
  
  // Show subtle loading indicator
  const portfolioTitle = document.querySelector('#main-content h2');
  if (portfolioTitle) {
    portfolioTitle.innerHTML = 'Portfolio <span style="font-size:0.8em;color:#888;">(updating prices...)</span>';
  }
  
  // Only update prices for stocks in user's portfolio
  const portfolioSymbols = Object.keys(user.portfolio);
  let hasUpdates = false;
  
  for (const symbol of portfolioSymbols) {
    const stock = STOCK_LIST.find(s => s.symbol === symbol);
    if (stock) {
      try {
        const newPrice = await fetchFinnhubPrice(symbol);
        if (newPrice !== undefined && newPrice !== stock.price) {
          stock.price = newPrice;
          hasUpdates = true;
        }
      } catch (error) {
        // Silently fail for background updates
        console.log(`Failed to update price for ${symbol}:`, error);
      }
    }
  }
  
  // If we have updates, re-render the portfolio
  if (hasUpdates) {
    renderPortfolio();
  }
  
  // Remove loading indicator
  if (portfolioTitle) {
    portfolioTitle.innerHTML = 'Portfolio';
  }
}

function getWishlist() {
  return JSON.parse(localStorage.getItem('wishlist') || '[]');
}
function setWishlist(arr) {
  localStorage.setItem('wishlist', JSON.stringify(arr));
}

function toggleWishlist(symbol) {
  let wishlist = getWishlist();
  if (wishlist.includes(symbol)) {
    wishlist = wishlist.filter(s => s !== symbol);
    showToast('Removed from wishlist');
  } else {
    wishlist.push(symbol);
    showToast('Added to wishlist');
  }
  setWishlist(wishlist);
  // Update star icon in modal if open
  if (document.getElementById('details-modal') && !document.getElementById('details-modal').classList.contains('hidden')) {
    showDetailsModal(symbol);
  }
}

const API_KEY = 'd1mqrd1r01qlvnp44df0d1mqrd1r01qlvnp44dfg';

// Helper: batch array into chunks of n
function batchArray(arr, n) {
  const result = [];
  for (let i = 0; i < arr.length; i += n) {
    result.push(arr.slice(i, i + n));
  }
  return result;
}

async function fetchFinnhubPrice(symbol) {
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.c) {
    return data.c; // Current price
  }
  return undefined;
}

async function fetchFinnhubHistory(symbol) {
  const now = Math.floor(Date.now() / 1000);
  const oneMonthAgo = now - (30 * 24 * 60 * 60); // 30 days ago
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${oneMonthAgo}&to=${now}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.s === 'ok' && data.c) {
    return data.c; // Close prices
  }
  return [];
}

// Fetch live prices and history for all stocks (Finnhub, one by one)
async function fetchAllStockData() {
  for (const stock of STOCK_LIST) {
    stock.price = await fetchFinnhubPrice(stock.symbol);
    stock.history = await fetchFinnhubHistory(stock.symbol);
    // Change %
    if (stock.history.length > 1 && stock.price !== undefined) {
      const prev = stock.history[stock.history.length - 2];
      stock.change = prev ? (((stock.price - prev) / prev) * 100).toFixed(2) : 0;
    } else {
      stock.change = 0;
    }
  }
}

// Remove showLoading and update renderMarketsLive to not show spinner
async function fetchAndUpdateMarkets() {
  await fetchAllStockData();
  renderMarkets();
}

let marketInterval = null;
function startMarketInterval() {
  if (marketInterval) clearInterval(marketInterval);
  renderMarkets(); // Show current data immediately
  fetchAndUpdateMarkets(); // Fetch new data in background
  marketInterval = setInterval(fetchAndUpdateMarkets, 60000); // Update every 60 seconds to conserve API credits
}

function stopMarketInterval() {
  if (marketInterval) {
    clearInterval(marketInterval);
    marketInterval = null;
  }
}

// Main render with live data
async function renderMarkets() {
  const main = document.getElementById('main-content');
  let html = `<h2 style="margin-bottom:1.5rem;">All Popular Instruments</h2><table class="stock-table"><thead><tr><th>Instrument</th><th>Last Price</th><th>Change %</th><th colspan="3">Actions</th></tr></thead><tbody>`;
  for (const stock of STOCK_LIST) {
    const priceCell = stock.price !== undefined ? `₹${stock.price}` : '<span style="color:#888;">Loading…</span>';
    const changeCell = stock.price !== undefined ? ((stock.change > 0 ? '+' : '') + stock.change + '%') : '—';
    html += `<tr>
      <td class="instrument">${stock.name} <span style="color:#888;font-size:0.95em;">(${stock.symbol})</span></td>
      <td class="price">${priceCell}</td>
      <td class="${stock.change >= 0 ? 'change-pos' : 'change-neg'}">${changeCell}</td>
      <td><button class="action-btn" onclick="showTradeModal('${stock.symbol}','buy')">Buy</button></td>
      <td><button class="action-btn sell" onclick="showTradeModal('${stock.symbol}','sell')">Sell</button></td>
      <td><button class="details-btn" onclick="showDetailsModal('${stock.symbol}')">Details</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  main.innerHTML = html;
  
  // Update portfolio value in localStorage for dashboard
  updatePortfolioValueForDashboard();
}



function showTradeModal(symbol, type) {
  const stock = STOCK_LIST.find(s => s.symbol === symbol);
  const user = getUser();
  const owned = user.portfolio[symbol] || 0;
  let html = `<h3 style="color:#1976d2;">${type === 'buy' ? 'Buy' : 'Sell'} ${stock.name} (${stock.symbol})</h3>`;
  html += `<p>Current Price: <b>₹${stock.price}</b></p>`;
  if (type === 'buy') {
    html += `<p>Wallet: <b>₹${user.wallet}</b></p>`;
    html += `<input type="number" id="trade-qty" min="1" max="${Math.floor(user.wallet / stock.price)}" placeholder="Quantity" />`;
    html += `<button class="action-btn" onclick="tradeStock('${symbol}','buy')">Buy</button>`;
  } else {
    html += `<p>Owned: <b>${owned}</b></p>`;
    html += `<input type="number" id="trade-qty" min="1" max="${owned}" placeholder="Quantity" />`;
    html += `<button class="action-btn sell" onclick="tradeStock('${symbol}','sell')">Sell</button>`;
  }
  document.getElementById('trade-body').innerHTML = html;
  document.getElementById('trade-modal').classList.remove('hidden');
}

function tradeStock(symbol, type) {
  const qty = parseInt(document.getElementById('trade-qty').value);
  if (!qty || qty < 1) return showToast('Enter valid quantity', 'error');
  const stock = STOCK_LIST.find(s => s.symbol === symbol);
  const user = getUser();

  if (type === 'buy') {
    const cost = qty * stock.price;
    if (cost > user.wallet) return showToast('Not enough balance', 'error');

    // Update wallet
    user.wallet -= cost;

    // Update portfolio
    user.portfolio[symbol] = (user.portfolio[symbol] || 0) + qty;

    // Update average buy price
    const prevQty = (user.portfolio[symbol] || 0) - qty;
    const prevAvg = user.buyPrices[symbol] || 0;
    user.buyPrices[symbol] = prevQty > 0
      ? ((prevAvg * prevQty + stock.price * qty) / (prevQty + qty))
      : stock.price;

    // Add to transaction history
    user.transactionHistory.push({
      id: Date.now(),
      date: new Date().toLocaleString(),
      symbol: symbol,
      name: stock.name,
      type: 'buy',
      quantity: qty,
      price: stock.price,
      total: cost
    });

    showToast(`Bought ${qty} shares of ${stock.symbol} at ₹${stock.price}`);
  } else {
    if ((user.portfolio[symbol] || 0) < qty) return showToast('Not enough shares', 'error');

    const sellValue = qty * stock.price;
    const avgBuyPrice = user.buyPrices[symbol] || 0;
    const profit = (stock.price - avgBuyPrice) * qty;

    // Update wallet: add sell value (profit/loss is included in this calculation)
    user.wallet += sellValue;
    user.totalProfit += profit;

    // Update portfolio
    user.portfolio[symbol] -= qty;
    if (user.portfolio[symbol] === 0) {
      delete user.portfolio[symbol];
      delete user.buyPrices[symbol];
    }

    // Add to transaction history
    user.transactionHistory.push({
      id: Date.now(),
      date: new Date().toLocaleString(),
      symbol: symbol,
      name: stock.name,
      type: 'sell',
      quantity: qty,
      price: stock.price,
      total: sellValue,
      profit: profit
    });

    const profitText = profit >= 0 ? `Profit: ₹${profit.toFixed(2)}` : `Loss: ₹${Math.abs(profit).toFixed(2)}`;
    showToast(`Sold ${qty} shares of ${stock.symbol} at ₹${stock.price}. ${profitText}`);
  }

  setUser(user);
  closeTradeModal();
  renderMarkets();
  renderWallet();
  renderPortfolio();
}


function showDetailsModal(symbol, showGraph = false) {
  const stock = STOCK_LIST.find(s => s.symbol === symbol);
  const sellPrice = (stock.price - 2).toLocaleString();
  const buyPrice = (stock.price + 2).toLocaleString();
  const change = stock.change;
  const changeColor = change >= 0 ? '#27ae60' : '#e74c3c';
  const changeArrow = change >= 0 ? '▲' : '▼';
  const buyers = 73, sellers = 27; // Dummy
  const traderRank = 2;
  const traderViews = '928K';
  const traderPopularity = 'High';
  const wishlist = getWishlist();
  const isWish = wishlist.includes(symbol);
  let html = `
    <div class="details-modal-theme">
      <div class="details-header">
        <div class="details-icon">🔥</div>
        <div class="details-title">
          <div class="details-name">${stock.name} <span class="details-symbol">(${stock.symbol})</span></div>
          <div class="details-change" style="color:${changeColor}">${changeArrow} ${change}%</div>
        </div>
        <div class="details-actions">
          <span class="details-star" onclick="toggleWishlist('${symbol}')" style="cursor:pointer;${isWish ? 'color:#ffd700;' : ''}">${isWish ? '★' : '☆'}</span>
        </div>
      </div>
      <div class="details-prices">
        <div class="details-price-box">
          <div class="details-price-label">To sell</div>
          <div class="details-price-value">${sellPrice}</div>
        </div>
        <div class="details-price-box">
          <div class="details-price-label">Buy</div>
          <div class="details-price-value">${buyPrice}</div>
        </div>
      </div>
      <div class="details-section details-trader-activity">
        <div class="details-section-title">Trader Activity</div>
        <div class="details-rank">#${traderRank} in Most Traded (Last 24 hours).</div>
        <div class="details-trends">
          <div class="details-trend-box">
            <div class="details-trend-icon">👁️</div>
            <div class="details-trend-value">${traderViews}</div>
            <div class="details-trend-label">Instrument display</div>
          </div>
          <div class="details-trend-box">
            <div class="details-trend-icon">🔥</div>
            <div class="details-trend-value">${traderPopularity}</div>
            <div class="details-trend-label">Trading popularity</div>
          </div>
        </div>
        <div class="details-bar-title">Current data on traders</div>
        <div class="details-bar-row">
          <span class="details-sellers">${sellers}% Sellers</span>
          <span class="details-buyers">${buyers}% Buyers</span>
        </div>
        <div class="details-bar-bg">
          <div class="details-bar-sellers" style="width:${sellers}%;"></div>
          <div class="details-bar-buyers" style="width:${buyers}%;"></div>
        </div>
      </div>
      <button class="details-disclaimer-btn" onclick="showDisclaimerModal()">Disclaimer</button>
    </div>
  `;
  document.getElementById('details-body').innerHTML = html;
  document.getElementById('details-modal').classList.remove('hidden');
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.background = '#e74c3c';
  toast.textContent = msg;
  document.getElementById('toast-container').appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function closeTradeModal() {
  document.getElementById('trade-modal').classList.add('hidden');
}
function closeDetailsModal() {
  document.getElementById('details-modal').classList.add('hidden');
}

// Navigation handlers
function setActiveNav(id) {
  document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  stopMarketInterval(); // Stop auto-refresh by default
}

document.getElementById('nav-markets').onclick = (e) => {
  e.preventDefault();
  setActiveNav('nav-markets');
  startMarketInterval(); // Only Markets page auto-refreshes
};
document.getElementById('nav-portfolio').onclick = (e) => {
  e.preventDefault();
  setActiveNav('nav-portfolio');
  // Render portfolio immediately with cached data
  renderPortfolio();
  // Update prices in background if needed (non-blocking)
  updatePortfolioPricesInBackground();
};
document.getElementById('nav-wallet').onclick = (e) => {
  e.preventDefault();
  setActiveNav('nav-wallet');
  renderWallet();
};
document.getElementById('nav-wishlist').onclick = (e) => {
  e.preventDefault();
  setActiveNav('nav-wishlist');
  renderWishlist();
};
document.getElementById('nav-history').onclick = (e) => {
  e.preventDefault();
  setActiveNav('nav-history');
  renderHistory();
};

document.getElementById('close-trade').onclick = closeTradeModal;
document.getElementById('close-details').onclick = closeDetailsModal;

function renderPortfolio() {
  const user = getUser();
  const main = document.getElementById('main-content');

  // Calculate current portfolio value and total profit
  let portfolioValue = 0;
  let unrealizedProfit = 0;

  for (const symbol in user.portfolio) {
    const stock = STOCK_LIST.find(s => s.symbol === symbol);
    const quantity = user.portfolio[symbol];
    const buyPrice = user.buyPrices[symbol] || 0;
    
    if (stock && stock.price) {
      // Use current market price
      const currentValue = quantity * stock.price;
      const buyValue = quantity * buyPrice;
      portfolioValue += currentValue;
      unrealizedProfit += (currentValue - buyValue);
    } else if (buyPrice > 0) {
      // Fallback to buy price if current price not available
      const currentValue = quantity * buyPrice;
      portfolioValue += currentValue;
      // No unrealized profit calculation since we're using buy price
    }
  }

  const totalProfit = user.totalProfit + unrealizedProfit;

  // Save portfolio value to localStorage for dashboard
  localStorage.setItem('fundflow_portfolio_value', `₹${portfolioValue.toFixed(2)}`);

  main.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">
      <span style="font-size:2.2rem;background:#e3eaf1;border-radius:10px;padding:0.5rem 0.7rem;">💼</span>
      <h2 style="margin:0;color:#1976d2;">Portfolio</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1.5rem;margin-bottom:2rem;">
      <div class="card">
        <div style="font-size:1.1rem;font-weight:600;color:#1976d2;margin-bottom:0.5rem;">Portfolio Value</div>
        <div style="font-size:1.8rem;font-weight:700;color:#1976d2;">₹${portfolioValue.toFixed(2)}</div>
      </div>
      <div class="card">
        <div style="font-size:1.1rem;font-weight:600;color:#1976d2;margin-bottom:0.5rem;">Total Profit/Loss</div>
        <div style="font-size:1.8rem;font-weight:700;color:${totalProfit >= 0 ? '#27ae60' : '#e74c3c'};">₹${totalProfit.toFixed(2)}</div>
      </div>
    </div>
    <h3 style="margin-bottom:1rem;">Your Stocks</h3>
  `;

  if (Object.keys(user.portfolio).length === 0) {
    main.innerHTML += `<div class="card" style="text-align:center;">
      <div style="font-size:2.5rem;">📈</div>
      <div style="font-size:1.1rem;margin:0.7rem 0 0.3rem 0;">No stocks in your portfolio yet.</div>
      <div style="color:#888;">Buy your first stock from the <b>Markets</b> page!</div>
    </div>`;
  } else {
    let tableHtml = `<table class="stock-table"><thead><tr><th>Stock</th><th>Quantity</th><th>Avg Buy Price</th><th>Current Price</th><th>Current Value</th><th>Profit/Loss</th><th>Action</th></tr></thead><tbody>`;
    for (const symbol in user.portfolio) {
      const stock = STOCK_LIST.find(s => s.symbol === symbol);
      const qty = user.portfolio[symbol];
      const avgBuyPrice = user.buyPrices[symbol] || 0;
      let currentPrice = '';
      let currentValue = '';
      let profit = '';
      let profitColor = '#888';
      let profitPrefix = '';
      if (stock && stock.price) {
        currentPrice = `₹${stock.price}`;
        currentValue = `₹${(qty * stock.price).toFixed(2)}`;
        profit = (stock.price - avgBuyPrice) * qty;
        profitPrefix = profit >= 0 ? '+' : '';
        profitColor = profit >= 0 ? '#27ae60' : '#e74c3c';
        profit = `${profitPrefix}₹${profit.toFixed(2)}`;
      } else {
        currentPrice = '<span style="color:#888;">Loading...</span>';
        currentValue = `₹${(qty * avgBuyPrice).toFixed(2)}`;
        profit = '—';
      }
      const stockName = stock ? stock.name : symbol;
      tableHtml += `<tr>
        <td class="instrument">${stockName} <span style="color:#888;font-size:0.95em;">(${symbol})</span></td>
        <td>${qty}</td>
        <td>₹${avgBuyPrice.toFixed(2)}</td>
        <td>${currentPrice}</td>
        <td>${currentValue}</td>
        <td style="color:${profitColor};font-weight:600;">${profit}</td>
        <td><button class="action-btn sell" onclick="showTradeModal('${symbol}','sell')">Sell</button></td>
      </tr>`;
    }
    tableHtml += '</tbody></table>';
    main.innerHTML += tableHtml;
  }
}

// Add this function to reset user data to default
function resetUserData() {
  localStorage.setItem('user', JSON.stringify({ ...DEFAULT_USER }));
  // Reset portfolio value in localStorage for dashboard
  localStorage.setItem('fundflow_portfolio_value', '₹0');
  showToast('Wallet and all data reset!');
  // Only re-render the currently active page
  const activeNav = document.querySelector('.main-nav a.active').id;
  switch (activeNav) {
    case 'nav-wallet':
      renderWallet();
      break;
    case 'nav-portfolio':
      renderPortfolio();
      break;
    case 'nav-history':
      renderHistory();
      break;
    case 'nav-wishlist':
      renderWishlist();
      break;
    default:
      renderMarkets();
  }
}

function renderWallet() {
  const user = getUser();
  const main = document.getElementById('main-content');
  let portfolioValue = 0;
  for (const symbol in user.portfolio) {
    const stock = STOCK_LIST.find(s => s.symbol === symbol);
    const quantity = user.portfolio[symbol];
    const buyPrice = user.buyPrices[symbol] || 0;
    
    if (stock && stock.price) {
      // Use current market price
      portfolioValue += quantity * stock.price;
    } else if (buyPrice > 0) {
      // Fallback to buy price if current price not available
      portfolioValue += quantity * buyPrice;
    }
  }
  
  // Save portfolio value to localStorage for dashboard
  localStorage.setItem('fundflow_portfolio_value', `₹${portfolioValue.toFixed(2)}`);
  main.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">
      <span style="font-size:2.2rem;background:#e3eaf1;border-radius:10px;padding:0.5rem 0.7rem;">💰</span>
      <h2 style="margin:0;color:#1976d2;">Wallet</h2>
    </div>
    <div class="card" style="text-align:center;">
      <div style="font-size:1.1rem;font-weight:600;color:#1976d2;margin-bottom:0.5rem;">Wallet Balance</div>
      <div style="font-size:2.2rem;font-weight:700;color:#27ae60;">₹${user.wallet.toFixed(2)}</div>
      <div style="margin-top:1rem;color:#888;">Total Portfolio Value: <b>₹${portfolioValue.toFixed(2)}</b></div>
      <button id="reset-wallet-btn" class="action-btn" style="margin-top:1.5rem;background:#e74c3c;color:#fff;">Reset Wallet & Data</button>
    </div>
  `;
  // Add event listener for reset button
  document.getElementById('reset-wallet-btn').onclick = resetUserData;
}

function renderWishlist() {
  const main = document.getElementById('main-content');
  const wishlist = getWishlist();
  main.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">
      <span style="font-size:2.2rem;background:#e3eaf1;border-radius:10px;padding:0.5rem 0.7rem;">⭐</span>
      <h2 style="margin:0;color:#1976d2;">Wishlist</h2>
    </div>
  `;
  if (!wishlist || wishlist.length === 0) {
    main.innerHTML += `
      <div class="card" style="text-align:center;min-height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;">
        <div style="font-size:2.5rem;">⭐</div>
        <div style="font-size:1.1rem;margin:0.7rem 0 0.3rem 0;">No items in your wishlist yet.</div>
        <div style="color:#888;">Click the star on a stock's details page to add it here!</div>
      </div>
    `;
    return;
  }
  main.innerHTML += `<table class="stock-table"><thead><tr><th>Instrument</th><th>Last Price</th><th>Change %</th><th colspan="3">Actions</th></tr></thead><tbody>`;
  for (const symbol of wishlist) {
    const stock = STOCK_LIST.find(s => s.symbol === symbol);
    if (!stock) continue;
    main.innerHTML += `<tr>
      <td class="instrument">${stock.name} <span style="color:#888;font-size:0.95em;">(${stock.symbol})</span></td>
      <td class="price">${stock.price !== undefined ? `₹${stock.price}` : '<span style=\'color:#888;\'>Loading…</span>'}</td>
      <td class="${stock.change >= 0 ? 'change-pos' : 'change-neg'}">${stock.price !== undefined ? (stock.change > 0 ? '+' : '') + stock.change + '%' : '—'}</td>
      <td><button class="action-btn" onclick="showTradeModal('${stock.symbol}','buy')">Buy</button></td>
      <td><button class="action-btn sell" onclick="showTradeModal('${stock.symbol}','sell')">Sell</button></td>
      <td><button class="details-btn" onclick="showDetailsModal('${stock.symbol}')">Details</button></td>
    </tr>`;
  }
  main.innerHTML += '</tbody></table>';
}

// Expose for inline onclick
window.showTradeModal = showTradeModal;
window.showDetailsModal = showDetailsModal;
window.tradeStock = tradeStock;

// Placeholder for live price fetching (to be implemented with API)
async function fetchLivePrice(symbol) {
  // TODO: Replace with real API call
  return STOCK_LIST.find(s => s.symbol === symbol)?.price || 0;
}
// Placeholder for live history fetching (to be implemented with API)
async function fetchLiveHistory(symbol) {
  // TODO: Replace with real API call
  return STOCK_LIST.find(s => s.symbol === symbol)?.history || [];
}
// In the future, use these in setInterval to update prices and graphs in real time.

// Initial render: show Markets and start interval
setActiveNav('nav-markets');
startMarketInterval();
document.getElementById('user-info').textContent = getUser().name;

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  
  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const searchTerm = searchInput.value.toLowerCase().trim();
      
      if (searchTerm) {
        // Filter stocks based on search term
        const filteredStocks = STOCK_LIST.filter(stock => 
          stock.name.toLowerCase().includes(searchTerm) || 
          stock.symbol.toLowerCase().includes(searchTerm)
        );
        
        if (filteredStocks.length > 0) {
          // Show filtered results
          renderFilteredMarkets(filteredStocks);
          showToast(`Found ${filteredStocks.length} stock(s) matching "${searchTerm}"`);
        } else {
          showToast(`No stocks found matching "${searchTerm}"`, 'error');
        }
      } else {
        // Show all stocks if search is empty
        renderMarkets();
      }
    });
    
    // Clear search and show all stocks when input is cleared
    searchInput.addEventListener('input', function() {
      if (this.value.trim() === '') {
        renderMarkets();
      }
    });
  }
});

// Function to render filtered markets
function renderFilteredMarkets(filteredStocks) {
  const main = document.getElementById('main-content');
  let html = `<h2 style="margin-bottom:1.5rem;">Search Results</h2><table class="stock-table"><thead><tr><th>Instrument</th><th>Last Price</th><th>Change %</th><th colspan="3">Actions</th></tr></thead><tbody>`;
  
  for (const stock of filteredStocks) {
    const priceCell = stock.price !== undefined ? `₹${stock.price}` : '<span style="color:#888;">Loading…</span>';
    const changeCell = stock.price !== undefined ? ((stock.change > 0 ? '+' : '') + stock.change + '%') : '—';
    html += `<tr>
      <td class="instrument">${stock.name} <span style="color:#888;font-size:0.95em;">(${stock.symbol})</span></td>
      <td class="price">${priceCell}</td>
      <td class="${stock.change >= 0 ? 'change-pos' : 'change-neg'}">${changeCell}</td>
      <td><button class="action-btn" onclick="showTradeModal('${stock.symbol}','buy')">Buy</button></td>
      <td><button class="action-btn sell" onclick="showTradeModal('${stock.symbol}','sell')">Sell</button></td>
      <td><button class="details-btn" onclick="showDetailsModal('${stock.symbol}')">Details</button></td>
    </tr>`;
  }
  
  html += '</tbody></table>';
  main.innerHTML = html;
} 

// Add History page
function renderHistory() {
  const user = getUser();
  const main = document.getElementById('main-content');
  main.innerHTML = `
    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">
      <span style="font-size:2.2rem;background:#e3eaf1;border-radius:10px;padding:0.5rem 0.7rem;">🕒</span>
      <h2 style="margin:0;color:#1976d2;">Transaction History</h2>
    </div>
    <div style="margin-bottom:1rem;">
      <button class="action-btn" onclick="clearHistory()" style="background:#e74c3c;">Clear History</button>
    </div>
  `;
  if (user.transactionHistory.length === 0) {
    main.innerHTML += `<div class="card" style="text-align:center;">
      <div style="font-size:2.5rem;">🕒</div>
      <div style="font-size:1.1rem;margin:0.7rem 0 0.3rem 0;">No transactions yet.</div>
      <div style="color:#888;">Your buy and sell activity will appear here.</div>
    </div>`;
  } else {
    let tableHtml = `<table class="stock-table"><thead><tr><th>Date</th><th>Stock</th><th>Type</th><th>Quantity</th><th>Price</th><th>Total</th><th>Profit/Loss</th></tr></thead><tbody>`;
    const reversedHistory = [...user.transactionHistory].reverse();
    for (const transaction of reversedHistory) {
      const typeColor = transaction.type === 'buy' ? '#27ae60' : '#e74c3c';
      const profitCell = transaction.profit !== undefined ? 
        `<td style="color:${transaction.profit >= 0 ? '#27ae60' : '#e74c3c'};font-weight:600;">${transaction.profit >= 0 ? '+' : ''}₹${transaction.profit.toFixed(2)}</td>` :
        '<td>-</td>';
      tableHtml += `<tr>
        <td>${transaction.date}</td>
        <td class="instrument">${transaction.name} <span style="color:#888;font-size:0.95em;">(${transaction.symbol})</span></td>
        <td style="color:${typeColor};font-weight:600;">${transaction.type.toUpperCase()}</td>
        <td>${transaction.quantity}</td>
        <td>₹${transaction.price}</td>
        <td>₹${transaction.total}</td>
        ${profitCell}
      </tr>`;
    }
    tableHtml += '</tbody></table>';
    main.innerHTML += tableHtml;
  }
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all transaction history? This action cannot be undone.')) {
    const user = getUser();
    user.transactionHistory = [];
    setUser(user);
    showToast('Transaction history cleared');
    renderHistory();
  }
}

// Add History navigation
document.getElementById('nav-history').onclick = (e) => { e.preventDefault(); setActiveNav('nav-history'); renderHistory(); };

// Disclaimer modal logic
function showDisclaimerModal() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<div class='modal-content'><span class='close' onclick='this.parentNode.parentNode.remove()'>&times;</span><div style='padding:1.2rem 0.5rem;max-width:400px;'>This is a demo trading platform for educational purposes only. No real trades are executed. Prices and data may not reflect real market conditions.</div></div>`;
  document.body.appendChild(modal);
} 

// Load and show stock insights after main JS loads
window.addEventListener('DOMContentLoaded', () => {
  const script = document.createElement('script');
  script.src = 'stock-insights.js';
  document.body.appendChild(script);
}); 