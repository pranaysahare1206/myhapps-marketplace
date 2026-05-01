// Habit Tracker App - Premium Feature
const APP_DATA_KEY = 'habit_tracker_data';

let habits = [];
let selectedColor = '#f5576c';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupColorPicker();
  updateUI();
});

function setupColorPicker() {
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedColor = opt.dataset.color;
    });
  });
}

function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    habits = parsed.habits || [];
  }
}

function saveData() {
  const data = {
    habits: habits,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(data));
  
  // Export format
  const exportData = {
    app: 'habit-tracker',
    version: '1.0',
    type: 'premium',
    lastUpdated: new Date().toISOString(),
    habits: habits,
    stats: calculateStats()
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function addHabit() {
  const name = document.getElementById('habitName').value.trim();
  const icon = document.getElementById('habitIcon').value;
  
  if (!name) {
    alert('Please enter a habit name');
    return;
  }
  
  const habit = {
    id: Date.now(),
    name: name,
    icon: icon,
    color: selectedColor,
    createdAt: new Date().toISOString(),
    checkIns: {} // date string -> boolean
  };
  
  habits.push(habit);
  saveData();
  updateUI();
  
  // Reset form
  document.getElementById('habitName').value = '';
  document.getElementById('habitIcon').value = '📚';
}

function deleteHabit(id) {
  if (confirm('Delete this habit? All history will be lost.')) {
    habits = habits.filter(h => h.id !== id);
    saveData();
    updateUI();
  }
}

function toggleCheckIn(habitId, dateStr) {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;
  
  // Don't allow future dates
  const checkDate = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (checkDate > today) return;
  
  habit.checkIns[dateStr] = !habit.checkIns[dateStr];
  saveData();
  updateUI();
}

function getWeekDates() {
  const dates = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toDateString());
  }
  return dates;
}

function getDayLabel(dateStr) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const d = new Date(dateStr);
  return days[d.getDay()];
}

function calculateStreak(habit) {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    
    if (habit.checkIns[dateStr]) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

function calculateTotalStreak() {
  return habits.reduce((acc, h) => acc + calculateStreak(h), 0);
}

function calculateBestStreak() {
  if (habits.length === 0) return 0;
  return Math.max(...habits.map(h => calculateStreak(h)));
}

function calculateStats() {
  const totalHabits = habits.length;
  const totalChecks = habits.reduce((acc, h) => 
    acc + Object.values(h.checkIns).filter(v => v).length, 0);
  const bestStreak = calculateBestStreak();
  const totalStreak = calculateTotalStreak();
  
  // Calculate completion rate for last 7 days
  const weekDates = getWeekDates();
  let possibleChecks = totalHabits * 7;
  let actualChecks = 0;
  habits.forEach(h => {
    weekDates.forEach(date => {
      if (h.checkIns[date]) actualChecks++;
    });
  });
  const completionRate = possibleChecks > 0 ? Math.round((actualChecks / possibleChecks) * 100) : 0;
  
  return {
    totalHabits,
    totalChecks,
    bestStreak,
    totalStreak,
    completionRate
  };
}

function updateUI() {
  const weekDates = getWeekDates();
  const today = new Date().toDateString();
  
  // Update header stats
  const stats = calculateStats();
  document.getElementById('totalStreak').textContent = stats.totalStreak;
  document.getElementById('totalHabits').textContent = stats.totalHabits;
  document.getElementById('completionRate').textContent = stats.completionRate + '%';
  document.getElementById('bestStreak').textContent = stats.bestStreak;
  document.getElementById('totalChecks').textContent = stats.totalChecks;
  
  // Update habits list
  const listEl = document.getElementById('habitsList');
  if (habits.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="icon">🎯</div>
        <p>No habits yet. Create your first one!</p>
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = habits.map(habit => {
    const streak = calculateStreak(habit);
    const totalChecks = Object.values(habit.checkIns).filter(v => v).length;
    
    const weekHtml = weekDates.map(date => {
      const isCompleted = habit.checkIns[date];
      const isFuture = new Date(date) > new Date();
      const dayLabel = getDayLabel(date);
      const isToday = date === today;
      
      return `
        <div class="day-box">
          <div class="day-label" style="${isToday ? 'color:' + habit.color + ';font-weight:bold' : ''}">${dayLabel}</div>
          <div class="day-check ${isCompleted ? 'completed' : ''} ${isFuture ? 'future' : ''}"
               style="${isCompleted ? 'background:' + habit.color : ''}"
               onclick="toggleCheckIn(${habit.id}, '${date}')">
            ${isCompleted ? '✓' : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="habit-card" style="border-left-color:${habit.color}">
        <div class="habit-header">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="habit-icon">${habit.icon}</span>
            <span class="habit-title">${escapeHtml(habit.name)}</span>
          </div>
          <button class="delete-btn" onclick="deleteHabit(${habit.id})">Delete</button>
        </div>
        <div class="habit-stats">
          <div class="stat-box">
            <div class="stat-value" style="color:${habit.color}">${streak}</div>
            <div class="stat-label">Day Streak</div>
          </div>
          <div class="stat-box">
            <div class="stat-value" style="color:${habit.color}">${totalChecks}</div>
            <div class="stat-label">Total Done</div>
          </div>
        </div>
        <div class="week-tracker">
          ${weekHtml}
        </div>
      </div>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function exportData() {
  const data = localStorage.getItem(APP_DATA_KEY + '_export');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'habit-tracker-data.json';
  a.click();
  URL.revokeObjectURL(url);
}
