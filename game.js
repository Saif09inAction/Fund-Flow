// Global Variables
let currentUser = null;
let userXP = 0;
let userCoins = 0;
let currentGame = null;

// Stock Wallet Balance: initialize from localStorage or set default
let stockWalletBalance = 0;
const STOCK_WALLET_KEY = 'fundflow_stock_wallet_balance';

// Function to sync stock wallet balance from stock.js
function syncStockWalletBalance() {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    stockWalletBalance = userData.wallet || 1000000;
  } else {
    stockWalletBalance = 1000000; // Default starting balance
  }
  localStorage.setItem(STOCK_WALLET_KEY, stockWalletBalance.toString());
  updateStockWallet();
}

// Initialize stock wallet balance
if (localStorage.getItem(STOCK_WALLET_KEY)) {
  stockWalletBalance = parseInt(localStorage.getItem(STOCK_WALLET_KEY));
  if (isNaN(stockWalletBalance)) {
    syncStockWalletBalance();
  }
} else {
  syncStockWalletBalance();
}

// Game Data
const gameData = {
  budgetMaster: {
    score: 0,
    level: 1,
    highScore: 0,
    balance: 50000,
    emergencyFund: 0,
    savings: 0,
    expenses: 0,
    month: 1
  },
  triviaRace: {
    score: 0,
    level: 1,
    highScore: 0,
    position: 0,
    lives: 3,
    currentQuestion: 0
  },
  investmentSim: {
    score: 0,
    level: 1,
    highScore: 0,
    portfolioValue: 100000,
    year: 2024,
    totalReturn: 0,
    portfolio: {
      stocks: 40000,
      bonds: 30000,
      gold: 20000,
      crypto: 10000
    }
  },
  saveToWin: {
    score: 0,
    level: 1,
    highScore: 0,
    income: 30000,
    month: 1,
    goalsMet: 0,
    goals: [
      { name: "Emergency Fund", target: 50000, current: 0, completed: false },
      { name: "Vacation Fund", target: 30000, current: 0, completed: false },
      { name: "New Bike", target: 15000, current: 0, completed: false }
    ]
  },
  fraudDetective: {
    score: 0,
    level: 1,
    highScore: 0,
    casesSolved: 0,
    accuracy: 0,
    currentCase: 0
  },
  wealthWorld: {
    score: 0,
    level: 1,
    highScore: 0,
    netWorth: 0,
    assetsCount: 0,
    day: 1,
    portfolio: [],
    marketEvents: [],
    totalInvested: 0,
    totalReturn: 0
  }
};

// Educational Content
const educationalTips = {
  budget: [
    "💡 Tip: Always save 20% of your income for emergencies and future goals.",
    "💡 Tip: The 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
    "💡 Tip: Emergency funds should cover 3-6 months of expenses.",
    "💡 Tip: Track your expenses to identify spending patterns."
  ],
  investment: [
    "💡 Tip: Diversification reduces risk by spreading investments across different assets.",
    "💡 Tip: Compound interest works best over long periods - start early!",
    "💡 Tip: Stocks offer higher returns but more risk than bonds.",
    "💡 Tip: Gold is often used as a hedge against inflation."
  ],
  fraud: [
    "💡 Tip: If it sounds too good to be true, it probably is!",
    "💡 Tip: Never share your banking passwords or OTP with anyone.",
    "💡 Tip: Legitimate companies won't pressure you to invest immediately.",
    "💡 Tip: Always verify investment opportunities with official sources."
  ],
  savings: [
    "💡 Tip: Set specific, measurable savings goals.",
    "💡 Tip: Automate your savings to make it effortless.",
    "💡 Tip: Pay yourself first - save before spending.",
    "💡 Tip: Review and adjust your savings plan regularly."
  ],
  trivia: [
    "💡 Tip: Understanding compound interest is key to long-term wealth building.",
    "💡 Tip: Diversification helps manage investment risk.",
    "💡 Tip: Inflation erodes purchasing power over time.",
    "💡 Tip: Emergency funds provide financial security."
  ]
};

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
  loadUserData();
  updateUserStats();
  loadDailyChallenges();
  loadLeaderboard();
  showGameSelection();
});

// User Management
function loadUserData() {
  const user = localStorage.getItem('fundflow_current_user');
  if (user) {
    currentUser = JSON.parse(user);
    userXP = parseInt(localStorage.getItem('fundflow_user_xp')) || 0;
    userCoins = parseInt(localStorage.getItem('fundflow_user_coins')) || 0;
    
    // Load game data
    Object.keys(gameData).forEach(game => {
      const savedData = localStorage.getItem(`fundflow_${game}_data`);
      if (savedData) {
        gameData[game] = { ...gameData[game], ...JSON.parse(savedData) };
      }
    });
  } else {
    window.location.href = 'game.html';
  }
}

function saveUserData() {
  localStorage.setItem('fundflow_user_xp', userXP.toString());
  localStorage.setItem('fundflow_user_coins', userCoins.toString());
  
  // Save game data
  Object.keys(gameData).forEach(game => {
    localStorage.setItem(`fundflow_${game}_data`, JSON.stringify(gameData[game]));
  });
}

function updateUserStats() {
  document.getElementById('user-xp').textContent = userXP;
  document.getElementById('user-coins').textContent = userCoins;
  
  // Update game stats
  Object.keys(gameData).forEach(game => {
    const highScoreElement = document.getElementById(`${game}-high-score`);
    const levelElement = document.getElementById(`${game}-level`);
    if (highScoreElement) highScoreElement.textContent = gameData[game].highScore;
    if (levelElement) levelElement.textContent = gameData[game].level;
  });
}

// Game Navigation
function showGameSelection() {
  hideAllGames();
  document.getElementById('game-selection').classList.add('active');
  currentGame = null;
}

function selectGame(gameType) {
  hideAllGames();
  currentGame = gameType;
  
  switch(gameType) {
    case 'budget-master':
      document.getElementById('budget-master-game').classList.add('active');
      startBudgetMaster();
      break;
    case 'trivia-race':
      document.getElementById('trivia-race-game').classList.add('active');
      startTriviaRace();
      break;
    case 'investment-sim':
      document.getElementById('investment-sim-game').classList.add('active');
      startInvestmentSim();
      break;
    case 'save-to-win':
      document.getElementById('save-to-win-game').classList.add('active');
      startSaveToWin();
      break;
    case 'fraud-detective':
      document.getElementById('fraud-detective-game').classList.add('active');
      startFraudDetective();
      break;
    case 'wealth-world':
      document.getElementById('wealth-world-game').classList.add('active');
      startWealthWorld();
      break;
  }
}

function hideAllGames() {
  const gameSections = document.querySelectorAll('.game-section');
  gameSections.forEach(section => section.classList.remove('active'));
}

// Budget Master Game
function startBudgetMaster() {
  const game = gameData.budgetMaster;
  updateBudgetDisplay();
  showBudgetEvent();
}

function updateBudgetDisplay() {
  const game = gameData.budgetMaster;
  document.getElementById('budget-score').textContent = game.score;
  document.getElementById('budget-month').textContent = game.month;
  document.getElementById('budget-balance').textContent = game.balance.toLocaleString();
  document.getElementById('emergency-fund').textContent = `₹${game.emergencyFund.toLocaleString()}`;
  document.getElementById('total-savings').textContent = `₹${game.savings.toLocaleString()}`;
  document.getElementById('total-expenses').textContent = `₹${game.expenses.toLocaleString()}`;
}

const budgetEvents = [
  {
    title: "Birthday Party Invitation",
    description: "Your friend is having a birthday party. The gift and dinner will cost ₹2,000.",
    choices: [
      { text: "Attend and buy a nice gift", cost: 2000, xp: 10, message: "Good choice! Social connections are important." },
      { text: "Skip the party to save money", cost: 0, xp: 20, message: "Smart saving! You can celebrate differently." },
      { text: "Attend but give a small gift", cost: 500, xp: 15, message: "Balanced approach - social and financial responsibility." }
    ]
  },
  {
    title: "Medical Emergency",
    description: "You need dental work that costs ₹5,000. Do you have an emergency fund?",
    choices: [
      { text: "Use emergency fund", cost: 5000, xp: 30, message: "Perfect! This is exactly what emergency funds are for." },
      { text: "Take a loan", cost: 5000, xp: 5, message: "Loans can lead to debt. Build an emergency fund first." },
      { text: "Delay treatment", cost: 0, xp: 0, message: "Health should be a priority. Consider building emergency savings." }
    ]
  },
  {
    title: "Shopping Sale",
    description: "There's a 50% off sale on electronics. You've been wanting a new phone for ₹15,000.",
    choices: [
      { text: "Buy it now - great deal!", cost: 15000, xp: 5, message: "Sales can be tempting, but consider if you really need it." },
      { text: "Save for it first", cost: 0, xp: 25, message: "Excellent! Delayed gratification leads to better financial health." },
      { text: "Buy a cheaper model", cost: 8000, xp: 15, message: "Good compromise - you get what you need without overspending." }
    ]
  },
  {
    title: "Investment Opportunity",
    description: "A friend offers you a chance to invest ₹10,000 in their business with 20% return promise.",
    choices: [
      { text: "Invest immediately", cost: 10000, xp: 5, message: "Be cautious with investment promises. Research thoroughly." },
      { text: "Research first", cost: 0, xp: 20, message: "Smart! Always research before investing." },
      { text: "Invest only what you can afford to lose", cost: 5000, xp: 15, message: "Good risk management approach." }
    ]
  }
];

function showBudgetEvent() {
  const event = budgetEvents[Math.floor(Math.random() * budgetEvents.length)];
  const game = gameData.budgetMaster;
  
  document.getElementById('event-title').textContent = event.title;
  document.getElementById('event-description').textContent = event.description;
  
  const choicesContainer = document.getElementById('budget-choices');
  choicesContainer.innerHTML = '';
  
  event.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = choice.text;
    button.onclick = () => makeBudgetChoice(choice, event);
    choicesContainer.appendChild(button);
  });
}

function makeBudgetChoice(choice, event) {
  const game = gameData.budgetMaster;
  
  if (choice.cost <= game.balance) {
    game.balance -= choice.cost;
    game.expenses += choice.cost;
    game.score += choice.xp;
    userXP += choice.xp;
    
    if (game.score > game.highScore) {
      game.highScore = game.score;
    }
    
    showEducationalPopup(choice.message, 'budget');
    updateBudgetDisplay();
    
    // Add monthly income
    setTimeout(() => {
      game.balance += 50000;
      game.month++;
      updateBudgetDisplay();
      
      if (game.month <= 12) {
        showBudgetEvent();
      } else {
        endBudgetGame();
      }
    }, 2000);
  } else {
    alert('Not enough balance! Make a different choice.');
  }
}

function endBudgetGame() {
  const game = gameData.budgetMaster;
  const finalScore = game.score + (game.savings * 0.1) + (game.emergencyFund * 0.2);
  
  showEducationalPopup(`Game Over! Final Score: ${finalScore}. You managed ₹${game.savings.toLocaleString()} in savings and ₹${game.emergencyFund.toLocaleString()} in emergency fund.`, 'budget');
  
  // Reset for next game
  game.balance = 50000;
  game.month = 1;
  game.expenses = 0;
  game.score = 0;
  
  saveUserData();
  updateUserStats();
}

// Trivia Race Game
function startTriviaRace() {
  const game = gameData.triviaRace;
  game.position = 0;
  game.lives = 3;
  game.currentQuestion = 0;
  updateTriviaDisplay();
  showTriviaQuestion();
}

function updateTriviaDisplay() {
  const game = gameData.triviaRace;
  document.getElementById('trivia-score').textContent = game.score;
  document.getElementById('trivia-position').textContent = game.position;
  document.getElementById('trivia-lives').textContent = game.lives;
  
  // Update player position
  const playerAvatar = document.getElementById('player-avatar');
  const trackWidth = document.querySelector('.race-track').offsetWidth - 80;
  const position = (game.position / 10) * trackWidth;
  playerAvatar.style.left = `${20 + position}px`;
}

const triviaQuestions = [
  {
    question: "What is compound interest?",
    choices: [
      "Interest earned only on the principal amount",
      "Interest earned on both principal and accumulated interest",
      "A type of bank fee",
      "A loan payment"
    ],
    correct: 1
  },
  {
    question: "What is diversification in investing?",
    choices: [
      "Putting all money in one stock",
      "Spreading investments across different assets",
      "Selling all investments",
      "Borrowing money to invest"
    ],
    correct: 1
  },
  {
    question: "What is an emergency fund?",
    choices: [
      "Money for vacations",
      "Savings for unexpected expenses",
      "Investment in stocks",
      "Credit card limit"
    ],
    correct: 1
  },
  {
    question: "What is inflation?",
    choices: [
      "When prices decrease over time",
      "When prices increase over time",
      "A type of investment",
      "A bank account"
    ],
    correct: 1
  },
  {
    question: "What is a mutual fund?",
    choices: [
      "A single stock",
      "A pool of money from many investors",
      "A bank account",
      "A type of loan"
    ],
    correct: 1
  }
];

function showTriviaQuestion() {
  const game = gameData.triviaRace;
  const question = triviaQuestions[game.currentQuestion % triviaQuestions.length];
  
  document.getElementById('question-text').textContent = question.question;
  
  const choicesContainer = document.getElementById('trivia-choices');
  choicesContainer.innerHTML = '';
  
  question.choices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = choice;
    button.onclick = () => answerTriviaQuestion(index, question);
    choicesContainer.appendChild(button);
  });
}

function answerTriviaQuestion(selectedIndex, question) {
  const game = gameData.triviaRace;
  const buttons = document.querySelectorAll('#trivia-choices .choice-btn');
  
  buttons.forEach((button, index) => {
    if (index === question.correct) {
      button.classList.add('correct');
    } else if (index === selectedIndex && index !== question.correct) {
      button.classList.add('incorrect');
    }
  });
  
  if (selectedIndex === question.correct) {
    game.score += 10;
    game.position++;
    userXP += 10;
    showEducationalPopup("Correct! You're racing ahead!", 'trivia');
  } else {
    game.lives--;
    showEducationalPopup("Wrong answer! You lost a life.", 'trivia');
  }
  
  game.currentQuestion++;
  updateTriviaDisplay();
  
  setTimeout(() => {
    if (game.lives <= 0) {
      endTriviaGame();
    } else if (game.position >= 10) {
      endTriviaGame();
    } else {
      showTriviaQuestion();
    }
  }, 2000);
}

function endTriviaGame() {
  const game = gameData.triviaRace;
  const finalScore = game.score + (game.position * 5);
  
  if (game.score > game.highScore) {
    game.highScore = game.score;
  }
  
  showEducationalPopup(`Race finished! Final Score: ${finalScore}. You reached position ${game.position}/10.`, 'trivia');
  
  saveUserData();
  updateUserStats();
}

// Investment Simulation Game
function startInvestmentSim() {
  const game = gameData.investmentSim;
  updateInvestmentDisplay();
  showInvestmentOptions();
}

function updateInvestmentDisplay() {
  const game = gameData.investmentSim;
  document.getElementById('portfolio-value').textContent = game.portfolioValue.toLocaleString();
  document.getElementById('simulation-year').textContent = game.year;
  document.getElementById('total-return').textContent = `${game.totalReturn.toFixed(1)}%`;
  
  // Update portfolio breakdown
  const portfolioContainer = document.getElementById('portfolio-breakdown');
  portfolioContainer.innerHTML = '';
  
  Object.entries(game.portfolio).forEach(([asset, value]) => {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.innerHTML = `
      <h4>${asset.charAt(0).toUpperCase() + asset.slice(1)}</h4>
      <div class="value">₹${value.toLocaleString()}</div>
      <div class="return positive">+${(Math.random() * 20 - 5).toFixed(1)}%</div>
    `;
    portfolioContainer.appendChild(item);
  });
}

function showInvestmentOptions() {
  const options = [
    { name: "Stocks", description: "High risk, high potential return", allocation: 0.4 },
    { name: "Bonds", description: "Low risk, stable returns", allocation: 0.3 },
    { name: "Gold", description: "Hedge against inflation", allocation: 0.2 },
    { name: "Crypto", description: "Very high risk, high volatility", allocation: 0.1 }
  ];
  
  const choicesContainer = document.getElementById('investment-choices');
  choicesContainer.innerHTML = '';
  
  options.forEach(option => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.innerHTML = `
      <strong>${option.name}</strong><br>
      <small>${option.description}</small>
    `;
    button.onclick = () => makeInvestmentChoice(option);
    choicesContainer.appendChild(button);
  });
  
  // Show market news
  const newsTexts = [
    "Market conditions are stable with moderate growth expected.",
    "Economic indicators show strong recovery in tech sector.",
    "Inflation concerns are affecting bond yields.",
    "Gold prices are rising due to market uncertainty."
  ];
  document.getElementById('market-news-text').textContent = newsTexts[Math.floor(Math.random() * newsTexts.length)];
}

function makeInvestmentChoice(option) {
  const game = gameData.investmentSim;
  
  // Simulate market performance
  const returns = {
    stocks: Math.random() * 30 - 5, // -5% to +25%
    bonds: Math.random() * 10 - 2,  // -2% to +8%
    gold: Math.random() * 20 - 5,   // -5% to +15%
    crypto: Math.random() * 100 - 30 // -30% to +70%
  };
  
  const assetKey = option.name.toLowerCase();
  const returnRate = returns[assetKey];
  const currentValue = game.portfolio[assetKey];
  const newValue = currentValue * (1 + returnRate / 100);
  
  game.portfolio[assetKey] = newValue;
  game.portfolioValue = Object.values(game.portfolio).reduce((sum, val) => sum + val, 0);
  game.totalReturn = ((game.portfolioValue - 100000) / 100000) * 100;
  game.year++;
  game.score += Math.abs(returnRate);
  
  if (game.score > game.highScore) {
    game.highScore = game.score;
  }
  
  userXP += Math.abs(returnRate);
  
  showEducationalPopup(`Your ${option.name} investment ${returnRate > 0 ? 'gained' : 'lost'} ${Math.abs(returnRate).toFixed(1)}% this year!`, 'investment');
  
  updateInvestmentDisplay();
  
  setTimeout(() => {
    if (game.year <= 2030) {
      showInvestmentOptions();
    } else {
      endInvestmentGame();
    }
  }, 2000);
}

function endInvestmentGame() {
  const game = gameData.investmentSim;
  const finalValue = game.portfolioValue;
  const totalReturn = game.totalReturn;
  
  showEducationalPopup(`Simulation complete! Your portfolio is worth ₹${finalValue.toLocaleString()} with a ${totalReturn.toFixed(1)}% total return over ${game.year - 2024} years.`, 'investment');
  
  saveUserData();
  updateUserStats();
}

// Save to Win Game
function startSaveToWin() {
  const game = gameData.saveToWin;
  updateSaveDisplay();
  showSaveGoals();
}

function updateSaveDisplay() {
  const game = gameData.saveToWin;
  document.getElementById('save-income').textContent = game.income.toLocaleString();
  document.getElementById('save-month').textContent = game.month;
  document.getElementById('goals-met').textContent = game.goalsMet;
}

function showSaveGoals() {
  const game = gameData.saveToWin;
  const goalsContainer = document.getElementById('goals-list');
  goalsContainer.innerHTML = '';
  
  game.goals.forEach((goal, index) => {
    const progress = (goal.current / goal.target) * 100;
    const item = document.createElement('div');
    item.className = `goal-item ${goal.completed ? 'completed' : ''}`;
    item.innerHTML = `
      <h4>${goal.name}</h4>
      <div class="goal-progress">
        <div class="goal-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
      </div>
      <div class="goal-amount">₹${goal.current.toLocaleString()} / ₹${goal.target.toLocaleString()}</div>
    `;
    goalsContainer.appendChild(item);
  });
  
  showAllocationOptions();
}

function showAllocationOptions() {
  const game = gameData.saveToWin;
  const options = [
    { name: "Emergency Fund", amount: 10000, priority: "High" },
    { name: "Vacation Fund", amount: 8000, priority: "Medium" },
    { name: "New Bike", amount: 5000, priority: "Low" },
    { name: "Spend on wants", amount: 7000, priority: "None" }
  ];
  
  const allocationContainer = document.getElementById('allocation-options');
  allocationContainer.innerHTML = '';
  
  options.forEach(option => {
    const button = document.createElement('div');
    button.className = 'allocation-option';
    button.innerHTML = `
      <h4>${option.name}</h4>
      <div class="amount">₹${option.amount.toLocaleString()}</div>
      <small>Priority: ${option.priority}</small>
    `;
    button.onclick = () => makeAllocationChoice(option);
    allocationContainer.appendChild(button);
  });
}

function makeAllocationChoice(option) {
  const game = gameData.saveToWin;
  
  if (option.name === "Emergency Fund") {
    game.goals[0].current += option.amount;
    if (game.goals[0].current >= game.goals[0].target && !game.goals[0].completed) {
      game.goals[0].completed = true;
      game.goalsMet++;
      game.score += 50;
      userXP += 50;
    }
  } else if (option.name === "Vacation Fund") {
    game.goals[1].current += option.amount;
    if (game.goals[1].current >= game.goals[1].target && !game.goals[1].completed) {
      game.goals[1].completed = true;
      game.goalsMet++;
      game.score += 30;
      userXP += 30;
    }
  } else if (option.name === "New Bike") {
    game.goals[2].current += option.amount;
    if (game.goals[2].current >= game.goals[2].target && !game.goals[2].completed) {
      game.goals[2].completed = true;
      game.goalsMet++;
      game.score += 20;
      userXP += 20;
    }
  } else {
    game.score -= 10;
    showEducationalPopup("Spending on wants reduces your savings potential!", 'savings');
  }
  
  game.month++;
  updateSaveDisplay();
  showSaveGoals();
  
  if (game.goalsMet >= 3) {
    endSaveGame();
  }
}

function endSaveGame() {
  const game = gameData.saveToWin;
  const finalScore = game.score + (game.goalsMet * 100);
  
  if (game.score > game.highScore) {
    game.highScore = game.score;
  }
  
  showEducationalPopup(`Congratulations! You met ${game.goalsMet} savings goals! Final Score: ${finalScore}.`, 'savings');
  
  saveUserData();
  updateUserStats();
}

// Fraud Detective Game
function startFraudDetective() {
  const game = gameData.fraudDetective;
  game.casesSolved = 0;
  game.currentCase = 0;
  updateFraudDisplay();
  showFraudCase();
}

function updateFraudDisplay() {
  const game = gameData.fraudDetective;
  document.getElementById('fraud-score').textContent = game.score;
  document.getElementById('cases-solved').textContent = game.casesSolved;
  document.getElementById('fraud-accuracy').textContent = `${game.accuracy}%`;
}

const fraudCases = [
  {
    title: "Case #1: Investment Scam",
    description: "You receive an email promising 500% returns in 30 days on a 'revolutionary' cryptocurrency investment.",
    evidence: [
      "Promises extremely high returns (500%)",
      "Urges immediate investment",
      "Uses pressure tactics",
      "No clear business model"
    ],
    isScam: true,
    explanation: "This is a classic investment scam. Legitimate investments don't promise such high returns and pressure you to invest immediately."
  },
  {
    title: "Case #2: Bank Security Alert",
    description: "You get a call from 'your bank' saying your account has been compromised and you need to verify your details immediately.",
    evidence: [
      "Caller asks for personal information",
      "Creates urgency and panic",
      "Claims to be from your bank",
      "Asks for passwords or OTP"
    ],
    isScam: true,
    explanation: "Banks never call to ask for passwords or OTP. This is a phishing scam to steal your banking credentials."
  },
  {
    title: "Case #3: Legitimate Investment",
    description: "A well-known mutual fund company offers a diversified equity fund with historical returns of 12% annually.",
    evidence: [
      "Well-known, regulated company",
      "Realistic returns (12%)",
      "Clear investment strategy",
      "No pressure to invest"
    ],
    isScam: false,
    explanation: "This appears to be a legitimate investment opportunity from a regulated financial institution."
  }
];

function showFraudCase() {
  const game = gameData.fraudDetective;
  const caseData = fraudCases[game.currentCase % fraudCases.length];
  
  document.getElementById('case-title').textContent = caseData.title;
  document.getElementById('case-description').textContent = caseData.description;
  
  const evidenceList = document.getElementById('evidence-list');
  evidenceList.innerHTML = '';
  caseData.evidence.forEach(evidence => {
    const li = document.createElement('li');
    li.textContent = evidence;
    evidenceList.appendChild(li);
  });
  
  const choicesContainer = document.getElementById('fraud-choices');
  choicesContainer.innerHTML = '';
  
  const choices = [
    { text: "This is a SCAM - Avoid it!", isScam: true },
    { text: "This looks LEGITIMATE - Safe to proceed", isScam: false }
  ];
  
  choices.forEach(choice => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = choice.text;
    button.onclick = () => solveFraudCase(choice.isScam, caseData);
    choicesContainer.appendChild(button);
  });
}

function solveFraudCase(selectedIsScam, caseData) {
  const game = gameData.fraudDetective;
  
  if (selectedIsScam === caseData.isScam) {
    game.score += 20;
    game.casesSolved++;
    userXP += 20;
    showEducationalPopup(`Correct! ${caseData.explanation}`, 'fraud');
  } else {
    game.score -= 10;
    showEducationalPopup(`Wrong! ${caseData.explanation}`, 'fraud');
  }
  
  game.currentCase++;
  game.accuracy = Math.round((game.casesSolved / game.currentCase) * 100);
  
  updateFraudDisplay();
  
  setTimeout(() => {
    if (game.currentCase < 5) {
      showFraudCase();
    } else {
      endFraudGame();
    }
  }, 2000);
}

function endFraudGame() {
  const game = gameData.fraudDetective;
  const finalScore = game.score + (game.casesSolved * 50);
  
  if (game.score > game.highScore) {
    game.highScore = game.score;
  }
  
  showEducationalPopup(`Investigation complete! You solved ${game.casesSolved}/5 cases with ${game.accuracy}% accuracy. Final Score: ${finalScore}.`, 'fraud');
  
  saveUserData();
  updateUserStats();
}

// Daily Challenges
function loadDailyChallenges() {
  const challenges = [
    {
      title: "Save ₹100 Today",
      description: "Set aside ₹100 from your daily expenses",
      reward: "50 XP + 10 coins",
      completed: false
    },
    {
      title: "Learn About SIPs",
      description: "Watch a 2-minute video about Systematic Investment Plans",
      reward: "30 XP + 5 coins",
      completed: false
    },
    {
      title: "Check Your Expenses",
      description: "Review your spending for the last 3 days",
      reward: "40 XP + 8 coins",
      completed: false
    },
    {
      title: "Emergency Fund Goal",
      description: "Add ₹500 to your emergency fund",
      reward: "60 XP + 15 coins",
      completed: false
    }
  ];
  
  const challengesContainer = document.getElementById('challenges-list');
  challengesContainer.innerHTML = '';
  
  challenges.forEach((challenge, index) => {
    const item = document.createElement('div');
    item.className = 'challenge-item';
    item.innerHTML = `
      <h4>${challenge.title}</h4>
      <p>${challenge.description}</p>
      <div class="challenge-reward">Reward: ${challenge.reward}</div>
      <button onclick="completeChallenge(${index})" class="choice-btn" style="margin-top: 8px;">Complete</button>
    `;
    challengesContainer.appendChild(item);
  });
}

function completeChallenge(index) {
  const rewards = [
    { xp: 50, coins: 10 },
    { xp: 30, coins: 5 },
    { xp: 40, coins: 8 },
    { xp: 60, coins: 15 }
  ];
  
  const reward = rewards[index];
  userXP += reward.xp;
  userCoins += reward.coins;
  
  showEducationalPopup(`Challenge completed! You earned ${reward.xp} XP and ${reward.coins} coins!`, 'general');
  
  saveUserData();
  updateUserStats();
}

// Leaderboard
function loadLeaderboard() {
  const leaderboardData = [
    { name: "Finance Pro", score: 2850 },
    { name: "Investment Guru", score: 2420 },
    { name: "Budget Master", score: 2180 },
    { name: "Savings Hero", score: 1950 },
    { name: "Risk Manager", score: 1720 }
  ];
  
  const leaderboardContainer = document.getElementById('leaderboard');
  leaderboardContainer.innerHTML = '';
  
  leaderboardData.forEach((player, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <span class="leaderboard-rank">#${index + 1}</span>
      <span class="leaderboard-name">${player.name}</span>
      <span class="leaderboard-score">${player.score} XP</span>
    `;
    leaderboardContainer.appendChild(item);
  });
}

// Educational Popup
function showEducationalPopup(message, category) {
  const popup = document.getElementById('educational-popup');
  const title = document.getElementById('popup-title');
  const content = document.getElementById('popup-content');
  
  title.textContent = "Financial Tip";
  content.textContent = message;
  
  popup.classList.add('active');
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    closePopup();
  }, 3000);
}

function closePopup() {
  document.getElementById('educational-popup').classList.remove('active');
}

// Wealth World Game
const assetCategories = {
  cars: [
    { name: "Tesla Model S", price: 5000000, depreciation: 0.02, volatility: 0.10, image: "image/cars/tesla.jpg", description: "Electric luxury sedan with minimal depreciation." },
    { name: "BMW M3", price: 4000000, depreciation: 0.025, volatility: 0.12, image: "image/cars/bmw.jpg", description: "Sporty German sedan, holds value well." },
    { name: "Lamborghini Aventador", price: 20000000, depreciation: 0.03, volatility: 0.18, image: "image/cars/lamborghini.jpg", description: "Exotic supercar, high depreciation." },
    { name: "Maruti Swift", price: 800000, depreciation: 0.015, volatility: 0.08, image: "image/cars/swift.jpg", description: "Popular Indian hatchback, low depreciation." },
    { name: "Mercedes S-Class", price: 10000000, depreciation: 0.02, volatility: 0.10, image: "image/cars/mercedes.jpg", description: "Flagship luxury sedan." },
    { name: "Audi Q7", price: 7000000, depreciation: 0.02, volatility: 0.09, image: "image/cars/audi.jpg", description: "Luxury SUV with good resale value." },
    { name: "Porsche 911", price: 15000000, depreciation: 0.028, volatility: 0.15, image: "image/cars/porsche.jpg", description: "Iconic sports car, collector's favorite." },
    { name: "Tata Nano", price: 300000, depreciation: 0.01, volatility: 0.05, image: "image/cars/nano.jpg", description: "India's most affordable car." },
    { name: "Rolls Royce Phantom", price: 30000000, depreciation: 0.035, volatility: 0.20, image: "image/cars/rollsroyce.jpg", description: "Ultimate luxury, high status." },
    { name: "Jeep Wrangler", price: 6000000, depreciation: 0.02, volatility: 0.11, image: "image/cars/jeep.jpg", description: "Rugged off-roader." }
  ],
  properties: [
    { name: "Mumbai Flat", price: 25000000, appreciation: 0.012, rentalIncome: 0.004, image: "image/properties/mumbai.jpg", description: "Prime city apartment." },
    { name: "NYC Condo", price: 50000000, appreciation: 0.015, rentalIncome: 0.005, image: "image/properties/nyc.jpg", description: "Luxury Manhattan condo." },
    { name: "Paris Villa", price: 40000000, appreciation: 0.013, rentalIncome: 0.004, image: "image/properties/paris.jpg", description: "Elegant villa in Paris." },
    { name: "Goa Beach House", price: 15000000, appreciation: 0.014, rentalIncome: 0.006, image: "image/properties/goa.jpg", description: "Holiday home with high rental demand." },
    { name: "London Townhouse", price: 35000000, appreciation: 0.012, rentalIncome: 0.004, image: "image/properties/london.jpg", description: "Classic townhouse in London." },
    { name: "Dubai Penthouse", price: 60000000, appreciation: 0.018, rentalIncome: 0.007, image: "image/properties/dubai.jpg", description: "Sky-high luxury living." },
    { name: "Sydney Apartment", price: 20000000, appreciation: 0.011, rentalIncome: 0.003, image: "image/properties/sydney.jpg", description: "Harbor view apartment." },
    { name: "Bangalore Villa", price: 18000000, appreciation: 0.012, rentalIncome: 0.004, image: "image/properties/bangalore.jpg", description: "Spacious villa in tech city." },
    { name: "LA Mansion", price: 80000000, appreciation: 0.017, rentalIncome: 0.008, image: "image/properties/la.jpg", description: "Hollywood style mansion." },
    { name: "Tokyo Studio", price: 12000000, appreciation: 0.010, rentalIncome: 0.003, image: "image/properties/tokyo.jpg", description: "Compact city studio." }
  ],
  jets: [
    { name: "Gulfstream G650", price: 500000000, depreciation: 0.03, maintenance: 0.01, image: "image/jets/g650.jpg", description: "Top luxury private jet." },
    { name: "Cessna Citation X", price: 300000000, depreciation: 0.028, maintenance: 0.009, image: "image/jets/cessna.jpg", description: "Fastest business jet." },
    { name: "Bombardier Global 7500", price: 450000000, depreciation: 0.032, maintenance: 0.011, image: "image/jets/bombardier.jpg", description: "Ultra long-range jet." },
    { name: "Dassault Falcon 8X", price: 350000000, depreciation: 0.029, maintenance: 0.010, image: "image/jets/falcon.jpg", description: "French luxury jet." },
    { name: "Embraer Legacy 650", price: 250000000, depreciation: 0.027, maintenance: 0.008, image: "image/jets/embraer.jpg", description: "Efficient and comfortable." },
    { name: "HondaJet Elite", price: 100000000, depreciation: 0.025, maintenance: 0.007, image: "image/jets/hondajet.jpg", description: "Compact and modern." },
    { name: "Learjet 75", price: 120000000, depreciation: 0.026, maintenance: 0.007, image: "image/jets/learjet.jpg", description: "Classic business jet." },
    { name: "Boeing Business Jet", price: 800000000, depreciation: 0.035, maintenance: 0.012, image: "image/jets/boeing.jpg", description: "Converted airliner luxury." },
    { name: "Pilatus PC-24", price: 90000000, depreciation: 0.024, maintenance: 0.006, image: "image/jets/pilatus.jpg", description: "Swiss-made light jet." },
    { name: "SyberJet SJ30i", price: 85000000, depreciation: 0.023, maintenance: 0.006, image: "image/jets/syberjet.jpg", description: "High performance small jet." }
  ],
  crypto: [
    { name: "Bitcoin", price: 3800000, volatility: 0.20, image: "image/crypto/bitcoin.png", description: "Most popular cryptocurrency." },
    { name: "Ethereum", price: 250000, volatility: 0.22, image: "image/crypto/ethereum.png", description: "Smart contract platform." },
    { name: "Cardano", price: 40, volatility: 0.18, image: "image/crypto/cardano.png", description: "Third-gen blockchain." },
    { name: "XRP", price: 35, volatility: 0.19, image: "image/crypto/xrp.png", description: "Banking blockchain." },
    { name: "Solana", price: 2500, volatility: 0.25, image: "image/crypto/solana.png", description: "Fast, scalable blockchain." },
    { name: "Polkadot", price: 900, volatility: 0.21, image: "image/crypto/polkadot.png", description: "Interoperable blockchain." },
    { name: "Dogecoin", price: 6, volatility: 0.30, image: "image/crypto/dogecoin.png", description: "Meme coin." },
    { name: "Avalanche", price: 2200, volatility: 0.23, image: "image/crypto/avalanche.png", description: "High throughput blockchain." },
    { name: "Litecoin", price: 4000, volatility: 0.17, image: "image/crypto/litecoin.png", description: "Silver to Bitcoin's gold." },
    { name: "TRB", price: 110000, volatility: 0.28, image: "image/crypto/trb.png", description: "Oracle network." }
  ],
  paintings: [
    { name: "Mona Lisa", price: 100000000, appreciation: 0.03, volatility: 0.10, image: "image/paintings/monalisa.jpg", description: "World's most famous painting." },
    { name: "Starry Night", price: 80000000, appreciation: 0.025, volatility: 0.12, image: "image/paintings/starrynight.jpg", description: "Van Gogh's masterpiece." },
    { name: "The Scream", price: 60000000, appreciation: 0.022, volatility: 0.11, image: "image/paintings/scream.jpg", description: "Expressionist icon." },
    { name: "Girl with a Pearl Earring", price: 50000000, appreciation: 0.021, volatility: 0.10, image: "image/paintings/pearl.jpg", description: "Dutch Golden Age." },
    { name: "Guernica", price: 70000000, appreciation: 0.024, volatility: 0.13, image: "image/paintings/guernica.jpg", description: "Picasso's anti-war mural." },
    { name: "The Kiss", price: 40000000, appreciation: 0.02, volatility: 0.09, image: "image/paintings/kiss.jpg", description: "Klimt's golden painting." },
    { name: "The Persistence of Memory", price: 30000000, appreciation: 0.019, volatility: 0.10, image: "image/paintings/memory.jpg", description: "Dali's surreal clocks." },
    { name: "American Gothic", price: 35000000, appreciation: 0.018, volatility: 0.09, image: "image/paintings/gothic.jpg", description: "Iconic American art." },
    { name: "The Night Watch", price: 90000000, appreciation: 0.027, volatility: 0.11, image: "image/paintings/nightwatch.jpg", description: "Rembrandt's masterpiece." },
    { name: "The Birth of Venus", price: 75000000, appreciation: 0.023, volatility: 0.10, image: "image/paintings/venus.jpg", description: "Botticelli's classic." }
  ],
  businesses: [
    { name: "Coffee Shop", price: 300000, income: 0.02, volatility: 0.10, image: "image/businesses/coffee.jpg", description: "Steady passive income." },
    { name: "IT Company", price: 5000000, income: 0.03, volatility: 0.15, image: "image/businesses/it.jpg", description: "Tech business, high growth." },
    { name: "Taxi Company", price: 1000000, income: 0.018, volatility: 0.12, image: "image/businesses/taxi.jpg", description: "Transport business." },
    { name: "Shipping Company", price: 2000000, income: 0.022, volatility: 0.13, image: "image/businesses/shipping.jpg", description: "Logistics and transport." },
    { name: "Factory", price: 2500000, income: 0.025, volatility: 0.14, image: "image/businesses/factory.jpg", description: "Manufacturing business." },
    { name: "Construction Company", price: 3500000, income: 0.027, volatility: 0.13, image: "image/businesses/construction.jpg", description: "Builds real estate." },
    { name: "Car Dealership", price: 4000000, income: 0.021, volatility: 0.12, image: "image/businesses/dealership.jpg", description: "Sells new and used cars." },
    { name: "Bank", price: 10000000, income: 0.035, volatility: 0.10, image: "image/businesses/bank.jpg", description: "Financial institution." },
    { name: "Supermarket", price: 1500000, income: 0.019, volatility: 0.11, image: "image/businesses/supermarket.jpg", description: "Retail business." },
    { name: "Pharmacy", price: 1200000, income: 0.017, volatility: 0.10, image: "image/businesses/pharmacy.jpg", description: "Healthcare retail." }
  ],
  collections: [
    { name: "Rare Coin", price: 100000, appreciation: 0.03, volatility: 0.15, image: "image/collections/coin.jpg", description: "Valuable collectible coin." },
    { name: "Vintage Stamp", price: 80000, appreciation: 0.025, volatility: 0.13, image: "image/collections/stamp.jpg", description: "Rare postage stamp." },
    { name: "Antique Watch", price: 200000, appreciation: 0.028, volatility: 0.14, image: "image/collections/watch.jpg", description: "Classic timepiece." },
    { name: "Retro Car", price: 500000, appreciation: 0.02, volatility: 0.12, image: "image/collections/retrocar.jpg", description: "Collectible car." },
    { name: "Comic Book", price: 60000, appreciation: 0.018, volatility: 0.11, image: "image/collections/comic.jpg", description: "First edition comic." },
    { name: "Sports Card", price: 90000, appreciation: 0.021, volatility: 0.13, image: "image/collections/sportscard.jpg", description: "Signed sports card." },
    { name: "Classic Guitar", price: 150000, appreciation: 0.022, volatility: 0.12, image: "image/collections/guitar.jpg", description: "Famous musician's guitar." },
    { name: "Old Map", price: 70000, appreciation: 0.019, volatility: 0.10, image: "image/collections/map.jpg", description: "Historic world map." },
    { name: "Vintage Camera", price: 120000, appreciation: 0.02, volatility: 0.11, image: "image/collections/camera.jpg", description: "Classic film camera." },
    { name: "Rare Book", price: 110000, appreciation: 0.021, volatility: 0.10, image: "image/collections/book.jpg", description: "First edition book." }
  ]
};

function startWealthWorld() {
  const game = gameData.wealthWorld;
  updateWealthDisplay();
  loadAssetShop();
  showMarketNews();
}

function updateWealthDisplay() {
  const game = gameData.wealthWorld;
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  setText('wealth-net-worth', game.netWorth.toLocaleString());
  setText('wealth-assets-count', game.assetsCount);
  setText('wealth-day', game.day);
  setText('wealth-total-invested', game.totalInvested ? game.totalInvested.toLocaleString() : '0');
  setText('wealth-total-return', game.totalReturn ? `${game.totalReturn.toFixed(1)}%` : '0%');
}

function loadAssetShop() {
  const shopContainer = document.getElementById('shop-items');
  shopContainer.innerHTML = '';
  
  // Sync wallet balance from stock trading
  syncStockWalletBalance();
  
  console.log('Rendering asset shop with categories:', assetCategories);

  Object.entries(assetCategories).forEach(([category, items]) => {
    // Create expandable section container
    const sectionContainer = document.createElement('div');
    sectionContainer.className = 'asset-section';

    // Category header (clickable)
    const catHeader = document.createElement('div');
    catHeader.className = 'section-header';
    catHeader.innerHTML = `
      <div class="section-header-content">
        <div class="section-title">
          <span class="category-icon">${getCategoryIcon(category)}</span>
          <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
          <span class="item-count">${items.length} items</span>
        </div>
        <div class="section-summary">
          <span class="price-range">₹${Math.min(...items.map(item => item.price)).toLocaleString()} - ₹${Math.max(...items.map(item => item.price)).toLocaleString()}</span>
        </div>
      </div>
      <span class="expand-icon">▼</span>
    `;

    // Category grid (initially hidden)
    const catGrid = document.createElement('div');
    catGrid.className = 'section-content shop-grid';

    items.forEach((asset, idx) => {
      const item = document.createElement('div');
      item.className = `shop-item ${asset.price > stockWalletBalance ? 'expensive' : 'affordable'}`;
      item.onclick = () => buyAsset(category, idx);
      const canAfford = asset.price <= stockWalletBalance;
      const pricePercentage = ((asset.price / stockWalletBalance) * 100).toFixed(1);
      
      item.innerHTML = `
        <div class="asset-type-indicator ${category}"></div>
        <div class="shop-item-header">
          <div class="shop-item-img">
            ${asset.image ? `<img src='${asset.image}' alt='${asset.name}' onerror="this.parentElement.innerHTML='<div class=\\'placeholder-img\\'>${getCategoryIcon(category)}</div>'">` : `<div class="placeholder-img">${getCategoryIcon(category)}</div>`}
          </div>
          <div class="affordability-badge ${canAfford ? 'affordable' : 'expensive'}">
            ${canAfford ? '✅' : '❌'}
          </div>
        </div>
        <div class="shop-item-content">
          <h4 class="asset-name">${asset.name}</h4>
          <div class="shop-item-price">
            <span class="price-amount">₹${asset.price.toLocaleString()}</span>
            <span class="price-percentage">${pricePercentage}% of wallet</span>
          </div>
          <div class="shop-item-description">${asset.description}</div>
          <div class="shop-item-stats">
            <div class="stat-item">
              ${asset.depreciation ? `<span class="stat-label">Depreciation:</span> <span class="stat-value negative">${(asset.depreciation*100).toFixed(1)}%</span>` : 
                asset.appreciation ? `<span class="stat-label">Appreciation:</span> <span class="stat-value positive">${(asset.appreciation*100).toFixed(1)}%</span>` : 
                asset.income ? `<span class="stat-label">Income:</span> <span class="stat-value positive">${(asset.income*100).toFixed(1)}%</span>` : 
                asset.volatility ? `<span class="stat-label">Volatility:</span> <span class="stat-value neutral">${(asset.volatility*100).toFixed(1)}%</span>` : ''}
            </div>
            <div class="buy-status">
              ${canAfford ? '<span class="buy-available">Available to Buy</span>' : '<span class="buy-unavailable">Insufficient Funds</span>'}
            </div>
          </div>
        </div>
      `;
      catGrid.appendChild(item);
    });

    // Add click handler for expand/collapse
    catHeader.addEventListener('click', function() {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.expand-icon');
      
      if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'grid';
        icon.textContent = '▲';
        this.classList.add('expanded');
      } else {
        content.style.display = 'none';
        icon.textContent = '▼';
        this.classList.remove('expanded');
      }
    });

    sectionContainer.appendChild(catHeader);
    sectionContainer.appendChild(catGrid);
    shopContainer.appendChild(sectionContainer);
  });
}

// Helper function to get category icons
function getCategoryIcon(category) {
  const icons = {
    cars: '🚗',
    properties: '🏠',
    jets: '✈️',
    crypto: '₿',
    paintings: '🎨',
    businesses: '🏢',
    collections: '💎'
  };
  return icons[category] || '💰';
}

function buyAsset(category, idx) {
  const asset = assetCategories[category][idx];
  const game = gameData.wealthWorld;
  
  // Sync wallet balance before purchase
  syncStockWalletBalance();
  
  if (asset.price > stockWalletBalance) {
    showEducationalPopup("You don't have enough money in your stock wallet! Trade stocks to earn more.", 'wealth');
    return;
  }
  
  // Update both game wallet and stock wallet
  stockWalletBalance -= asset.price;
  
  // Update stock.js user wallet
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    userData.wallet = stockWalletBalance;
    localStorage.setItem('user', JSON.stringify(userData));
  }
  
  // Save to localStorage for persistence
  localStorage.setItem(STOCK_WALLET_KEY, stockWalletBalance.toString());
  
  const portfolioAsset = {
    id: Date.now() + Math.random(),
    category,
    name: asset.name,
    image: asset.image,
    purchasePrice: asset.price,
    currentValue: asset.price,
    purchaseDay: game.day,
    description: asset.description,
    ...asset
  };
  
  game.portfolio.push(portfolioAsset);
  game.totalInvested += asset.price;
  game.assetsCount = game.portfolio.length;
  game.netWorth = game.portfolio.reduce((sum, asset) => sum + asset.currentValue, 0);
  
  updateStockWallet();
  updateWealthDisplay();
  loadAssetShop();
  loadPortfolio();
  showEducationalPopup(`🎉 Purchased ${asset.name} for ₹${asset.price.toLocaleString()}! Your portfolio is growing!`, 'wealth');
  saveUserData();
}

function updateStockWallet() {
  const game = gameData.wealthWorld;
  const walletElement = document.getElementById('stock-wallet-balance');
  if (walletElement) {
    walletElement.textContent = stockWalletBalance.toLocaleString();
  }
  // Save to localStorage for persistence
  localStorage.setItem(STOCK_WALLET_KEY, stockWalletBalance.toString());
}

function loadPortfolio() {
  const game = gameData.wealthWorld;
  const portfolioContainer = document.getElementById('portfolio-breakdown');
  portfolioContainer.innerHTML = '';

  game.portfolio.forEach(asset => {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.innerHTML = `
      <h4>${asset.name}</h4>
      <div class="value">₹${asset.currentValue.toLocaleString()}</div>
      <div class="return positive">+${(Math.random() * 20 - 5).toFixed(1)}%</div>
    `;
    portfolioContainer.appendChild(item);
  });
}

function showMarketNews() {
  const game = gameData.wealthWorld;
  const newsTexts = [
    "Market conditions are stable with moderate growth expected.",
    "Economic indicators show strong recovery in tech sector.",
    "Inflation concerns are affecting bond yields.",
    "Gold prices are rising due to market uncertainty."
  ];
  document.getElementById('market-news-text').textContent = newsTexts[Math.floor(Math.random() * newsTexts.length)];
}

