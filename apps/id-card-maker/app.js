// ID Card PDF Maker - Premium Feature
const { jsPDF } = window.jspdf;
const APP_DATA_KEY = 'idcard_maker_data';

let currentPhoto = null;
let photoSettings = { zoom: 100, rotate: 0, shiftX: 0, shiftY: 0 };
let currentTemplate = 'corporate';

let appData = {
  templates: [],
  history: []
};

// Templates
const TEMPLATES = {
  corporate: {
    frontColor: ['#1e3c72', '#2a5298'],
    backColor: ['#f3f4f6', '#e5e7eb'],
    textColor: '#ffffff'
  },
  school: {
    frontColor: ['#11998e', '#38ef7d'],
    backColor: ['#f0fdf4', '#dcfce7'],
    textColor: '#ffffff'
  },
  event: {
    frontColor: ['#ff6b6b', '#feca57'],
    backColor: ['#fff5f5', '#fef3c7'],
    textColor: '#ffffff'
  },
  simple: {
    frontColor: ['#374151', '#4b5563'],
    backColor: ['#f9fafb', '#f3f4f6'],
    textColor: '#ffffff'
  }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  updatePreview();
  
  // Set default valid until to 1 year from now
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  document.getElementById('validUntil').value = nextYear.toISOString().split('T')[0];
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
    app: 'id-card-maker',
    version: '1.0',
    type: 'premium',
    lastUsed: new Date().toISOString(),
    savedTemplates: appData.templates.length,
    generatedCards: appData.history.length
  };
  localStorage.setItem(APP_DATA_KEY + '_export', JSON.stringify(exportData, null, 2));
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentPhoto = e.target.result;
    photoSettings = { zoom: 100, rotate: 0, shiftX: 0, shiftY: 0 };
    
    // Reset sliders
    document.getElementById('zoom').value = 100;
    document.getElementById('rotate').value = 0;
    document.getElementById('shiftX').value = 0;
    document.getElementById('shiftY').value = 0;
    updateSliderLabels();
    
    // Show editor
    document.getElementById('photoUpload').classList.add('has-photo');
    document.getElementById('photoUpload').innerHTML = `
      <div class="photo-preview">
        <img src="${currentPhoto}" id="uploadedPhoto" style="transform: scale(1) rotate(0deg) translate(0px, 0px)">
      </div>
    `;
    document.getElementById('photoEditor').style.display = 'block';
    
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function updatePhoto() {
  photoSettings.zoom = parseInt(document.getElementById('zoom').value);
  photoSettings.rotate = parseInt(document.getElementById('rotate').value);
  photoSettings.shiftX = parseInt(document.getElementById('shiftX').value);
  photoSettings.shiftY = parseInt(document.getElementById('shiftY').value);
  
  updateSliderLabels();
  
  const img = document.getElementById('uploadedPhoto');
  if (img) {
    img.style.transform = `scale(${photoSettings.zoom / 100}) rotate(${photoSettings.rotate}deg) translate(${photoSettings.shiftX}px, ${photoSettings.shiftY}px)`;
  }
  
  updatePreview();
}

function updateSliderLabels() {
  document.getElementById('zoomValue').textContent = photoSettings.zoom + '%';
  document.getElementById('rotateValue').textContent = photoSettings.rotate + '°';
  document.getElementById('shiftXValue').textContent = photoSettings.shiftX;
  document.getElementById('shiftYValue').textContent = photoSettings.shiftY;
}

function resetPhoto() {
  photoSettings = { zoom: 100, rotate: 0, shiftX: 0, shiftY: 0 };
  document.getElementById('zoom').value = 100;
  document.getElementById('rotate').value = 0;
  document.getElementById('shiftX').value = 0;
  document.getElementById('shiftY').value = 0;
  updatePhoto();
}

function removePhoto() {
  currentPhoto = null;
  document.getElementById('photoUpload').classList.remove('has-photo');
  document.getElementById('photoUpload').innerHTML = `
    <div class="icon">📷</div>
    <div class="text">Click to upload photo<br>or drag and drop</div>
    <input type="file" id="photoInput" accept="image/*" onchange="handlePhotoUpload(event)">
  `;
  document.getElementById('photoEditor').style.display = 'none';
  updatePreview();
}

function setTemplate(template) {
  currentTemplate = template;
  
  // Update UI
  document.querySelectorAll('.template-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // Apply template colors
  const templateData = TEMPLATES[template];
  const frontCard = document.getElementById('frontCard');
  frontCard.style.background = `linear-gradient(135deg, ${templateData.frontColor[0]} 0%, ${templateData.frontColor[1]} 100%)`;
  
  updatePreview();
}

function updatePreview() {
  const orgName = document.getElementById('orgName').value || 'Organization';
  const fullName = document.getElementById('fullName').value || 'Your Name';
  const designation = document.getElementById('designation').value || 'Designation';
  const idNumber = document.getElementById('idNumber').value || '---';
  const department = document.getElementById('department').value || '---';
  const validUntil = document.getElementById('validUntil').value;
  const emergency = document.getElementById('emergency').value || 'Not specified';
  const backInfo = document.getElementById('backInfo').value || 'No additional information';
  
  // Update front
  document.getElementById('previewName').textContent = fullName;
  document.getElementById('previewOrg').textContent = orgName.toUpperCase();
  document.getElementById('previewId').textContent = idNumber;
  document.getElementById('previewDept').textContent = department;
  document.getElementById('previewValid').textContent = validUntil ? new Date(validUntil).toLocaleDateString() : '---';
  
  // Update photo
  const photoArea = document.getElementById('cardPhotoArea');
  if (currentPhoto) {
    photoArea.innerHTML = `<img src="${currentPhoto}" style="transform: scale(${photoSettings.zoom/100}) rotate(${photoSettings.rotate}deg) translate(${photoSettings.shiftX/2}px, ${photoSettings.shiftY/2}px)">`;
  } else {
    photoArea.innerHTML = '<span class="placeholder">👤</span>';
  }
  
  // Update back
  document.getElementById('previewEmergency').textContent = emergency;
  document.getElementById('previewBackInfo').textContent = backInfo;
}

async function generatePDF() {
  const orgName = document.getElementById('orgName').value || 'Organization';
  const fullName = document.getElementById('fullName').value || 'Your Name';
  const designation = document.getElementById('designation').value || 'Designation';
  const idNumber = document.getElementById('idNumber').value || 'N/A';
  const department = document.getElementById('department').value || 'N/A';
  const validUntil = document.getElementById('validUntil').value;
  const emergency = document.getElementById('emergency').value || 'N/A';
  const backInfo = document.getElementById('backInfo').value || '';
  
  // Create PDF (landscape A4 to fit both cards side by side)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  const cardWidth = 85.6; // Standard ID card width in mm
  const cardHeight = 53.98; // Standard ID card height in mm
  const margin = 10;
  
  // Helper function to draw a card
  async function drawCard(x, y, isFront) {
    const template = TEMPLATES[currentTemplate];
    
    // Card background
    doc.setFillColor(isFront ? template.frontColor[0].replace('#', '') : template.backColor[0].replace('#', ''));
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    
    if (isFront) {
      // Photo area
      const photoSize = 25;
      doc.setFillColor(200, 200, 200);
      doc.roundedRect(x + 5, y + 5, photoSize, photoSize * 1.3, 2, 2, 'F');
      
      // Add photo if available
      if (currentPhoto) {
        try {
          doc.addImage(currentPhoto, 'JPEG', x + 5, y + 5, photoSize, photoSize * 1.3);
        } catch (e) {
          console.log('Could not add photo to PDF');
        }
      }
      
      // Text content
      doc.setTextColor(255, 255, 255);
      
      // Organization name at top
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(orgName.toUpperCase(), x + cardWidth / 2, y + 8, { align: 'center' });
      
      // Name and details on right
      doc.setFontSize(14);
      doc.text(fullName, x + photoSize + 10, y + 15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(designation.toUpperCase(), x + photoSize + 10, y + 20);
      
      // Info section
      doc.setFontSize(8);
      doc.text(`ID: ${idNumber}`, x + photoSize + 10, y + 30);
      doc.text(`Dept: ${department}`, x + photoSize + 10, y + 35);
      doc.text(`Valid: ${validUntil ? new Date(validUntil).toLocaleDateString() : 'N/A'}`, x + photoSize + 10, y + 40);
      
    } else {
      // Back side
      doc.setTextColor(50, 50, 50);
      
      // Emergency contact
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('EMERGENCY CONTACT', x + 5, y + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(emergency, x + 5, y + 16);
      
      // Additional info
      if (backInfo) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATION', x + 5, y + 26);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        
        // Wrap text
        const splitText = doc.splitTextToSize(backInfo, cardWidth - 10);
        doc.text(splitText, x + 5, y + 32);
      }
      
      // QR Code placeholder text
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(x + cardWidth - 25, y + 5, 20, 20, 2, 2, 'F');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('QR', x + cardWidth - 17, y + 17, { align: 'center' });
    }
  }
  
  // Draw front card on left, back card on right
  const centerY = (doc.internal.pageSize.height - cardHeight) / 2;
  const totalWidth = cardWidth * 2 + margin;
  const startX = (doc.internal.pageSize.width - totalWidth) / 2;
  
  await drawCard(startX, centerY, true);
  await drawCard(startX + cardWidth + margin, centerY, false);
  
  // Add title
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${fullName} - ID Card`, doc.internal.pageSize.width / 2, 10, { align: 'center' });
  
  // Save
  doc.save(`${fullName.replace(/\s+/g, '_')}_ID_Card.pdf`);
  
  // Add to history
  addToHistory(fullName, orgName);
}

function addToHistory(name, org) {
  const historyEntry = {
    id: Date.now(),
    name: name,
    organization: org,
    template: currentTemplate,
    date: new Date().toISOString()
  };
  
  appData.history.unshift(historyEntry);
  if (appData.history.length > 20) {
    appData.history = appData.history.slice(0, 20);
  }
  
  saveData();
}

function saveTemplate() {
  const templateData = {
    id: Date.now(),
    orgName: document.getElementById('orgName').value,
    designation: document.getElementById('designation').value,
    department: document.getElementById('department').value,
    backInfo: document.getElementById('backInfo').value,
    template: currentTemplate,
    date: new Date().toISOString()
  };
  
  appData.templates.push(templateData);
  saveData();
  
  alert('Template saved successfully!');
}

function loadTemplate(id) {
  const template = appData.templates.find(t => t.id === id);
  if (!template) return;
  
  document.getElementById('orgName').value = template.orgName || '';
  document.getElementById('designation').value = template.designation || '';
  document.getElementById('department').value = template.department || '';
  document.getElementById('backInfo').value = template.backInfo || '';
  
  // Set template style
  if (template.template && TEMPLATES[template.template]) {
    currentTemplate = template.template;
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.textContent.toLowerCase() === template.template) {
        btn.classList.add('active');
      }
    });
  }
  
  updatePreview();
}
