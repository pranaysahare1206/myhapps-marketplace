// Tic Tac Toe Pro Game with JSON Stats Storage
const APP_DATA_KEY = 'tictactoe_game_data';

let board = Array(9).fill(null);
let currentPlayer = 'x';
let gameMode = 'ai'; // 'ai' or 'pvp'
let difficulty = 'medium';
let gameActive = true;
let moveHistory = [];

let stats = {
  xWins: 0,
  oWins: 0,
  draws: 0,
  history: []
};

const winningCombos = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateUI();
  updateStats();
  
  // Add click handlers
  document.querySelectorAll('.cell').forEach(cell => {
    cell.addEventListener('click', () => makeMove(parseInt(cell.dataset.index)));
  });
});

function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  if (data) {
    stats = JSON.parse(data);
  }
}

function saveData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(stats));
  
  // Export format
  const exportData = {
    app: 'tic-tac-toe',
    version: '1.0',
    lastPlayed: new Date().toISOString(),
    stats: {
      xWins: stats.xWins,
      oWins: stats.oWins,
      draws: stats.draws,
      totalGames: stats.xWins + stats.oWins + stats.draws
    },
    recentHistory: stats.history.slice(-10)
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function setMode(mode) {
  gameMode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-${mode}`).classList.add('active');
  document.getElementById('difficultySelector').style.display = mode === 'ai' ? 'block' : 'none';
  newGame();
}

function setDifficulty() {
  difficulty = document.getElementById('difficulty').value;
  newGame();
}

function makeMove(index) {
  if (!gameActive || board[index]) return;
  
  // Save move for undo
  moveHistory.push({
    board: [...board],
    currentPlayer,
    gameActive
  });
  
  board[index] = currentPlayer;
  renderBoard();
  
  if (checkWinner()) {
    endGame(currentPlayer);
    return;
  }
  
  if (checkDraw()) {
    endGame('draw');
    return;
  }
  
  currentPlayer = currentPlayer === 'x' ? 'o' : 'x';
  updateStatus();
  
  // AI move
  if (gameMode === 'ai' && currentPlayer === 'o' && gameActive) {
    document.getElementById('undoBtn').disabled = true;
    setTimeout(makeAIMove, 500);
  }
}

function makeAIMove() {
  if (!gameActive) return;
  
  let move;
  
  switch (difficulty) {
    case 'easy':
      move = getRandomMove();
      break;
    case 'medium':
      move = Math.random() < 0.5 ? getBestMove() : getRandomMove();
      break;
    case 'hard':
      move = getBestMove();
      break;
    default:
      move = getBestMove();
  }
  
  if (move !== -1) {
    makeMove(move);
  }
  document.getElementById('undoBtn').disabled = false;
}

function getRandomMove() {
  const available = board.map((cell, i) => cell === null ? i : null).filter(i => i !== null);
  return available.length > 0 ? available[Math.floor(Math.random() * available.length)] : -1;
}

function getBestMove() {
  // Check if AI can win
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    const line = [board[a], board[b], board[c]];
    const oCount = line.filter(x => x === 'o').length;
    const nullCount = line.filter(x => x === null).length;
    if (oCount === 2 && nullCount === 1) {
      return combo[line.indexOf(null)];
    }
  }
  
  // Block player win
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    const line = [board[a], board[b], board[c]];
    const xCount = line.filter(x => x === 'x').length;
    const nullCount = line.filter(x => x === null).length;
    if (xCount === 2 && nullCount === 1) {
      return combo[line.indexOf(null)];
    }
  }
  
  // Take center
  if (board[4] === null) return 4;
  
  // Take corners
  const corners = [0, 2, 6, 8].filter(i => board[i] === null);
  if (corners.length > 0) {
    return corners[Math.floor(Math.random() * corners.length)];
  }
  
  // Take any available
  return getRandomMove();
}

function checkWinner() {
  for (let combo of winningCombos) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      highlightWinners(combo);
      return true;
    }
  }
  return false;
}

function checkDraw() {
  return board.every(cell => cell !== null);
}

function highlightWinners(combo) {
  combo.forEach(index => {
    document.querySelector(`[data-index="${index}"]`).classList.add('winner');
  });
}

function endGame(result) {
  gameActive = false;
  
  const statusBar = document.getElementById('statusBar');
  
  if (result === 'draw') {
    stats.draws++;
    statusBar.innerHTML = '<span style="color:#fbbf24;font-weight:bold;">🤝 It\'s a Draw!</span>';
    addToHistory('draw');
  } else {
    const winner = result.toUpperCase();
    const isPlayerWin = gameMode === 'ai' && result === 'x';
    statusBar.innerHTML = `<span class="turn ${result}">${winner} Wins! ${isPlayerWin ? '🎉' : ''}</span>`;
    
    if (result === 'x') stats.xWins++;
    else stats.oWins++;
    
    addToHistory(result);
  }
  
  saveData();
  updateStats();
}

function addToHistory(result) {
  const historyEntry = {
    result: result,
    mode: gameMode,
    difficulty: difficulty,
    moves: moveHistory.length,
    date: new Date().toISOString()
  };
  
  stats.history.unshift(historyEntry);
  if (stats.history.length > 50) stats.history.pop();
  
  updateHistoryUI();
}

function newGame() {
  board = Array(9).fill(null);
  currentPlayer = 'x';
  gameActive = true;
  moveHistory = [];
  
  renderBoard();
  updateStatus();
  
  document.querySelectorAll('.cell').forEach(cell => {
    cell.className = 'cell';
  });
}

function undoMove() {
  if (moveHistory.length === 0 || !gameActive) return;
  
  // For AI mode, undo twice (player + AI)
  const movesToUndo = gameMode === 'ai' && currentPlayer === 'x' ? 2 : 1;
  
  for (let i = 0; i < movesToUndo && moveHistory.length > 0; i++) {
    const state = moveHistory.pop();
    board = state.board;
    currentPlayer = state.currentPlayer;
  }
  
  gameActive = true;
  renderBoard();
  updateStatus();
  
  document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('winner'));
}

function renderBoard() {
  board.forEach((cell, index) => {
    const cellEl = document.querySelector(`[data-index="${index}"]`);
    cellEl.textContent = cell ? (cell === 'x' ? '✕' : '◯') : '';
    cellEl.className = `cell ${cell || ''} ${cell ? 'taken' : ''}`;
  });
}

function updateStatus() {
  const statusBar = document.getElementById('statusBar');
  const player = currentPlayer.toUpperCase();
  const isPlayer = gameMode === 'ai' && currentPlayer === 'x';
  statusBar.innerHTML = `<span class="turn ${currentPlayer}">${player}'s Turn${isPlayer ? ' (You)' : ''}</span>`;
}

function updateStats() {
  document.getElementById('xWins').textContent = stats.xWins;
  document.getElementById('oWins').textContent = stats.oWins;
  document.getElementById('draws').textContent = stats.draws;
}

function updateHistoryUI() {
  const list = document.getElementById('historyList');
  
  if (stats.history.length === 0) {
    list.innerHTML = '<li style="text-align:center;opacity:0.7;">No games played yet</li>';
    return;
  }
  
  list.innerHTML = stats.history.slice(0, 10).map(game => {
    const date = new Date(game.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    let resultText, resultClass;
    if (game.result === 'x') {
      resultText = game.mode === 'ai' ? 'You Won!' : 'X Won';
      resultClass = 'win';
    } else if (game.result === 'o') {
      resultText = game.mode === 'ai' ? 'AI Won' : 'O Won';
      resultClass = game.mode === 'ai' ? 'loss' : 'win';
    } else {
      resultText = 'Draw';
      resultClass = 'draw';
    }
    
    const modeText = game.mode === 'ai' ? `vs AI (${game.difficulty})` : '2 Player';
    
    return `
      <li>
        <span>
          <span class="result ${resultClass}">${resultText}</span>
          <span style="opacity:0.7;margin-left:8px;font-size:12px">${modeText}</span>
        </span>
        <span class="date">${dateStr}</span>
      </li>
    `;
  }).join('');
}

function updateUI() {
  updateStats();
  updateHistoryUI();
}
