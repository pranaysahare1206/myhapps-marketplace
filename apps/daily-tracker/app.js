// Daily Tracker App with JSON Data Persistence
const APP_DATA_KEY = 'daily_tracker_data';
const DAILY_GOAL = 8; // 8 glasses of water

let dailyData = {
  date: new Date().toDateString(),
  mood: 0,
  waterGlasses: 0,
  sleepHours: 0,
  sleepMinutes: 0,
  tasks: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateDateDisplay();
  updateUI();
});

function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  const today = new Date().toDateString();
  
  if (data) {
    const parsed = JSON.parse(data);
    // Check if it's a new day
    if (parsed.date === today) {
      dailyData = parsed;
    } else {
      // Save yesterday's data to history and reset for today
      saveToHistory(parsed);
      dailyData = {
        date: today,
        mood: 0,
        waterGlasses: 0,
        sleepHours: 0,
        sleepMinutes: 0,
        tasks: []
      };
      saveData();
    }
  } else {
    dailyData.date = today;
    saveData();
  }
}

function saveData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(dailyData));
  
  // Save export format
  const exportData = {
    app: 'daily-tracker',
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    today: dailyData,
    summary: {
      completionPercentage: calculateCompletion(),
      tasksCompleted: dailyData.tasks.filter(t => t.completed).length,
      totalTasks: dailyData.tasks.length,
      waterProgress: (dailyData.waterGlasses / DAILY_GOAL * 100).toFixed(1)
    }
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function saveToHistory(dayData) {
  const historyKey = APP_DATA_KEY + '_history';
  let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  history.push(dayData);
  // Keep only last 30 days
  if (history.length > 30) history = history.slice(-30);
  localStorage.setItem(historyKey, JSON.stringify(history));
}

function updateDateDisplay() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', options);
}

function setMood(level) {
  dailyData.mood = level;
  saveData();
  updateUI();
}

function addWater() {
  if (dailyData.waterGlasses < 16) {
    dailyData.waterGlasses++;
    saveData();
    updateUI();
  }
}

function resetWater() {
  dailyData.waterGlasses = 0;
  saveData();
  updateUI();
}

function logSleep() {
  const hours = parseFloat(document.getElementById('sleepHours').value) || 0;
  const minutes = parseInt(document.getElementById('sleepMinutes').value) || 0;
  
  dailyData.sleepHours = hours;
  dailyData.sleepMinutes = minutes;
  saveData();
  updateUI();
  
  // Reset inputs
  document.getElementById('sleepHours').value = '';
  document.getElementById('sleepMinutes').value = '';
}

function addTask() {
  const input = document.getElementById('taskInput');
  const text = input.value.trim();
  
  if (!text) return;
  
  const task = {
    id: Date.now(),
    text: text,
    completed: false,
    createdAt: new Date().toISOString()
  };
  
  dailyData.tasks.push(task);
  saveData();
  updateUI();
  
  input.value = '';
}

function toggleTask(id) {
  const task = dailyData.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveData();
    updateUI();
  }
}

function deleteTask(id) {
  dailyData.tasks = dailyData.tasks.filter(t => t.id !== id);
  saveData();
  updateUI();
}

function calculateCompletion() {
  let score = 0;
  let maxScore = 4; // mood, water, sleep, tasks
  
  if (dailyData.mood > 0) score++;
  if (dailyData.waterGlasses >= DAILY_GOAL * 0.5) score += 0.5;
  if (dailyData.waterGlasses >= DAILY_GOAL) score += 0.5;
  if (dailyData.sleepHours >= 6) score++;
  
  const completedTasks = dailyData.tasks.filter(t => t.completed).length;
  const totalTasks = dailyData.tasks.length;
  if (totalTasks > 0) {
    score += completedTasks / totalTasks;
  } else {
    score += 0.5; // neutral if no tasks
  }
  
  return Math.round((score / maxScore) * 100);
}

function updateUI() {
  // Update mood selection
  document.querySelectorAll('.mood-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (parseInt(btn.dataset.mood) === dailyData.mood) {
      btn.classList.add('selected');
    }
  });
  
  // Update water visual
  const waterContainer = document.getElementById('waterVisual');
  waterContainer.innerHTML = '';
  for (let i = 0; i < DAILY_GOAL; i++) {
    const drop = document.createElement('span');
    drop.className = 'water-drop' + (i < dailyData.waterGlasses ? ' filled' : '');
    drop.textContent = '💧';
    waterContainer.appendChild(drop);
  }
  
  // Update water stats
  const waterMl = dailyData.waterGlasses * 250;
  const goalMl = DAILY_GOAL * 250;
  document.getElementById('waterStats').textContent = 
    `${dailyData.waterGlasses} / ${DAILY_GOAL} glasses (${waterMl}ml / ${goalMl}ml)`;
  
  // Update sleep display
  if (dailyData.sleepHours > 0 || dailyData.sleepMinutes > 0) {
    const totalHours = dailyData.sleepHours + (dailyData.sleepMinutes / 60);
    document.getElementById('sleepDisplay').innerHTML = `
      <div class="hours">${totalHours.toFixed(1)}</div>
      <div class="label">hours slept last night</div>
    `;
  }
  
  // Update task list
  const taskList = document.getElementById('taskList');
  if (dailyData.tasks.length === 0) {
    taskList.innerHTML = '<p style="text-align:center;color:#9a3412;padding:20px;">No tasks yet. Add one above!</p>';
  } else {
    taskList.innerHTML = dailyData.tasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}">
        <input type="checkbox" class="task-checkbox" 
          ${task.completed ? 'checked' : ''} 
          onchange="toggleTask(${task.id})">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <button class="task-delete" onclick="deleteTask(${task.id})">✕</button>
      </div>
    `).join('');
  }
  
  // Update progress ring
  const completion = calculateCompletion();
  const circle = document.getElementById('progressRing');
  const text = document.getElementById('progressText');
  const circumference = 2 * Math.PI * 52; // r=52
  const offset = circumference - (completion / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  text.textContent = completion + '%';
  
  // Color based on completion
  if (completion >= 80) {
    circle.style.stroke = '#22c55e';
    text.style.fill = '#166534';
  } else if (completion >= 50) {
    circle.style.stroke = '#f59e0b';
    text.style.fill = '#92400e';
  } else {
    circle.style.stroke = '#ef4444';
    text.style.fill = '#991b1b';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Enter key for task input
document.addEventListener('keypress', (e) => {
  if (e.target.id === 'taskInput' && e.key === 'Enter') {
    addTask();
  }
});

// Export/Import functions
function exportData() {
  const data = localStorage.getItem(APP_DATA_KEY + '_export');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daily-tracker-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function getWeeklyStats() {
  const history = JSON.parse(localStorage.getItem(APP_DATA_KEY + '_history') || '[]');
  const weekData = history.slice(-7);
  
  return {
    avgMood: (weekData.reduce((acc, d) => acc + d.mood, 0) / weekData.length).toFixed(1),
    avgWater: (weekData.reduce((acc, d) => acc + d.waterGlasses, 0) / weekData.length).toFixed(1),
    avgSleep: (weekData.reduce((acc, d) => acc + d.sleepHours + d.sleepMinutes/60, 0) / weekData.length).toFixed(1),
    totalTasksCompleted: weekData.reduce((acc, d) => acc + d.tasks.filter(t => t.completed).length, 0)
  };
}
