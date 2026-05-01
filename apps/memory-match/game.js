// Memory Match Game with JSON Score Storage
const APP_DATA_KEY = 'memory_game_data';

const themes = {
  emoji: ['🎭', '🎪', '🎨', '🎬', '🎤', '🎧', '🎮', '🎯'],
  animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
  food: ['🍕', '🍔', '🍟', '🌭', '🍿', '🥓', '🥚', '🥞'],
  sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱']
};

let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let timer = null;
let seconds = 0;
let isGameActive = false;
let currentTheme = 'emoji';

let gameData = {
  scores: [] // { theme, moves, time, date, rating }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initBoard();
  updateLeaderboard();
});

function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  if (data) {
    gameData = JSON.parse(data);
  }
}

function saveData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(gameData));
  
  // Export format
  const exportData = {
    app: 'memory-match',
    version: '1.0',
    lastPlayed: new Date().toISOString(),
    totalGames: gameData.scores.length,
    bestScores: getBestScores(),
    allScores: gameData.scores
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function getBestScores() {
  const grouped = {};
  gameData.scores.forEach(s => {
    if (!grouped[s.theme] || s.moves < grouped[s.theme].moves) {
      grouped[s.theme] = s;
    }
  });
  return grouped;
}

function changeTheme() {
  currentTheme = document.getElementById('themeSelect').value;
  startGame();
}

function initBoard() {
  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  
  // Create 16 cards (8 pairs)
  const pairs = [...themes[currentTheme], ...themes[currentTheme]];
  cards = shuffle(pairs);
  
  cards.forEach((emoji, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.emoji = emoji;
    
    card.innerHTML = `
      <div class="card-face card-front"></div>
      <div class="card-face card-back">${emoji}</div>
    `;
    
    card.addEventListener('click', () => flipCard(index));
    board.appendChild(card);
  });
}

function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function startGame() {
  // Reset game state
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  seconds = 0;
  isGameActive = true;
  
  // Stop existing timer
  if (timer) clearInterval(timer);
  
  // Hide overlays
  document.getElementById('winOverlay').classList.remove('active');
  
  // Reset UI
  updateUI();
  
  // Reinit board
  initBoard();
  
  // Start timer
  timer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  seconds++;
  updateUI();
  
  // Warning at 2 minutes
  if (seconds === 120) {
    document.getElementById('timer').classList.add('timer-warning');
  }
}

function flipCard(index) {
  if (!isGameActive) return;
  if (flippedCards.length >= 2) return;
  
  const card = document.querySelector(`[data-index="${index}"]`);
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;
  
  card.classList.add('flipped');
  flippedCards.push({ index, emoji: cards[index], element: card });
  
  if (flippedCards.length === 2) {
    moves++;
    updateUI();
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = flippedCards;
  
  if (card1.emoji === card2.emoji) {
    // Match!
    setTimeout(() => {
      card1.element.classList.add('matched');
      card2.element.classList.add('matched');
      matchedPairs++;
      flippedCards = [];
      updateUI();
      
      if (matchedPairs === 8) {
        gameWon();
      }
    }, 500);
  } else {
    // No match
    setTimeout(() => {
      card1.element.classList.remove('flipped');
      card2.element.classList.remove('flipped');
      flippedCards = [];
    }, 1000);
  }
}

function gameWon() {
  isGameActive = false;
  clearInterval(timer);
  
  // Calculate rating
  const rating = calculateRating(moves, seconds);
  
  // Save score
  const score = {
    theme: currentTheme,
    moves: moves,
    time: seconds,
    date: new Date().toISOString(),
    rating: rating
  };
  
  gameData.scores.push(score);
  gameData.scores.sort((a, b) => {
    // Sort by theme, then by moves, then by time
    if (a.theme !== b.theme) return a.theme.localeCompare(b.theme);
    if (a.moves !== b.moves) return a.moves - b.moves;
    return a.time - b.time;
  });
  
  saveData();
  
  // Show win overlay
  document.getElementById('resultMoves').textContent = moves;
  document.getElementById('resultTime').textContent = formatTime(seconds);
  document.getElementById('resultRating').textContent = rating;
  document.getElementById('winOverlay').classList.add('active');
  
  updateLeaderboard();
}

function calculateRating(moves, time) {
  // Perfect game: 8 moves minimum
  const moveScore = Math.max(0, 100 - (moves - 8) * 5);
  const timeScore = Math.max(0, 100 - time / 3);
  const avg = (moveScore + timeScore) / 2;
  
  if (avg >= 90) return '⭐⭐⭐ Gold';
  if (avg >= 70) return '⭐⭐ Silver';
  if (avg >= 50) return '⭐ Bronze';
  return '💪 Good Try';
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateUI() {
  document.getElementById('moves').textContent = moves;
  document.getElementById('timer').textContent = formatTime(seconds);
  document.getElementById('pairs').textContent = `${matchedPairs}/8`;
}

function updateLeaderboard() {
  const list = document.getElementById('scoreList');
  const themeScores = gameData.scores
    .filter(s => s.theme === currentTheme)
    .slice(0, 5);
  
  if (themeScores.length === 0) {
    list.innerHTML = '<li style="text-align:center;opacity:0.7;">No scores for this theme yet</li>';
    return;
  }
  
  list.innerHTML = themeScores.map((s, i) => {
    const date = new Date(s.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <li>
        <span><span class="rank">#${i + 1}</span> ${s.moves} moves</span>
        <span class="time">${formatTime(s.time)} • ${dateStr}</span>
      </li>
    `;
  }).join('');
}

function showLeaderboard() {
  const board = document.getElementById('leaderboard');
  board.scrollIntoView({ behavior: 'smooth' });
}
