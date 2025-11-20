// Local Storage utilities for Sogolo Platform
class Storage {
    // Set item in localStorage with expiration
    static setItem(key, value, expirationHours = null) {
        try {
            const item = {
                value: value,
                timestamp: Date.now(),
                expiration: expirationHours ? Date.now() + (expirationHours * 60 * 60 * 1000) : null
            };
            
            localStorage.setItem(this.getKey(key), JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Error setting localStorage item:', error);
            return false;
        }
    }

    // Get item from localStorage
    static getItem(key) {
        try {
            const itemStr = localStorage.getItem(this.getKey(key));
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            
            // Check if item has expired
            if (item.expiration && Date.now() > item.expiration) {
                this.removeItem(key);
                return null;
            }

            return item.value;
        } catch (error) {
            console.error('Error getting localStorage item:', error);
            return null;
        }
    }

    // Remove item from localStorage
    static removeItem(key) {
        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Error removing localStorage item:', error);
            return false;
        }
    }

    // Clear all Sogolo-related items
    static clear() {
        try {
            const keys = Object.keys(localStorage);
            const sogoloKeys = keys.filter(key => key.startsWith('sogolo_'));
            
            sogoloKeys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    // Check if item exists and is not expired
    static hasItem(key) {
        return this.getItem(key) !== null;
    }

    // Get prefixed key
    static getKey(key) {
        return `sogolo_${key}`;
    }

    // Session storage methods
    static setSessionItem(key, value) {
        try {
            sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error setting sessionStorage item:', error);
            return false;
        }
    }

    static getSessionItem(key) {
        try {
            const itemStr = sessionStorage.getItem(this.getKey(key));
            return itemStr ? JSON.parse(itemStr) : null;
        } catch (error) {
            console.error('Error getting sessionStorage item:', error);
            return null;
        }
    }

    static removeSessionItem(key) {
        try {
            sessionStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Error removing sessionStorage item:', error);
            return false;
        }
    }

    // User preferences
    static setUserPreference(key, value) {
        const preferences = this.getUserPreferences();
        preferences[key] = value;
        return this.setItem('user_preferences', preferences);
    }

    static getUserPreference(key, defaultValue = null) {
        const preferences = this.getUserPreferences();
        return preferences[key] !== undefined ? preferences[key] : defaultValue;
    }

    static getUserPreferences() {
        return this.getItem('user_preferences') || {};
    }

    // Cache management
    static setCache(key, data, expirationMinutes = 30) {
        return this.setItem(`cache_${key}`, data, expirationMinutes / 60);
    }

    static getCache(key) {
        return this.getItem(`cache_${key}`);
    }

    static clearCache() {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter(key => key.startsWith('sogolo_cache_'));
            
            cacheKeys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    // Form data persistence
    static saveFormData(formId, data) {
        return this.setSessionItem(`form_${formId}`, data);
    }

    static getFormData(formId) {
        return this.getSessionItem(`form_${formId}`);
    }

    static clearFormData(formId) {
        return this.removeSessionItem(`form_${formId}`);
    }

    // Recent searches
    static addRecentSearch(searchTerm) {
        const searches = this.getRecentSearches();
        
        // Remove if already exists
        const index = searches.indexOf(searchTerm);
        if (index > -1) {
            searches.splice(index, 1);
        }
        
        // Add to beginning
        searches.unshift(searchTerm);
        
        // Keep only last 10 searches
        const limitedSearches = searches.slice(0, 10);
        
        return this.setItem('recent_searches', limitedSearches);
    }

    static getRecentSearches() {
        return this.getItem('recent_searches') || [];
    }

    static clearRecentSearches() {
        return this.removeItem('recent_searches');
    }

    // Theme and UI preferences
    static setTheme(theme) {
        return this.setUserPreference('theme', theme);
    }

    static getTheme() {
        return this.getUserPreference('theme', 'light');
    }

    static setLanguage(language) {
        return this.setUserPreference('language', language);
    }

    static getLanguage() {
        return this.getUserPreference('language', 'en');
    }

    // Notification preferences
    static setNotificationPreferences(preferences) {
        return this.setUserPreference('notifications', preferences);
    }

    static getNotificationPreferences() {
        return this.getUserPreference('notifications', {
            email: true,
            browser: true,
            transactions: true,
            marketing: false
        });
    }

    // Storage size management
    static getStorageSize() {
        let total = 0;
        
        try {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith('sogolo_')) {
                    total += localStorage[key].length + key.length;
                }
            }
        } catch (error) {
            console.error('Error calculating storage size:', error);
        }
        
        return total;
    }

    static getStorageSizeFormatted() {
        const bytes = this.getStorageSize();
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Check storage availability
    static isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Backup and restore
    static exportData() {
        try {
            const data = {};
            const keys = Object.keys(localStorage);
            const sogoloKeys = keys.filter(key => key.startsWith('sogolo_'));
            
            sogoloKeys.forEach(key => {
                data[key] = localStorage.getItem(key);
            });
            
            return JSON.stringify(data);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    }

    static importData(dataString) {
        try {
            const data = JSON.parse(dataString);
            
            Object.entries(data).forEach(([key, value]) => {
                if (key.startsWith('sogolo_')) {
                    localStorage.setItem(key, value);
                }
            });
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Make available globally
window.Storage = Storage;
