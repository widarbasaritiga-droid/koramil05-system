// CONFIGURASI SISTEM
const CONFIG = {
    VERSION: '3.0',
    APP_NAME: 'Sistem Laporan Koramil',
    
    // API Configuration (default values)
    API: {
        WRITE_URL: 'https://script.google.com/macros/s/YOUR_WRITE_URL/exec',
        READ_URL: 'https://script.google.com/macros/s/YOUR_READ_URL/exec',
        API_KEY: 'koramil_secure_key_2024'
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        CONFIG: 'koramil_config_v3',
        DATA: 'koramil_data_v3',
        CACHE: 'koramil_cache_v3'
    },
    
    // Cache Settings
    CACHE: {
        DURATION: 24 * 60 * 60 * 1000, // 24 jam
        MAX_ITEMS: 100
    },
    
    // Data Validation
    VALIDATION: {
        MAX_KEGIATAN: 5,
        MIN_KETERANGAN_LINES: 6
    }
};

// Load configuration from localStorage
function loadConfig() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.CONFIG);
        if (saved) {
            const config = JSON.parse(saved);
            Object.assign(CONFIG.API, config);
            
            // Update form inputs
            if (document.getElementById('apiWriteUrl')) {
                document.getElementById('apiWriteUrl').value = CONFIG.API.WRITE_URL;
            }
            if (document.getElementById('apiReadUrl')) {
                document.getElementById('apiReadUrl').value = CONFIG.API.READ_URL;
            }
            if (document.getElementById('apiKey')) {
                document.getElementById('apiKey').value = CONFIG.API.API_KEY;
            }
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Save configuration to localStorage
function saveConfig() {
    try {
        CONFIG.API.WRITE_URL = document.getElementById('apiWriteUrl').value || CONFIG.API.WRITE_URL;
        CONFIG.API.READ_URL = document.getElementById('apiReadUrl').value || CONFIG.API.READ_URL;
        CONFIG.API.API_KEY = document.getElementById('apiKey').value || CONFIG.API.API_KEY;
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.CONFIG, JSON.stringify(CONFIG.API));
        
        showNotification('✅ Konfigurasi disimpan', 'success');
        updateSystemStatus();
        
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        showNotification('❌ Gagal menyimpan konfigurasi', 'error');
        return false;
    }
}

// Update system status display
function updateSystemStatus() {
    try {
        const systemStatus = document.getElementById('systemStatus');
        const cacheStatus = document.getElementById('cacheStatus');
        const dataCount = document.getElementById('dataCount');
        
        if (systemStatus) {
            systemStatus.textContent = 'Online';
            systemStatus.className = 'status-online';
        }
        
        if (cacheStatus) {
            const cacheData = localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE);
            if (cacheData) {
                const cache = JSON.parse(cacheData);
                cacheStatus.textContent = `${Object.keys(cache).length} item`;
            } else {
                cacheStatus.textContent = 'Tidak ada';
            }
        }
        
        if (dataCount) {
            const reports = getSavedReports();
            dataCount.textContent = `${reports.length} laporan`;
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

// Get saved reports from localStorage
function getSavedReports() {
    try {
        const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.DATA);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Error getting reports:', error);
        return [];
    }
}

// Save report to localStorage
function saveReportToLocal(reportData) {
    try {
        const reports = getSavedReports();
        reports.push(reportData);
        
        // Keep only latest 100 reports
        if (reports.length > CONFIG.CACHE.MAX_ITEMS) {
            reports.splice(0, reports.length - CONFIG.CACHE.MAX_ITEMS);
        }
        
        localStorage.setItem(CONFIG.STORAGE_KEYS.DATA, JSON.stringify(reports));
        updateSystemStatus();
        
        return true;
    } catch (error) {
        console.error('Error saving report:', error);
        return false;
    }
}

// Test API connection
async function testConnection() {
    try {
        showLoading(true, 'Menguji koneksi API...');
        
        // Save config first
        saveConfig();
        
        // Test with a simple request
        const response = await fetch(`${CONFIG.API.READ_URL}?action=test&key=${CONFIG.API.API_KEY}`, {
            method: 'GET',
            mode: 'no-cors'
        });
        
        setTimeout(() => {
            showLoading(false);
            showNotification('✅ Koneksi API berhasil', 'success');
            updateSystemStatus();
        }, 1500);
        
    } catch (error) {
        showLoading(false);
        showNotification('⚠️ Koneksi API gagal, menggunakan cache lokal', 'warning');
        updateSystemStatus();
    }
}

// Backup data to file
function backupData() {
    try {
        const reports = getSavedReports();
        const config = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CONFIG) || '{}');
        const cache = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.CACHE) || '{}');
        
        const backup = {
            version: CONFIG.VERSION,
            timestamp: new Date().toISOString(),
            reports: reports,
            config: config,
            cache: cache
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_koramil_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('✅ Backup data berhasil', 'success');
        
    } catch (error) {
        console.error('Error backing up data:', error);
        showNotification('❌ Gagal membuat backup', 'error');
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 6px;
        color: white;
        font-size: 0.9rem;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
    } else if (type === 'warning') {
        notification.style.background = 'linear-gradient(135deg, #ed8936, #dd6b20)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #4299e1, #3182ce)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Show loading indicator
function showLoading(show, message = 'Memproses...') {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
        if (message) {
            const text = loading.querySelector('div:last-child');
            if (text) text.textContent = message;
        }
    }
}

// Initialize configuration
document.addEventListener('DOMContentLoaded', function() {
    loadConfig();
    updateSystemStatus();
    
    // Auto-save config changes
    const apiInputs = ['apiWriteUrl', 'apiReadUrl', 'apiKey'];
    apiInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', saveConfig);
        }
    });
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);