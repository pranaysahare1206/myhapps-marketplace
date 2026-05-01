// Expense Tracker App with JSON Data Persistence
const APP_DATA_KEY = 'expense_tracker_data';

let transactions = [];
let deleteId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updateUI();
});

// Load data from localStorage (simulating JSON file storage)
function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  if (data) {
    transactions = JSON.parse(data);
  } else {
    // Default empty data structure
    transactions = [];
  }
}

// Save data to localStorage (simulating JSON file storage)
function saveData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(transactions));
  
  // Also save to a JSON file format for export
  const exportData = {
    app: 'expense-tracker',
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    transactions: transactions,
    summary: {
      totalBalance: calculateBalance(),
      totalIncome: calculateIncome(),
      totalExpense: calculateExpense(),
      transactionCount: transactions.length
    }
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function addTransaction() {
  const desc = document.getElementById('desc').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const type = document.getElementById('type').value;
  
  if (!desc || !amount || amount <= 0) {
    alert('Please enter valid description and amount');
    return;
  }
  
  const transaction = {
    id: Date.now(),
    desc: desc,
    amount: amount,
    category: category,
    type: type,
    date: new Date().toISOString()
  };
  
  transactions.unshift(transaction);
  saveData();
  updateUI();
  
  // Reset form
  document.getElementById('desc').value = '';
  document.getElementById('amount').value = '';
  document.getElementById('category').value = 'food';
  document.getElementById('type').value = 'expense';
}

function deleteTransaction(id) {
  deleteId = id;
  document.getElementById('deleteModal').classList.add('active');
}

function confirmDelete() {
  if (deleteId) {
    transactions = transactions.filter(t => t.id !== deleteId);
    saveData();
    updateUI();
    deleteId = null;
  }
  closeModal();
}

function closeModal() {
  document.getElementById('deleteModal').classList.remove('active');
  deleteId = null;
}

function calculateBalance() {
  return transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);
}

function calculateIncome() {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);
}

function calculateExpense() {
  return transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);
}

function getCategoryColor(category) {
  const colors = {
    food: '#f97316',
    transport: '#3b82f6',
    shopping: '#ec4899',
    entertainment: '#8b5cf6',
    bills: '#ef4444',
    health: '#10b981',
    income: '#22c55e',
    other: '#6b7280'
  };
  return colors[category] || '#6b7280';
}

function getCategoryName(category) {
  const names = {
    food: '🍔 Food & Dining',
    transport: '🚗 Transport',
    shopping: '🛍️ Shopping',
    entertainment: '🎬 Entertainment',
    bills: '📱 Bills & Utilities',
    health: '💊 Health',
    income: '💵 Income',
    other: '📦 Other'
  };
  return names[category] || category;
}

function updateUI() {
  // Update balance
  const balance = calculateBalance();
  const income = calculateIncome();
  const expense = calculateExpense();
  
  document.getElementById('balance').textContent = formatCurrency(balance);
  document.getElementById('totalIncome').textContent = '+' + formatCurrency(income);
  document.getElementById('totalExpense').textContent = '-' + formatCurrency(expense);
  
  // Update transaction list
  const listEl = document.getElementById('transactionList');
  if (transactions.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>No transactions yet</p>
      </div>
    `;
  } else {
    listEl.innerHTML = transactions.map(t => `
      <div class="transaction-item ${t.type}">
        <div class="transaction-info">
          <div class="transaction-desc">${escapeHtml(t.desc)}</div>
          <div class="transaction-category">${getCategoryName(t.category)} • ${formatDate(t.date)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="transaction-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</span>
          <button class="btn btn-danger" onclick="deleteTransaction(${t.id})">Delete</button>
        </div>
      </div>
    `).join('');
  }
  
  // Update category chart
  updateCategoryChart();
}

function updateCategoryChart() {
  const expenses = transactions.filter(t => t.type === 'expense');
  const categoryTotals = {};
  
  expenses.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  
  const totalExpense = calculateExpense();
  const chartEl = document.getElementById('categoryChart');
  
  if (totalExpense === 0) {
    chartEl.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:20px;">No expense data yet</p>';
    return;
  }
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);
  
  chartEl.innerHTML = sortedCategories.map(([cat, amount]) => {
    const percentage = (amount / totalExpense * 100).toFixed(1);
    const color = getCategoryColor(cat);
    return `
      <div class="category-bar">
        <div class="label">
          <span>${getCategoryName(cat)}</span>
          <span>${formatCurrency(amount)} (${percentage}%)</span>
        </div>
        <div class="bar-bg">
          <div class="bar-fill" style="width:${percentage}%;background:${color}"></div>
        </div>
      </div>
    `;
  }).join('');
}

function formatCurrency(amount) {
  return '$' + Math.abs(amount).toFixed(2);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export data as JSON file
function exportData() {
  const data = localStorage.getItem(APP_DATA_KEY + '_export');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'expense-tracker-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Import data from JSON file
function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.transactions && Array.isArray(data.transactions)) {
      transactions = data.transactions;
      saveData();
      updateUI();
      return true;
    }
    return false;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}
