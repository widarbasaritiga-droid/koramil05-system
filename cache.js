// SISTEM CACHE TERINTEGRASI
class CacheSystem {
    constructor() {
        this.prefix = 'koramil_cache_';
        this.defaultExpiry = 24 * 60 * 60 * 1000; // 24 jam
        this.init();
    }
    
    init() {
        this.cleanExpired();
    }
    
    // Generate cache key
    generateKey(type, id) {
        return `${this.prefix}${type}_${id}`;
    }
    
    // Set cache with expiry
    set(type, id, data, expiry = this.defaultExpiry) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now(),
                expiry: Date.now() + expiry,
                type: type
            };
            
            const key = this.generateKey(type, id);
            localStorage.setItem(key, JSON.stringify(cacheItem));
            
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }
    
    // Get cache if not expired
    get(type, id) {
        try {
            const key = this.generateKey(type, id);
            const item = localStorage.getItem(key);
            
            if (!item) return null;
            
            const cacheItem = JSON.parse(item);
            
            // Check if expired
            if (Date.now() > cacheItem.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            
            return cacheItem.data;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }
    
    // Remove specific cache
    remove(type, id) {
        try {
            const key = this.generateKey(type, id);
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Cache remove error:', error);
            return false;
        }
    }
    
    // Get all caches of type
    getAll(type) {
        try {
            const items = [];
            const keys = Object.keys(localStorage);
            
            for (const key of keys) {
                if (key.startsWith(`${this.prefix}${type}_`)) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const cacheItem = JSON.parse(item);
                        if (Date.now() <= cacheItem.expiry) {
                            items.push(cacheItem.data);
                        } else {
                            localStorage.removeItem(key);
                        }
                    }
                }
            }
            
            return items;
        } catch (error) {
            console.error('Cache getAll error:', error);
            return [];
        }
    }
    
    // Clean expired caches
    cleanExpired() {
        try {
            const keys = Object.keys(localStorage);
            let cleaned = 0;
            
            for (const key of keys) {
                if (key.startsWith(this.prefix)) {
                    const item = localStorage.getItem(key);
                    if (item) {
                        try {
                            const cacheItem = JSON.parse(item);
                            if (Date.now() > cacheItem.expiry) {
                                localStorage.removeItem(key);
                                cleaned++;
                            }
                        } catch (e) {
                            localStorage.removeItem(key);
                            cleaned++;
                        }
                    }
                }
            }
            
            return cleaned;
        } catch (error) {
            console.error('Cache clean error:', error);
            return 0;
        }
    }
    
    // Clear all caches
    clearAll() {
        try {
            const keys = Object.keys(localStorage);
            let cleared = 0;
            
            for (const key of keys) {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
            
            return cleared;
        } catch (error) {
            console.error('Cache clearAll error:', error);
            return 0;
        }
    }
    
    // Get cache statistics
    getStats() {
        try {
            const stats = {
                total: 0,
                byType: {},
                expired: 0
            };
            
            const keys = Object.keys(localStorage);
            const now = Date.now();
            
            for (const key of keys) {
                if (key.startsWith(this.prefix)) {
                    stats.total++;
                    
                    // Extract type
                    const type = key.replace(this.prefix, '').split('_')[0];
                    stats.byType[type] = (stats.byType[type] || 0) + 1;
                    
                    // Check if expired
                    const item = localStorage.getItem(key);
                    if (item) {
                        try {
                            const cacheItem = JSON.parse(item);
                            if (now > cacheItem.expiry) {
                                stats.expired++;
                            }
                        } catch (e) {
                            // Invalid JSON, count as expired
                            stats.expired++;
                        }
                    }
                }
            }
            
            return stats;
        } catch (error) {
            console.error('Cache stats error:', error);
            return { total: 0, byType: {}, expired: 0 };
        }
    }
}

// Initialize global cache instance
const cache = new CacheSystem();

// Cache functions for specific data types
const CacheManager = {
    // Laporan cache
    saveLaporan: function(laporanData) {
        const id = laporanData.id || `laporan_${Date.now()}`;
        return cache.set('laporan', id, laporanData);
    },
    
    getLaporan: function(id) {
        return cache.get('laporan', id);
    },
    
    getAllLaporan: function() {
        return cache.getAll('laporan');
    },
    
    // Report template cache
    saveTemplate: function(templateName, templateData) {
        return cache.set('template', templateName, templateData);
    },
    
    getTemplate: function(templateName) {
        return cache.get('template', templateName);
    },
    
    // Settings cache
    saveSettings: function(settings) {
        return cache.set('settings', 'app_settings', settings);
    },
    
    getSettings: function() {
        return cache.get('settings', 'app_settings');
    },
    
    // Backup current state
    backupState: function() {
        try {
            const state = {
                laporan: cache.getAll('laporan'),
                templates: cache.getAll('template'),
                settings: cache.getSettings(),
                timestamp: new Date().toISOString()
            };
            
            const backupKey = `backup_${new Date().toISOString().split('T')[0]}`;
            localStorage.setItem(backupKey, JSON.stringify(state));
            
            return backupKey;
        } catch (error) {
            console.error('Backup error:', error);
            return null;
        }
    },
    
    // Restore from backup
    restoreState: function(backupKey) {
        try {
            const backup = localStorage.getItem(backupKey);
            if (!backup) return false;
            
            const state = JSON.parse(backup);
            
            // Restore laporan
            if (state.laporan && Array.isArray(state.laporan)) {
                state.laporan.forEach(laporan => {
                    cache.set('laporan', laporan.id || `restored_${Date.now()}`, laporan);
                });
            }
            
            // Restore templates
            if (state.templates && Array.isArray(state.templates)) {
                state.templates.forEach(template => {
                    if (template.name) {
                        cache.set('template', template.name, template);
                    }
                });
            }
            
            // Restore settings
            if (state.settings) {
                cache.set('settings', 'app_settings', state.settings);
            }
            
            return true;
        } catch (error) {
            console.error('Restore error:', error);
            return false;
        }
    },
    
    // Export cache to file
    exportCache: function() {
        try {
            const exportData = {};
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith(cache.prefix)) {
                    exportData[key] = localStorage.getItem(key);
                }
            });
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `koramil_cache_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Export error:', error);
            return false;
        }
    },
    
    // Import cache from file
    importCache: function(jsonData) {
        try {
            const importData = JSON.parse(jsonData);
            
            Object.keys(importData).forEach(key => {
                localStorage.setItem(key, importData[key]);
            });
            
            return true;
        } catch (error) {
            console.error('Import error:', error);
            return false;
        }
    }
};

// Auto-clean cache every hour
setInterval(() => {
    const cleaned = cache.cleanExpired();
    if (cleaned > 0) {
        console.log(`Auto-cleaned ${cleaned} expired cache items`);
    }
}, 60 * 60 * 1000);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { cache, CacheManager };
}