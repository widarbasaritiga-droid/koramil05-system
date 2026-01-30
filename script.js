// SISTEM UTAMA LAPORAN KORAMIL

// Data constants
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
               'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Global variables
let reportTimeout = null;
let databaseData = [];

// Initialize system
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    loadConfig();
    updateCacheStatus();
});

// Initialize system components
function initializeSystem() {
    // Set default date
    const today = new Date();
    document.getElementById('reportDate').value = today.toISOString().split('T')[0];
    
    // Initialize tabs
    initializeTabs();
    
    // Initialize form
    initializeForm();
    
    // Load filter options
    loadYearFilter();
    
    // Generate initial report
    updatePeriodeInfo();
    generateReport();
}

// Tab navigation
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Refresh data if needed
            if (tabId === 'database') {
                loadDatabase();
            }
        });
    });
}

// Form initialization
function initializeForm() {
    // Add input event listeners
    document.getElementById('haljol').addEventListener('input', function() {
        clearSpaces(this);
        updateReport();
    });
    
    // Initialize keterangan auto-format
    const keterangan = document.getElementById('keterangan');
    keterangan.addEventListener('keydown', handleKeteranganEnter);
    keterangan.addEventListener('input', updateKurang);
    
    // Add activity input auto-resize
    document.querySelectorAll('.activity-input').forEach(textarea => {
        textarea.addEventListener('input', function() {
            autoResizeTextarea(this);
            updateReport();
        });
    });
}

// Helper: Clear multiple spaces
function clearSpaces(input) {
    input.value = input.value.replace(/\s+/g, ' ').trim();
}

// Helper: Auto-resize textarea
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

// Format Indonesian date
function formatTanggalIndonesia(tanggal) {
    const date = new Date(tanggal);
    return {
        hari: HARI[date.getDay()],
        tanggal: date.getDate(),
        bulan: BULAN[date.getMonth()],
        tahun: date.getFullYear(),
        full: `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`
    };
}

// Update periode information
function updatePeriodeInfo() {
    const waktu = document.getElementById('reportTime').value;
    let infoText = '';
    
    if (waktu === '04.00') {
        infoText = `• 04.00 WITA: Periode sore (16.00-04.00) hari sebelumnya<br>
                    • Melaporkan kejadian dari 16.00 kemarin hingga 04.00 hari ini`;
    } else {
        infoText = `• 16.00 WITA: Periode pagi (04.00-16.00) hari yang sama<br>
                    • Melaporkan kejadian dari 04.00 hingga 16.00 hari ini`;
    }
    
    document.getElementById('periodeInfo').innerHTML = infoText;
    updateSituasi();
}

// Update situasi text
function updateSituasi() {
    const tanggalInput = document.getElementById('reportDate').value;
    const waktu = document.getElementById('reportTime').value;
    
    if (!tanggalInput) return;
    
    const tanggal = new Date(tanggalInput);
    
    if (waktu === '04.00') {
        const mulai = new Date(tanggal);
        mulai.setDate(mulai.getDate() - 1);
        mulai.setHours(16, 0, 0, 0);
        
        const selesai = new Date(tanggal);
        selesai.setHours(4, 0, 0, 0);
        
        const mulaiInfo = formatTanggalIndonesia(mulai);
        const selesaiInfo = formatTanggalIndonesia(selesai);
        
        const situasi = `-Situasi : Situasi Wilayah Koramil 1609-05/Sukasada Pada Hari ${mulaiInfo.hari} Tanggal ${mulaiInfo.tanggal} ${mulaiInfo.bulan} ${mulaiInfo.tahun} Pukul 16.00 Wita s.d Hari ${selesaiInfo.hari} Tanggal ${selesaiInfo.tanggal} ${selesaiInfo.bulan} ${selesaiInfo.tahun} Pukul 04.00 Wita dalam keadaan Aman dan Kondusif`;
        
        document.getElementById('situasiPreview').textContent = situasi;
        
    } else if (waktu === '16.00') {
        const mulai = new Date(tanggal);
        mulai.setHours(4, 0, 0, 0);
        
        const selesai = new Date(tanggal);
        selesai.setHours(16, 0, 0, 0);
        
        const tanggalInfo = formatTanggalIndonesia(tanggal);
        
        const situasi = `-Situasi : Situasi Wilayah Koramil 1609-05/Sukasada Pada Hari ${tanggalInfo.hari} Tanggal ${tanggalInfo.tanggal} ${tanggalInfo.bulan} ${tanggalInfo.tahun} Pukul 04.00 Wita s.d Pukul 16.00 Wita dalam keadaan Aman dan Kondusif`;
        
        document.getElementById('situasiPreview').textContent = situasi;
    }
}

// Handle Enter key in keterangan
function handleKeteranganEnter(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const textarea = event.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        
        const beforeCursor = text.substring(0, start);
        const lines = beforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        let newText;
        if (currentLine.trim().startsWith('-')) {
            newText = text.substring(0, start) + '\n-' + text.substring(end);
        } else {
            newText = text.substring(0, start) + '\n-' + text.substring(end);
        }
        
        textarea.value = newText;
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        
        updateKurang();
        updateReport();
    }
}

// Update kurang value from keterangan
function updateKurang() {
    const keterangan = document.getElementById('keterangan').value;
    const lines = keterangan.split('\n');
    
    let total = 0;
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') && trimmed.includes(':')) {
            const parts = trimmed.split(':');
            if (parts.length > 1) {
                const value = parseInt(parts[1].trim()) || 0;
                total += value;
            }
        }
    });
    
    document.getElementById('kurang').value = total;
    calculateSiapOps();
}

// Calculate siap ops
function calculateSiapOps() {
    const nyata = parseInt(document.getElementById('nyata').value) || 0;
    const kurang = parseInt(document.getElementById('kurang').value) || 0;
    const siapOps = nyata - kurang;
    document.getElementById('siapOps').value = siapOps > 0 ? siapOps : 0;
}

// Add activity field
function addActivity(type) {
    const container = document.getElementById(`${type}-container`);
    const items = container.querySelectorAll('.activity-item');
    
    if (items.length >= 5) {
        showNotification('Maksimal 5 kegiatan per kategori', 'warning');
        return;
    }
    
    const newItem = document.createElement('div');
    newItem.className = 'activity-item';
    newItem.innerHTML = `
        <div class="item-controls">
            <button class="btn-add-small" onclick="addActivity('${type}')">+</button>
            <button class="btn-remove-small" onclick="removeActivity(this, '${type}')">−</button>
        </div>
        <textarea class="activity-input" placeholder="Tulis kegiatan ${type} ${items.length + 1}..." oninput="updateReport()"></textarea>
    `;
    
    container.appendChild(newItem);
    
    // Add auto-resize to new textarea
    const newTextarea = newItem.querySelector('.activity-input');
    newTextarea.addEventListener('input', function() {
        autoResizeTextarea(this);
        updateReport();
    });
    
    updateReport();
}

// Remove activity field
function removeActivity(button, type) {
    const container = document.getElementById(`${type}-container`);
    const items = container.querySelectorAll('.activity-item');
    
    if (items.length <= 1) {
        showNotification('Minimal 1 kegiatan harus diisi', 'warning');
        return;
    }
    
    const item = button.closest('.activity-item');
    item.remove();
    
    updateReport();
}

// Format kegiatan items
function formatKegiatan(containerId) {
    const container = document.getElementById(containerId);
    const textareas = container.querySelectorAll('.activity-input');
    const items = [];
    
    textareas.forEach((textarea, index) => {
        let value = textarea.value.trim();
        
        // Clean spaces
        value = value.replace(/\s+/g, ' ');
        
        if (value) {
            // Ensure starts with dash
            if (!value.startsWith('-')) {
                value = '-' + value;
            } else {
                value = '-' + value.substring(1).trim();
            }
            
            // Format with number for items after first
            if (index > 0) {
                items.push(`${index + 1}) ${value.substring(1)}`);
            } else {
                items.push(value);
            }
        }
    });
    
    return items.join('\n');
}

// Update report preview
function updateReport() {
    clearTimeout(reportTimeout);
    reportTimeout = setTimeout(generateReport, 300);
}

// Generate full report
function generateReport() {
    const tanggal = document.getElementById('reportDate').value;
    const waktu = document.getElementById('reportTime').value;
    const haljol = document.getElementById('haljol').value || 'Nihil';
    
    const topDspp = document.getElementById('topDspp').value || '25';
    const nyata = document.getElementById('nyata').value || '19';
    const kurang = document.getElementById('kurang').value || '9';
    const siapOps = document.getElementById('siapOps').value || '10';
    
    const keterangan = document.getElementById('keterangan').value;
    const danramil = formatKegiatan('danramil-container');
    const koramil = formatKegiatan('koramil-container');
    const babinsa = formatKegiatan('babinsa-container');
    
    const tanggalInfo = formatTanggalIndonesia(tanggal);
    const situasi = document.getElementById('situasiPreview').textContent;
    const salam = waktu === '16.00' ? 'Sore' : 'Pagi';
    
    // Build report
    let report = `Perihal : Laporan perkembangan situasi Koramil 1609-05/Sukasada Hari ${tanggalInfo.hari} Tanggal, ${tanggalInfo.tanggal} ${tanggalInfo.bulan} ${tanggalInfo.tahun}.\n\n`;
    report += `Yth. Komandan Kodim 1609/Buleleng.\n`;
    report += `Cc. Kasdim 1609/Buleleng.\n\n`;
    
    report += `Selamat ${salam}, Mohon ijin melaporkan Situasi Satuan Koramil 1609-05/Sukasada Hari ${tanggalInfo.hari} Tanggal, ${tanggalInfo.tanggal} ${tanggalInfo.bulan} ${tanggalInfo.tahun} Pukul ${waktu} Wita dalam rangka kegiatan Pembinaan Kekuatan Satuan Bulan ${tanggalInfo.bulan} tahun ${tanggalInfo.tahun} sebagai berikut :\n\n`;
    
    report += `**I. Situasi dan Haljol :**\n\n`;
    report += `${situasi}\n\n`;
    report += `-Haljol : ${haljol}.\n\n`;
    
    report += `**II. Data Siap Ops :**\n\n`;
    report += `1. Top DSPP : ${topDspp}\n`;
    report += `2. Nyata : ${nyata}\n`;
    report += `3. Kurang : ${kurang}\n`;
    report += `4. Siap Ops : ${siapOps}\n\n`;
    report += `5. Keterangan :\n\n`;
    
    // Add keterangan lines
    keterangan.split('\n').forEach(line => {
        if (line.trim()) report += `${line.trim()}\n`;
    });
    
    report += `\n**III. Kegiatan :**\n\n`;
    report += `**1. Kegiatan Danramil :**\n\n`;
    report += `${danramil || '-Melaksanakan monitoring perkembangan situasi dan kondisi wilayah Kecamatan Sukasada Kabupaten Buleleng.'}\n\n`;
    
    report += `**2. Kegiatan Koramil :**\n\n`;
    report += `${koramil || '2 orang anggota melaksanakan dinas dalam, jaga pangkalan Koramil 1609-05/Sukasada.'}\n\n`;
    
    report += `-Para Babinsa monitoring terkait perkembangan situasi dan kondisi di wilayah Desa binaan masing-masing.\n\n`;
    
    report += `**3. Kegiatan Babinsa :**\n\n`;
    report += `${babinsa || '-Melaksanakan pemantauan dan pendataan situasi wilayah desa binaan masing-masing.'}\n`;
    report += `-Melaksanakan koordinasi dengan perangkat desa setempat.\n\n`;
    
    report += `*DEMIKIAN MMP.*\n\n`;
    report += `Dokumentasi terlampir.`;
    
    // Update preview
    document.getElementById('output').value = report;
}

// Save laporan
async function saveLaporan() {
    try {
        showLoading(true, 'Menyimpan laporan...');
        
        // Generate report data
        const reportData = {
            id: `laporan_${new Date().toISOString().split('T')[0]}_${document.getElementById('reportTime').value.replace('.', '')}`,
            tanggal: document.getElementById('reportDate').value,
            waktu: document.getElementById('reportTime').value,
            laporan: document.getElementById('output').value,
            data: {
                haljol: document.getElementById('haljol').value,
                data_siap_ops: {
                    top_dspp: document.getElementById('topDspp').value,
                    nyata: document.getElementById('nyata').value,
                    kurang: document.getElementById('kurang').value,
                    siap_ops: document.getElementById('siapOps').value
                },
                keterangan: document.getElementById('keterangan').value,
                kegiatan: {
                    danramil: formatKegiatan('danramil-container'),
                    koramil: formatKegiatan('koramil-container'),
                    babinsa: formatKegiatan('babinsa-container')
                }
            },
            timestamp: new Date().toISOString(),
            savedAt: new Date().toLocaleString('id-ID')
        };
        
        // Save to cache
        const cacheSaved = CacheManager.saveLaporan(reportData);
        
        // Save to localStorage backup
        const localSaved = saveReportToLocal(reportData);
        
        // Try to save to cloud
        let cloudSaved = false;
        try {
            cloudSaved = await saveToCloud(reportData);
        } catch (error) {
            console.warn('Cloud save failed:', error);
        }
        
        showLoading(false);
        
        if (cacheSaved || localSaved || cloudSaved) {
            showNotification('✅ Laporan berhasil disimpan', 'success');
            updateCacheStatus();
            
            // Refresh database view if open
            if (document.getElementById('database').classList.contains('active')) {
                loadDatabase();
            }
        } else {
            showNotification('⚠️ Laporan hanya tersimpan di cache lokal', 'warning');
        }
        
    } catch (error) {
        showLoading(false);
        showNotification('❌ Gagal menyimpan laporan', 'error');
        console.error('Save error:', error);
    }
}

// Save to cloud (Google Apps Script)
async function saveToCloud(data) {
    const config = getConfig();
    
    if (!config.API.WRITE_URL || config.API.WRITE_URL.includes('YOUR_')) {
        return false;
    }
    
    try {
        const response = await fetch(config.API.WRITE_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'save',
                type: 'laporan',
                data: data,
                apiKey: config.API.API_KEY,
                timestamp: new Date().toISOString()
            })
        });
        
        return true;
    } catch (error) {
        throw error;
    }
}

// Send via WhatsApp
function kirimWhatsApp() {
    const report = document.getElementById('output').value;
    
    if (!report || report.trim().length < 100) {
        showNotification('Silakan buat laporan terlebih dahulu', 'warning');
        return;
    }
    
    const encoded = encodeURIComponent(report);
    const url = `https://wa.me/?text=${encoded}`;
    
    window.open(url, '_blank');
}

// DATABASE FUNCTIONS

// Load year filter options
function loadYearFilter() {
    const select = document.getElementById('filterTahun');
    const currentYear = new Date().getFullYear();
    
    for (let year = 2023; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }
}

// Load database
async function loadDatabase() {
    try {
        showLoading(true, 'Memuat database...');
        
        // Get data from multiple sources
        const cacheData = CacheManager.getAllLaporan();
        const localData = getSavedReports();
        
        // Merge and deduplicate
        databaseData = [...cacheData, ...localData];
        
        // Remove duplicates by id
        const seen = new Set();
        databaseData = databaseData.filter(item => {
            if (!item.id || seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });
        
        // Sort by timestamp descending
        databaseData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Try to load from cloud
        try {
            const cloudData = await loadFromCloud();
            if (cloudData && Array.isArray(cloudData)) {
                cloudData.forEach(item => {
                    if (item.id && !seen.has(item.id)) {
                        databaseData.push(item);
                        seen.add(item.id);
                    }
                });
            }
        } catch (error) {
            console.warn('Cloud load failed:', error);
        }
        
        showLoading(false);
        displayDatabase();
        
    } catch (error) {
        showLoading(false);
        showNotification('❌ Gagal memuat database', 'error');
        console.error('Database load error:', error);
    }
}

// Load from cloud
async function loadFromCloud() {
    const config = getConfig();
    
    if (!config.API.READ_URL || config.API.READ_URL.includes('YOUR_')) {
        return null;
    }
    
    try {
        const response = await fetch(`${config.API.READ_URL}?action=get&type=laporan&key=${config.API.API_KEY}`);
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        return data.success ? data.data : null;
        
    } catch (error) {
        throw error;
    }
}

// Display database
function displayDatabase() {
    const container = document.getElementById('databaseTable');
    
    if (!databaseData || databaseData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="icon">📭</span>
                <p>Belum ada data laporan</p>
                <button onclick="saveLaporan()">Buat Laporan Pertama</button>
            </div>
        `;
        return;
    }
    
    // Filter data
    const tahun = document.getElementById('filterTahun').value;
    const search = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = databaseData;
    
    if (tahun) {
        filtered = filtered.filter(item => 
            item.tanggal && item.tanggal.startsWith(tahun)
        );
    }
    
    if (search) {
        filtered = filtered.filter(item =>
            JSON.stringify(item).toLowerCase().includes(search)
        );
    }
    
    // Create table
    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f1f5f9;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e0;">Tanggal</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e0;">Waktu</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e0;">Status</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e0;">Aksi</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    filtered.forEach(item => {
        const tanggal = item.tanggal || 'N/A';
        const waktu = item.waktu || 'N/A';
        const savedAt = item.savedAt || 'Cache';
        
        html += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px;">${tanggal}</td>
                <td style="padding: 12px;">${waktu}</td>
                <td style="padding: 12px;">
                    <span style="background: #c6f6d5; color: #22543d; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                        ${savedAt}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <button onclick="viewReport('${item.id}')" style="background: #4299e1; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; margin-right: 5px;">
                        Lihat
                    </button>
                    <button onclick="deleteReport('${item.id}')" style="background: #fc8181; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.85rem; cursor: pointer;">
                        Hapus
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <div style="padding: 15px; background: #f7fafc; border-top: 1px solid #e2e8f0; font-size: 0.9rem; color: #4a5568;">
            Total: ${filtered.length} laporan
        </div>
    `;
    
    container.innerHTML = html;
}

// View report
function viewReport(id) {
    const report = databaseData.find(item => item.id === id);
    if (report) {
        alert(`Laporan:\n\n${report.laporan.substring(0, 1000)}...\n\nID: ${report.id}\nTanggal: ${report.tanggal}\nWaktu: ${report.waktu}`);
    }
}

// Delete report
function deleteReport(id) {
    if (confirm('Hapus laporan ini?')) {
        // Remove from cache
        cache.remove('laporan', id);
        
        // Remove from localStorage
        const reports = getSavedReports().filter(item => item.id !== id);
        localStorage.setItem('koramil_data_v3', JSON.stringify(reports));
        
        // Remove from display
        databaseData = databaseData.filter(item => item.id !== id);
        
        showNotification('✅ Laporan dihapus', 'success');
        displayDatabase();
        updateCacheStatus();
    }
}

// UTILITY FUNCTIONS

// Update cache status
function updateCacheStatus() {
    const stats = cache.getStats();
    const status = document.getElementById('cacheStatus');
    
    if (status) {
        status.textContent = `${stats.total} item`;
    }
    
    updateSystemStatus();
}

// Get config from config.js
function getConfig() {
    return typeof CONFIG !== 'undefined' ? CONFIG : { API: {} };
}

// Load config from config.js
function loadConfig() {
    // This function is implemented in config.js
    if (typeof loadConfig === 'function') {
        loadConfig();
    }
}

// Save report to localStorage
function saveReportToLocal(reportData) {
    // This function is implemented in config.js
    if (typeof saveReportToLocal === 'function') {
        return saveReportToLocal(reportData);
    }
    return false;
}

// Show notification
function showNotification(message, type = 'info') {
    // This function is implemented in config.js
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        alert(message);
    }
}

// Show loading
function showLoading(show, message = 'Memproses...') {
    // This function is implemented in config.js
    if (typeof showLoading === 'function') {
        showLoading(show, message);
    }
}

// Update system status
function updateSystemStatus() {
    // This function is implemented in config.js
    if (typeof updateSystemStatus === 'function') {
        updateSystemStatus();
    }
}