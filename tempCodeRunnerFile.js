const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const yahooFinance = require('yahoo-finance2').default;
const Sentiment = require('sentiment');
const axios = require('axios');
const sentiment = new Sentiment();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

// MongoDB Setup
mongoose.connect('mongodb://127.0.0.1:27017/slackAuth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String }));
const Workspace = mongoose.model('Workspace', new mongoose.Schema({ name: String, teammates: [String] }));

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'slack-clone-secret', resave: false, saveUninitialized: false }));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Home Route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Auth Routes
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, password });
  if (!user) return res.send('Invalid credentials. <a href="/">Try again</a>');
  req.session.username = username;
  res.redirect('/home.html');
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.send('User already exists. <a href="/">Login</a>');
  await new User({ username, password }).save();
  res.redirect('/');
});

app.get('/session-username', (req, res) => {
  res.json({ username: req.session.username || null });
});

// Workspace Routes
app.get('/create-workspace.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'create-workspace.html')));
app.get('/company-name.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'company-name.html')));
app.get('/add-teammates.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'add-teammates.html')));

app.post('/create-workspace', async (req, res) => {
  const { workspace } = req.body;
  if (!workspace) return res.send('Workspace name is required.');
  await new Workspace({ name: workspace, teammates: [] }).save();
  res.redirect(`/add-teammates.html?workspace=${workspace}`);
});

app.post('/add-teammate', async (req, res) => {
  const { workspaceName, teammate } = req.body;
  const userExists = await User.findOne({ username: teammate });
  if (!userExists) {
    return res.send(`User ${teammate} not found. <a href="/add-teammates.html?workspace=${workspaceName}">Try again</a>`);
  }
  await Workspace.findOneAndUpdate({ name: workspaceName }, { $addToSet: { teammates: teammate } });
  res.redirect('/home.html');
});

// AI Stock Predictor
const NEWS_API_KEY = '374f955dce454569aa224db30d2d1e80';

async function predictStock(symbol) {
  try {
    const stockURL = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d`;
    const stockRes = await axios.get(stockURL);
    const prices = stockRes.data.chart.result[0].indicators.quote[0].close.filter(p => p !== null);
    if (prices.length < 2) return null;

    let xSum = 0, ySum = 0, xySum = 0, x2Sum = 0, n = prices.length;
    for (let i = 0; i < n; i++) {
      xSum += i;
      ySum += prices[i];
      xySum += i * prices[i];
      x2Sum += i * i;
    }

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
    const intercept = (ySum - slope * xSum) / n;
    const mathPrediction = slope * n + intercept;

    const newsRes = await axios.get(`https://newsapi.org/v2/everything?q=${symbol}&apiKey=${NEWS_API_KEY}`);
    const topArticles = newsRes.data.articles.slice(0, 5);
    const headlinesText = topArticles.map(a => a.title).join(". ");
    const sentimentScore = sentiment.analyze(headlinesText).score;
    const finalPrediction = mathPrediction + sentimentScore * 0.5;

    const headlines = topArticles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.source.name
    }));

    return {
      symbol,
      prices: prices.map(p => p.toFixed(2)),
      mathPrediction: mathPrediction.toFixed(2),
      sentimentScore,
      finalPrediction: finalPrediction.toFixed(2),
      headlines
    };
  } catch (err) {
    return null;
  }
}

// EJS Page Route
app.get('/ai.html', async (req, res) => {
  const defaultSymbols = ['AAPL', 'TSLA', 'MSFT', 'NYKAA.NS', 'RELIANCE.NS'];
  const predictions = [];
  for (let symbol of defaultSymbols) {
    const result = await predictStock(symbol);
    if (result) predictions.push(result);
  }
  res.render('index', { searched: null, defaultPredictions: predictions, error: null });
});

// EJS Form Submission
app.post('/predict', async (req, res) => {
  const symbol = req.body.symbol.toUpperCase();
  const searched = await predictStock(symbol);
  const defaultSymbols = ['AAPL', 'TSLA', 'MSFT', 'NYKAA.NS', 'RELIANCE.NS'];
  const predictions = [];
  for (let sym of defaultSymbols) {
    const result = await predictStock(sym);
    if (result) predictions.push(result);
  }
  if (!searched) {
    return res.render('index', {
      searched: null,
      defaultPredictions: predictions,
      error: '❌ Error fetching data. Try a valid stock symbol.'
    });
  }
  res.render('index', { searched, defaultPredictions: predictions, error: null });
});

// JSON API Route (for frontend fetch/JS)
app.get('/api/predict/:symbol', async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const result = await predictStock(symbol);
  if (!result) {
    return res.status(404).json({ error: 'Prediction failed or invalid symbol' });
  }
  res.json(result);
});

// Socket.IO Chat
io.on('connection', (socket) => {
  socket.on('set username', (username) => socket.data.username = username);
  socket.on('chat message', (msg) => {
    const username = socket.data.username || 'Anonymous';
    io.emit('chat message', `[${username}]: ${msg}`);
  });
});

// Catch-all Redirect
app.use((req, res) => res.redirect('/'));

// Start Server
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
