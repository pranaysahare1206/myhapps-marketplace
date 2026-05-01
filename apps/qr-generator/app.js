// QR Code Generator Tool with JSON History Storage
const APP_DATA_KEY = 'qr_generator_data';

let currentType = 'url';
let currentQR = null;

let appData = {
  history: []
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
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
    app: 'qr-generator',
    version: '1.0',
    lastGenerated: appData.history[0]?.date,
    totalGenerated: appData.history.length,
    history: appData.history.slice(0, 20)
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function setType(type) {
  currentType = type;
  
  // Update tabs
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  event.target.classList.add('active');
  
  // Hide all inputs
  document.getElementById('urlInput').style.display = 'none';
  document.getElementById('textInput').style.display = 'none';
  document.getElementById('wifiInput').style.display = 'none';
  document.getElementById('contactInput').style.display = 'none';
  document.getElementById('emailInput').style.display = 'none';
  
  // Show selected input
  document.getElementById(type + 'Input').style.display = 'block';
  if (type === 'wifi' || type === 'contact' || type === 'email') {
    document.getElementById(type + 'Input').style.display = 'block';
  }
}

function getQRContent() {
  switch (currentType) {
    case 'url':
      const url = document.getElementById('url').value.trim();
      return url ? (url.startsWith('http') ? url : 'https://' + url) : '';
    
    case 'text':
      return document.getElementById('text').value.trim();
    
    case 'wifi':
      const ssid = document.getElementById('wifiSsid').value.trim();
      const pass = document.getElementById('wifiPass').value;
      const type = document.getElementById('wifiType').value;
      if (!ssid) return '';
      return `WIFI:T:${type};S:${ssid};P:${pass};;`;
    
    case 'contact':
      const name = document.getElementById('contactName').value.trim();
      const phone = document.getElementById('contactPhone').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      if (!name) return '';
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
    
    case 'email':
      const to = document.getElementById('emailTo').value.trim();
      const subject = document.getElementById('emailSubject').value;
      const body = document.getElementById('emailBody').value;
      if (!to) return '';
      return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    default:
      return '';
  }
}

function generateQR() {
  const content = getQRContent();
  
  if (!content) {
    alert('Please fill in the required fields');
    return;
  }
  
  const color = document.getElementById('qrColor').value;
  const bgColor = document.getElementById('bgColor').value;
  const size = parseInt(document.getElementById('qrSize').value);
  
  // Clear previous QR
  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';
  
  // Generate new QR using QRCode.js
  try {
    new QRCode(qrContainer, {
      text: content,
      width: size,
      height: size,
      colorDark: color,
      colorLight: bgColor,
      correctLevel: QRCode.CorrectLevel.M
    });
    
    // Show result
    document.getElementById('resultSection').classList.add('active');
    
    // Save to history
    addToHistory(content, currentType);
    
    // Scroll to result
    setTimeout(() => {
      document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
  } catch (e) {
    alert('Error generating QR code. Please check your input.');
    console.error(e);
  }
}

function addToHistory(content, type) {
  const historyEntry = {
    id: Date.now(),
    type: type,
    content: content.substring(0, 100), // Truncate for storage
    fullContent: content,
    date: new Date().toISOString(),
    color: document.getElementById('qrColor').value,
    bgColor: document.getElementById('bgColor').value,
    size: document.getElementById('qrSize').value
  };
  
  appData.history.unshift(historyEntry);
  if (appData.history.length > 20) {
    appData.history = appData.history.slice(0, 20);
  }
  
  saveData();
  updateHistoryUI();
}

function updateHistoryUI() {
  const list = document.getElementById('historyList');
  
  if (appData.history.length === 0) {
    list.innerHTML = `
      <li class="empty-state">
        <div class="icon">📭</div>
        <p>No QR codes generated yet</p>
      </li>
    `;
    return;
  }
  
  const typeLabels = {
    url: '🔗 URL',
    text: '📝 Text',
    wifi: '📶 WiFi',
    contact: '👤 Contact',
    email: '📧 Email'
  };
  
  list.innerHTML = appData.history.slice(0, 10).map(item => {
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    
    // Get preview text
    let preview = item.content;
    if (item.type === 'wifi') {
      const match = preview.match(/S:([^;]+)/);
      preview = match ? `WiFi: ${match[1]}` : 'WiFi Network';
    } else if (item.type === 'contact') {
      const match = preview.match(/FN:([^\n]+)/);
      preview = match ? match[1] : 'Contact';
    } else if (preview.length > 30) {
      preview = preview.substring(0, 30) + '...';
    }
    
    return `
      <li class="history-item">
        <div class="info">
          <div class="type">${typeLabels[item.type]}</div>
          <div class="content">${escapeHtml(preview)}</div>
          <div class="date">${dateStr}</div>
        </div>
        <div class="actions">
          <button class="icon-btn view" onclick="regenerateQR(${item.id})" title="Regenerate">🔄</button>
          <button class="icon-btn delete" onclick="deleteHistory(${item.id})" title="Delete">🗑️</button>
        </div>
      </li>
    `;
  }).join('');
}

function regenerateQR(id) {
  const item = appData.history.find(h => h.id === id);
  if (!item) return;
  
  // Restore settings
  document.getElementById('qrColor').value = item.color;
  document.getElementById('bgColor').value = item.bgColor;
  document.getElementById('qrSize').value = item.size;
  
  // Switch to correct type
  setType(item.type);
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.textContent.includes(getTypeLabel(item.type))) {
      tab.click();
    }
  });
  
  // Fill in content
  switch (item.type) {
    case 'url':
      document.getElementById('url').value = item.fullContent;
      break;
    case 'text':
      document.getElementById('text').value = item.fullContent;
      break;
    case 'wifi':
      // Parse WiFi format
      const ssidMatch = item.fullContent.match(/S:([^;]+)/);
      const passMatch = item.fullContent.match(/P:([^;]*)/);
      const typeMatch = item.fullContent.match(/T:([^;]+)/);
      if (ssidMatch) document.getElementById('wifiSsid').value = ssidMatch[1];
      if (passMatch) document.getElementById('wifiPass').value = passMatch[1];
      if (typeMatch) document.getElementById('wifiType').value = typeMatch[1];
      break;
    case 'contact':
      const nameMatch = item.fullContent.match(/FN:([^\n]+)/);
      const phoneMatch = item.fullContent.match(/TEL:([^\n]+)/);
      const emailMatch = item.fullContent.match(/EMAIL:([^\n]+)/);
      if (nameMatch) document.getElementById('contactName').value = nameMatch[1];
      if (phoneMatch) document.getElementById('contactPhone').value = phoneMatch[1];
      if (emailMatch) document.getElementById('contactEmail').value = emailMatch[1];
      break;
    case 'email':
      const emailToMatch = item.fullContent.match(/mailto:([^?]+)/);
      const subjectMatch = item.fullContent.match(/[?&]subject=([^&]+)/);
      const bodyMatch = item.fullContent.match(/[?&]body=([^&]+)/);
      if (emailToMatch) document.getElementById('emailTo').value = decodeURIComponent(emailToMatch[1]);
      if (subjectMatch) document.getElementById('emailSubject').value = decodeURIComponent(subjectMatch[1]);
      if (bodyMatch) document.getElementById('emailBody').value = decodeURIComponent(bodyMatch[1]);
      break;
  }
  
  // Generate
  setTimeout(generateQR, 100);
}

function deleteHistory(id) {
  appData.history = appData.history.filter(h => h.id !== id);
  saveData();
  updateHistoryUI();
}

function downloadQR() {
  const qrContainer = document.getElementById('qrcode');
  const img = qrContainer.querySelector('img');
  
  if (!img) {
    alert('Please generate a QR code first');
    return;
  }
  
  const link = document.createElement('a');
  link.href = img.src;
  link.download = `qrcode_${Date.now()}.png`;
  link.click();
}

function shareQR() {
  const qrContainer = document.getElementById('qrcode');
  const img = qrContainer.querySelector('img');
  
  if (!img) {
    alert('Please generate a QR code first');
    return;
  }
  
  if (navigator.share) {
    fetch(img.src)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], 'qrcode.png', { type: 'image/png' });
        navigator.share({
          title: 'QR Code',
          files: [file]
        });
      });
  } else {
    alert('Sharing not supported on this device. Please download the QR code instead.');
  }
}

function getTypeLabel(type) {
  const labels = {
    url: 'URL',
    text: 'Text',
    wifi: 'WiFi',
    contact: 'Contact',
    email: 'Email'
  };
  return labels[type] || type;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
