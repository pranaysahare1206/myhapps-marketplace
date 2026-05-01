// Snake Rush Game with JSON High Score Storage
const APP_DATA_KEY = 'snake_game_data';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const TILE_COUNT = canvas.width / GRID_SIZE;

let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let gameLoop = null;
let gameSpeed = 100;
let isPaused = false;
let isGameOver = false;

let gameData = {
  highScore: 0,
  scores: [] // Top 10 scores
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateUI();
  drawStartScreen();
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
    app: 'snake-game',
    version: '1.0',
    lastPlayed: new Date().toISOString(),
    highScore: gameData.highScore,
    topScores: gameData.scores,
    totalGamesPlayed: gameData.scores.length
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function startGame() {
  // Reset game state
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ];
  direction = 'right';
  nextDirection = 'right';
  score = 0;
  isPaused = false;
  isGameOver = false;
  
  // Get selected speed
  gameSpeed = parseInt(document.getElementById('speedSelect').value);
  const speedText = document.getElementById('speedSelect').options[document.getElementById('speedSelect').selectedIndex].text;
  document.getElementById('speedLevel').textContent = speedText;
  
  // Hide overlays
  document.getElementById('startOverlay').classList.add('hidden');
  document.getElementById('gameOverOverlay').classList.add('hidden');
  
  // Place food
  placeFood();
  
  // Start game loop
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, gameSpeed);
  
  updateUI();
}

function gameStep() {
  if (isPaused || isGameOver) return;
  
  direction = nextDirection;
  
  // Move snake
  const head = { ...snake[0] };
  
  switch (direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  // Check wall collision
  if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
    gameOver();
    return;
  }
  
  // Check self collision
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }
  
  snake.unshift(head);
  
  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    // Bonus for speed
    if (gameSpeed <= 50) score += 5;
    else if (gameSpeed <= 70) score += 3;
    else if (gameSpeed <= 100) score += 1;
    
    placeFood();
    updateUI();
  } else {
    snake.pop();
  }
  
  draw();
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * TILE_COUNT),
      y: Math.floor(Math.random() * TILE_COUNT)
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
}

function gameOver() {
  isGameOver = true;
  clearInterval(gameLoop);
  
  // Update high score
  if (score > gameData.highScore) {
    gameData.highScore = score;
  }
  
  // Add to scores list
  gameData.scores.push({
    score: score,
    date: new Date().toISOString(),
    speed: document.getElementById('speedLevel').textContent
  });
  
  // Keep top 10
  gameData.scores.sort((a, b) => b.score - a.score);
  gameData.scores = gameData.scores.slice(0, 10);
  
  saveData();
  
  // Show game over overlay
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalHighScore').textContent = gameData.highScore;
  document.getElementById('gameOverOverlay').classList.remove('hidden');
  
  updateLeaderboard();
  updateUI();
}

function togglePause() {
  isPaused = !isPaused;
}

function changeDirection(newDir) {
  // Prevent 180-degree turns
  const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
  if (opposites[newDir] !== direction) {
    nextDirection = newDir;
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid (subtle)
  ctx.strokeStyle = '#1a1a2e';
  ctx.lineWidth = 1;
  for (let i = 0; i < TILE_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(canvas.width, i * GRID_SIZE);
    ctx.stroke();
  }
  
  // Draw food with glow
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(
    food.x * GRID_SIZE + GRID_SIZE / 2,
    food.y * GRID_SIZE + GRID_SIZE / 2,
    GRID_SIZE / 2 - 2,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // Draw snake
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    
    // Gradient color from head to tail
    const greenValue = Math.max(100, 200 - index * 10);
    ctx.fillStyle = isHead ? '#4ade80' : `rgb(74, ${greenValue}, 128)`;
    
    // Glow for head
    if (isHead) {
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 10;
    }
    
    ctx.fillRect(
      segment.x * GRID_SIZE + 1,
      segment.y * GRID_SIZE + 1,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    );
    
    ctx.shadowBlur = 0;
    
    // Draw eyes on head
    if (isHead) {
      ctx.fillStyle = '#0f0f23';
      const eyeSize = 3;
      const eyeOffset = 5;
      
      if (direction === 'right' || direction === 'left') {
        ctx.fillRect(
          segment.x * GRID_SIZE + (direction === 'right' ? 14 : 4),
          segment.y * GRID_SIZE + 5,
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * GRID_SIZE + (direction === 'right' ? 14 : 4),
          segment.y * GRID_SIZE + 12,
          eyeSize,
          eyeSize
        );
      } else {
        ctx.fillRect(
          segment.x * GRID_SIZE + 5,
          segment.y * GRID_SIZE + (direction === 'down' ? 14 : 4),
          eyeSize,
          eyeSize
        );
        ctx.fillRect(
          segment.x * GRID_SIZE + 12,
          segment.y * GRID_SIZE + (direction === 'down' ? 14 : 4),
          eyeSize,
          eyeSize
        );
      }
    }
  });
}

function drawStartScreen() {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw snake pattern
  ctx.fillStyle = '#1a1a2e';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(50 + i * 25, 180, 20, 20);
  }
  
  ctx.fillStyle = '#4ade80';
  ctx.font = '20px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('🐍 Press Start to Play', canvas.width / 2, canvas.height / 2);
}

function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('highScore').textContent = gameData.highScore;
  document.getElementById('overlayHighScore').textContent = gameData.highScore;
  updateLeaderboard();
}

function updateLeaderboard() {
  const list = document.getElementById('leaderboard');
  if (gameData.scores.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#666;">No scores yet</li>';
    return;
  }
  
  list.innerHTML = gameData.scores.slice(0, 5).map((s, i) => {
    const date = new Date(s.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `
      <li>
        <span><span class="rank">#${i + 1}</span> ${s.score} pts</span>
        <span class="date">${dateStr} • ${s.speed}</span>
      </li>
    `;
  }).join('');
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp': changeDirection('up'); e.preventDefault(); break;
    case 'ArrowDown': changeDirection('down'); e.preventDefault(); break;
    case 'ArrowLeft': changeDirection('left'); e.preventDefault(); break;
    case 'ArrowRight': changeDirection('right'); e.preventDefault(); break;
    case ' ': togglePause(); e.preventDefault(); break;
  }
});

// Touch controls for mobile
document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (!touchStartX || !touchStartY) return;
  
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    changeDirection(dx > 0 ? 'right' : 'left');
  } else {
    changeDirection(dy > 0 ? 'down' : 'up');
  }
  
  touchStartX = null;
  touchStartY = null;
}, { passive: true });

let touchStartX, touchStartY;

// Initial draw
drawStartScreen();
