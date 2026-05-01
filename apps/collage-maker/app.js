// Collage Maker App - Premium Feature
const APP_DATA_KEY = 'collage_maker_data';

const LAYOUTS = [
  { id: 'single', name: 'Single', cells: [[0, 0, 1, 1]] },
  { id: '2x1', name: '2 Horizontal', cells: [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] },
  { id: '1x2', name: '2 Vertical', cells: [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]] },
  { id: '2x2', name: '2x2 Grid', cells: [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]] },
  { id: '3x1', name: '3 Horizontal', cells: [[0, 0, 0.33, 1], [0.33, 0, 0.34, 1], [0.67, 0, 0.33, 1]] },
  { id: '3x3', name: '3x3 Grid', cells: [
    [0, 0, 0.33, 0.33], [0.33, 0, 0.34, 0.33], [0.67, 0, 0.33, 0.33],
    [0, 0.33, 0.33, 0.34], [0.33, 0.33, 0.34, 0.34], [0.67, 0.33, 0.33, 0.34],
    [0, 0.67, 0.33, 0.33], [0.33, 0.67, 0.34, 0.33], [0.67, 0.67, 0.33, 0.33]
  ]},
  { id: 'masonry', name: 'Masonry', cells: [[0, 0, 0.6, 0.6], [0.6, 0, 0.4, 0.4], [0.6, 0.4, 0.4, 0.6], [0, 0.6, 0.4, 0.4], [0.4, 0.6, 0.2, 0.4], [0.6, 0.6, 0.4, 0.4]] },
  { id: 'polaroid', name: 'Polaroid', cells: [[0.05, 0.05, 0.4, 0.5], [0.55, 0.1, 0.4, 0.5], [0.1, 0.6, 0.4, 0.35], [0.55, 0.65, 0.4, 0.3]] },
];

let currentLayout = LAYOUTS[3]; // 2x2 default
let images = [];
let currentFilter = 'none';
let canvas, ctx;
let appData = { history: [] };

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('collageCanvas');
  ctx = canvas.getContext('2d');
  
  loadData();
  renderLayoutSelector();
  initCanvas();
  updateHistoryUI();
});

function loadData() {
  const data = localStorage.getItem(APP_DATA_KEY);
  if (data) {
    appData = JSON.parse(data);
  }
}

function saveData() {
  localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData));
  
  // Export format
  const exportData = {
    app: 'collage-maker',
    version: '1.0',
    type: 'premium',
    lastCreated: appData.history[0]?.date,
    totalCollages: appData.history.length,
    recentCollages: appData.history.slice(0, 10)
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function renderLayoutSelector() {
  const selector = document.getElementById('layoutSelector');
  selector.innerHTML = LAYOUTS.map(layout => `
    <div class="layout-option ${layout.id === currentLayout.id ? 'selected' : ''}" 
         onclick="selectLayout('${layout.id}')">
      <div class="preview">
        <div class="layout-preview-grid" style="grid-template-columns:repeat(${getGridCols(layout)},1fr);grid-template-rows:repeat(${getGridRows(layout)},1fr)">
          ${layout.cells.map(() => '<div class="cell"></div>').join('')}
        </div>
      </div>
    </div>
  `).join('');
}

function getGridCols(layout) {
  // Simplified - just return a reasonable number
  return Math.min(layout.cells.length, 3);
}

function getGridRows(layout) {
  return Math.ceil(layout.cells.length / 3);
}

function selectLayout(id) {
  currentLayout = LAYOUTS.find(l => l.id === id);
  renderLayoutSelector();
  renderCollage();
}

function initCanvas() {
  canvas.width = 600;
  canvas.height = 600;
  renderCollage();
}

function handleFileSelect(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;
  
  files.forEach(file => {
    if (images.length >= currentLayout.cells.length) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        images.push({
          src: e.target.result,
          img: img,
          filter: currentFilter
        });
        renderCollage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  
  // Reset input
  event.target.value = '';
}

function applyFilter(filterType) {
  currentFilter = filterType;
  
  // Update UI
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Apply to all images
  images.forEach(img => img.filter = filterType);
  renderCollage();
}

function updateSettings() {
  renderCollage();
}

function renderCollage() {
  const borderWidth = parseInt(document.getElementById('borderWidth').value);
  const borderColor = document.getElementById('borderColor').value;
  const cornerRadius = parseInt(document.getElementById('cornerRadius').value);
  
  // Clear canvas
  ctx.fillStyle = borderColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  const canvasSize = Math.min(canvas.width, canvas.height);
  const contentSize = canvasSize - (borderWidth * 2);
  
  // Draw each cell
  currentLayout.cells.forEach((cell, index) => {
    const img = images[index];
    if (!img) return;
    
    const x = borderWidth + cell[0] * contentSize;
    const y = borderWidth + cell[1] * contentSize;
    const w = cell[2] * contentSize;
    const h = cell[3] * contentSize;
    
    // Create clip path for rounded corners
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, cornerRadius);
    ctx.clip();
    
    // Calculate image scaling to cover cell (object-fit: cover)
    const scale = Math.max(w / img.img.width, h / img.img.height);
    const scaledW = img.img.width * scale;
    const scaledH = img.img.height * scale;
    const offsetX = (w - scaledW) / 2;
    const offsetY = (h - scaledH) / 2;
    
    // Apply filter
    ctx.filter = getFilterString(img.filter);
    
    // Draw image
    ctx.drawImage(img.img, x + offsetX, y + offsetY, scaledW, scaledH);
    ctx.filter = 'none';
    
    ctx.restore();
  });
  
  // Draw text overlay
  const text = document.getElementById('overlayText').value;
  if (text) {
    const textSize = parseInt(document.getElementById('textSize').value);
    const textColor = document.getElementById('textColor').value;
    
    ctx.save();
    ctx.font = `bold ${textSize}px Arial`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.fillText(text, canvas.width / 2, canvas.height - textSize);
    ctx.restore();
  }
}

function getFilterString(filter) {
  switch (filter) {
    case 'grayscale': return 'grayscale(100%)';
    case 'sepia': return 'sepia(100%)';
    case 'vintage': return 'sepia(50%) contrast(1.2) saturate(0.8)';
    case 'bright': return 'brightness(1.2) saturate(1.2)';
    case 'contrast': return 'contrast(1.5)';
    default: return 'none';
  }
}

function downloadCollage() {
  if (images.length === 0) {
    alert('Please add some photos first');
    return;
  }
  
  // Save to history
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  addToHistory(dataUrl);
  
  // Download
  const link = document.createElement('a');
  link.download = `collage_${Date.now()}.jpg`;
  link.href = dataUrl;
  link.click();
}

function shareCollage() {
  if (images.length === 0) {
    alert('Please add some photos first');
    return;
  }
  
  canvas.toBlob(blob => {
    const file = new File([blob], 'collage.jpg', { type: 'image/jpeg' });
    
    if (navigator.share) {
      navigator.share({
        title: 'My Photo Collage',
        files: [file]
      });
    } else {
      alert('Sharing not supported. Please download instead.');
    }
  }, 'image/jpeg');
}

function clearAll() {
  if (images.length > 0 && confirm('Clear all photos?')) {
    images = [];
    document.getElementById('overlayText').value = '';
    renderCollage();
  }
}

function addToHistory(dataUrl) {
  const historyEntry = {
    id: Date.now(),
    image: dataUrl,
    layout: currentLayout.id,
    filter: currentFilter,
    date: new Date().toISOString(),
    photoCount: images.length
  };
  
  appData.history.unshift(historyEntry);
  if (appData.history.length > 20) {
    appData.history = appData.history.slice(0, 20);
  }
  
  saveData();
  updateHistoryUI();
}

function updateHistoryUI() {
  const grid = document.getElementById('historyGrid');
  
  if (appData.history.length === 0) {
    grid.innerHTML = '<p style="color:#9ca3af;grid-column:1/-1;text-align:center;padding:20px">No collages created yet</p>';
    return;
  }
  
  grid.innerHTML = appData.history.slice(0, 8).map(item => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `
      <div class="history-item" onclick="loadFromHistory(${item.id})">
        <img src="${item.image}" alt="Collage">
        <div class="date">${dateStr}</div>
      </div>
    `;
  }).join('') + (appData.history.length > 8 ? `<p style="color:#9ca3af;grid-column:1/-1;text-align:center">+${appData.history.length - 8} more</p>` : '');
}

function loadFromHistory(id) {
  const item = appData.history.find(h => h.id === id);
  if (!item) return;
  
  // Show preview in new window or download
  const w = window.open();
  w.document.write(`<img src="${item.image}" style="max-width:100%">`);
}

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (r < 0) r = 0;
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}
