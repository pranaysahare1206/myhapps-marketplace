// Word Guess Game - Premium Feature
const APP_DATA_KEY = 'wordguess_game_data';

const WORDS = [
  'ABOUT', 'ABOVE', 'ABUSE', 'ACTOR', 'ACUTE', 'ADMIT', 'ADOPT', 'ADULT', 'AFTER', 'AGAIN',
  'AGENT', 'AGREE', 'AHEAD', 'ALARM', 'ALBUM', 'ALERT', 'ALIKE', 'ALIVE', 'ALLOW', 'ALONE',
  'ALONG', 'ALTER', 'AMONG', 'ANGER', 'ANGLE', 'ANGRY', 'APART', 'APPLE', 'APPLY', 'ARENA',
  'ARGUE', 'ARISE', 'ARRAY', 'ASIDE', 'ASSET', 'AUDIO', 'AUDIT', 'AVOID', 'AWARD', 'AWARE',
  'BADLY', 'BAKER', 'BASIS', 'BEACH', 'BEGAN', 'BEGIN', 'BEGUN', 'BEING', 'BELOW', 'BENCH',
  'BILLY', 'BIRTH', 'BLACK', 'BLAME', 'BLIND', 'BLOCK', 'BLOOD', 'BOARD', 'BRAIN', 'BRAND',
  'BREAD', 'BREAK', 'BRICK', 'BRIEF', 'BRING', 'BROAD', 'BROWN', 'BUDGET', 'BUILD', 'BUILT',
  'BUYER', 'CABLE', 'CALM', 'CAMERA', 'CANAL', 'CANDY', 'CARE', 'CARGO', 'CARRY', 'CASE',
  'CASH', 'CATCH', 'CAUSE', 'CHAIN', 'CHAIR', 'CHART', 'CHASE', 'CHECK', 'CHEST', 'CHIEF',
  'CHILD', 'CHOICE', 'CHOOSE', 'CITY', 'CIVIL', 'CLAIM', 'CLASS', 'CLEAN', 'CLEAR', 'CLICK'
];

const MAX_ATTEMPTS = 6;
const WORD_LENGTH = 5;

let gameData = {
  currentStreak: 0,
  bestStreak: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  guessDistribution: [0, 0, 0, 0, 0, 0]
};

let targetWord = '';
let currentAttempt = 0;
let currentGuess = '';
let gameOver = false;
let keyboardState = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initBoard();
  initKeyboard();
  newGame();
  updateStatsUI();
});

function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  if (data) {
    gameData = { ...gameData, ...JSON.parse(data) };
  }
}

function saveData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(gameData));
  
  // Export format
  const exportData = {
    app: 'word-guess',
    version: '1.0',
    type: 'premium',
    lastPlayed: new Date().toISOString(),
    stats: gameData,
    currentWord: targetWord,
    attempts: currentAttempt
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function newGame() {
  targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  currentAttempt = 0;
  currentGuess = '';
  gameOver = false;
  keyboardState = {};
  
  // Hide overlay
  document.getElementById('winOverlay').classList.remove('active');
  
  // Reset board
  initBoard();
  initKeyboard();
  
  showMessage('Type your guess and press ENTER', 'info');
}

function initBoard() {
  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.row = i;
    
    for (let j = 0; j < WORD_LENGTH; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.dataset.row = i;
      tile.dataset.col = j;
      row.appendChild(tile);
    }
    
    board.appendChild(row);
  }
}

function initKeyboard() {
  const keyboard = document.getElementById('keyboard');
  keyboard.innerHTML = '';
  
  const rows = [
    'QWERTYUIOP',
    'ASDFGHJKL',
    'ZXCVBNM'
  ];
  
  rows.forEach((row, i) => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';
    
    if (i === 2) {
      const enterKey = document.createElement('button');
      enterKey.className = 'key wide enter';
      enterKey.textContent = 'ENTER';
      enterKey.onclick = submitGuess;
      rowDiv.appendChild(enterKey);
    }
    
    row.split('').forEach(letter => {
      const key = document.createElement('button');
      key.className = 'key';
      key.textContent = letter;
      key.dataset.key = letter;
      key.onclick = () => addLetter(letter);
      rowDiv.appendChild(key);
    });
    
    if (i === 2) {
      const backspaceKey = document.createElement('button');
      backspaceKey.className = 'key wide';
      backspaceKey.textContent = '⌫';
      backspaceKey.onclick = deleteLetter;
      rowDiv.appendChild(backspaceKey);
    }
    
    keyboard.appendChild(rowDiv);
  });
}

function addLetter(letter) {
  if (gameOver || currentGuess.length >= WORD_LENGTH) return;
  
  currentGuess += letter;
  updateRow();
}

function deleteLetter() {
  if (gameOver || currentGuess.length === 0) return;
  
  currentGuess = currentGuess.slice(0, -1);
  updateRow();
}

function updateRow() {
  const row = document.querySelectorAll(`[data-row="${currentAttempt}"]`);
  
  row.forEach((tile, i) => {
    if (i < currentGuess.length) {
      tile.textContent = currentGuess[i];
      tile.classList.add('filled');
    } else {
      tile.textContent = '';
      tile.classList.remove('filled');
    }
  });
}

function submitGuess() {
  if (gameOver) return;
  
  if (currentGuess.length !== WORD_LENGTH) {
    showMessage('Word must be 5 letters!', 'error');
    shakeRow();
    return;
  }
  
  const guess = currentGuess.toUpperCase();
  
  // Check if word is in list (simplified - allow any 5-letter word)
  // In full version, check against dictionary
  
  const result = checkGuess(guess);
  animateRow(result);
  updateKeyboard(result, guess);
  
  if (guess === targetWord) {
    gameWon();
  } else if (currentAttempt === MAX_ATTEMPTS - 1) {
    gameLost();
  } else {
    currentAttempt++;
    currentGuess = '';
    showMessage(`Attempt ${currentAttempt + 1} of ${MAX_ATTEMPTS}`, 'info');
  }
}

function checkGuess(guess) {
  const result = [];
  const targetLetters = targetWord.split('');
  const guessLetters = guess.split('');
  
  // First pass: correct positions
  guessLetters.forEach((letter, i) => {
    if (letter === targetLetters[i]) {
      result[i] = 'correct';
      targetLetters[i] = null;
    }
  });
  
  // Second pass: present but wrong position
  guessLetters.forEach((letter, i) => {
    if (result[i]) return;
    
    const index = targetLetters.indexOf(letter);
    if (index !== -1) {
      result[i] = 'present';
      targetLetters[index] = null;
    } else {
      result[i] = 'absent';
    }
  });
  
  return result;
}

function animateRow(result) {
  const row = document.querySelectorAll(`[data-row="${currentAttempt}"]`);
  
  row.forEach((tile, i) => {
    setTimeout(() => {
      tile.classList.remove('filled');
      tile.classList.add(result[i]);
    }, i * 100);
  });
}

function updateKeyboard(result, guess) {
  guess.split('').forEach((letter, i) => {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (!key) return;
    
    const state = result[i];
    const currentState = keyboardState[letter];
    
    // Prioritize: correct > present > absent
    if (state === 'correct' || 
        (state === 'present' && currentState !== 'correct') ||
        (state === 'absent' && !currentState)) {
      keyboardState[letter] = state;
      key.classList.remove('correct', 'present', 'absent');
      key.classList.add(state);
    }
  });
}

function shakeRow() {
  const row = document.querySelector(`[data-row="${currentAttempt}"]`).parentElement;
  row.style.animation = 'none';
  row.offsetHeight; // trigger reflow
  row.style.animation = 'shake 0.5s ease';
}

function gameWon() {
  gameOver = true;
  gameData.gamesPlayed++;
  gameData.gamesWon++;
  gameData.currentStreak++;
  gameData.guessDistribution[currentAttempt]++;
  
  if (gameData.currentStreak > gameData.bestStreak) {
    gameData.bestStreak = gameData.currentStreak;
  }
  
  saveData();
  updateStatsUI();
  
  showMessage(`🎉 Correct! The word was ${targetWord}`, 'success');
  
  // Show win overlay
  setTimeout(() => {
    document.getElementById('resultTitle').textContent = '🎉 You Won!';
    document.getElementById('resultMessage').textContent = `Guessed "${targetWord}" correctly!`;
    document.getElementById('resultAttempts').textContent = currentAttempt + 1;
    document.getElementById('resultStreak').textContent = gameData.currentStreak;
    document.getElementById('winOverlay').classList.add('active');
  }, 1500);
}

function gameLost() {
  gameOver = true;
  gameData.gamesPlayed++;
  gameData.currentStreak = 0;
  
  saveData();
  updateStatsUI();
  
  showMessage(`😔 The word was: ${targetWord}`, 'error');
  
  // Show lose overlay
  setTimeout(() => {
    document.getElementById('resultTitle').textContent = '😔 Game Over';
    document.getElementById('resultMessage').innerHTML = `The word was: <span class="word-reveal">${targetWord}</span>`;
    document.getElementById('resultAttempts').textContent = 'X';
    document.getElementById('resultStreak').textContent = '0';
    document.getElementById('winOverlay').classList.add('active');
  }, 1500);
}

function showMessage(text, type) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.className = 'message ' + type;
}

function updateStatsUI() {
  document.getElementById('streak').textContent = gameData.currentStreak;
  document.getElementById('gamesPlayed').textContent = gameData.gamesPlayed;
  
  const winRate = gameData.gamesPlayed > 0 
    ? Math.round((gameData.gamesWon / gameData.gamesPlayed) * 100) 
    : 0;
  document.getElementById('winRate').textContent = winRate + '%';
  document.getElementById('bestStreak').textContent = gameData.bestStreak;
}

function showStats() {
  const winRate = gameData.gamesPlayed > 0 
    ? Math.round((gameData.gamesWon / gameData.gamesPlayed) * 100) 
    : 0;
  
  let distribution = '';
  const max = Math.max(...gameData.guessDistribution, 1);
  gameData.guessDistribution.forEach((count, i) => {
    const width = (count / max) * 100;
    distribution += `${i + 1}: ${'█'.repeat(Math.round(width / 10))} ${count}\n`;
  });
  
  alert(`📊 Statistics:\n\nGames Played: ${gameData.gamesPlayed}\nWin Rate: ${winRate}%\nCurrent Streak: ${gameData.currentStreak}\nBest Streak: ${gameData.bestStreak}\n\nGuess Distribution:\n${distribution}`);
}

function shareResult() {
  const attempts = gameOver && currentGuess === targetWord ? currentAttempt + 1 : 'X';
  const emoji = attempts === 'X' ? '😔' : '🎉';
  const text = `Word Guess ${emoji}\n${new Date().toLocaleDateString()}\nAttempts: ${attempts}/6\nStreak: ${gameData.currentStreak}🔥\n\nCan you beat my score?`;
  
  if (navigator.share) {
    navigator.share({ text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      alert('Result copied to clipboard!');
    });
  }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    submitGuess();
  } else if (e.key === 'Backspace') {
    deleteLetter();
  } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
    addLetter(e.key.toUpperCase());
  }
});

// Add shake animation
const style = document.createElement('style');
style.textContent = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
`;
document.head.appendChild(style);
