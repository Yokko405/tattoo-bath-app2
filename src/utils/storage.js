/**
 * LocalStorage utilities for managing favorites and user preferences
 */

const FAVORITES_KEY = 'tattoo-bath-favorites';
const PREFERENCES_KEY = 'tattoo-bath-preferences';

/**
 * Get all favorite facility IDs
 * @returns {Array<string>} Array of facility IDs
 */
export function getFavorites() {
  try {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Failed to get favorites:', error);
    return [];
  }
}

/**
 * Add a facility to favorites
 * @param {string} facilityId - Facility ID to add
 * @returns {boolean} Success status
 */
export function addFavorite(facilityId) {
  try {
    const favorites = getFavorites();
    if (!favorites.includes(facilityId)) {
      favorites.push(facilityId);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to add favorite:', error);
    return false;
  }
}

/**
 * Remove a facility from favorites
 * @param {string} facilityId - Facility ID to remove
 * @returns {boolean} Success status
 */
export function removeFavorite(facilityId) {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(id => id !== facilityId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to remove favorite:', error);
    return false;
  }
}

/**
 * Check if a facility is in favorites
 * @param {string} facilityId - Facility ID to check
 * @returns {boolean} Whether the facility is favorited
 */
export function isFavorite(facilityId) {
  const favorites = getFavorites();
  return favorites.includes(facilityId);
}

/**
 * Toggle favorite status of a facility
 * @param {string} facilityId - Facility ID to toggle
 * @returns {boolean} New favorite status
 */
export function toggleFavorite(facilityId) {
  if (isFavorite(facilityId)) {
    removeFavorite(facilityId);
    return false;
  } else {
    addFavorite(facilityId);
    return true;
  }
}

/**
 * Clear all favorites
 * @returns {boolean} Success status
 */
export function clearFavorites() {
  try {
    localStorage.removeItem(FAVORITES_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear favorites:', error);
    return false;
  }
}

/**
 * Get user preferences
 * @returns {Object} User preferences object
 */
export function getPreferences() {
  try {
    const prefs = localStorage.getItem(PREFERENCES_KEY);
    return prefs ? JSON.parse(prefs) : {
      lastLocation: null,
      defaultZoom: 12,
      showFavoritesOnly: false,
    };
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return {
      lastLocation: null,
      defaultZoom: 12,
      showFavoritesOnly: false,
    };
  }
}

/**
 * Save user preferences
 * @param {Object} preferences - Preferences object to save
 * @returns {boolean} Success status
 */
export function savePreferences(preferences) {
  try {
    const current = getPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return false;
  }
}

/**
 * Session token management for authentication
 * iOS Safari ではクロスオリジン Cookie がブロックされるため、
 * セッショントークンをセッションストレージに保存する
 */
const SESSION_TOKEN_KEY = 'tattoo-bath-session-token';

export function setSessionToken(token) {
  try {
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    console.log('[debug][storage] Session token saved');
    return true;
  } catch (error) {
    console.error('Failed to save session token:', error);
    return false;
  }
}

export function getSessionToken() {
  try {
    const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
    console.log('[debug][storage] Retrieved session token:', token ? 'exists' : 'not found');
    return token;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

export function clearSessionToken() {
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    console.log('[debug][storage] Session token cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear session token:', error);
    return false;
  }
}

/**
 * Export favorites to JSON file
 * @returns {string} JSON string containing favorites and metadata
 */
export function exportFavoritesData() {
  try {
    const favorites = getFavorites();
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: favorites.length,
      favorites: favorites,
    };
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export favorites:', error);
    return null;
  }
}

/**
 * Download favorites as JSON file
 * @param {string} filename - Filename for download (default: tattoo-bath-favorites.json)
 */
export function downloadFavorites(filename = 'tattoo-bath-favorites.json') {
  try {
    const data = exportFavoritesData();
    if (!data) return false;

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[storage] Favorites downloaded:', filename);
    return true;
  } catch (error) {
    console.error('Failed to download favorites:', error);
    return false;
  }
}

/**
 * Import favorites from JSON data
 * @param {string} jsonData - JSON string containing favorites data
 * @param {boolean} merge - If true, merge with existing favorites; if false, replace
 * @returns {boolean} Success status
 */
export function importFavoritesData(jsonData, merge = true) {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!Array.isArray(importData.favorites)) {
      throw new Error('Invalid favorites data format');
    }

    let newFavorites = importData.favorites;
    
    if (merge) {
      // Merge with existing favorites
      const existing = getFavorites();
      newFavorites = [...new Set([...existing, ...newFavorites])];
    }

    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
    console.log('[storage] Favorites imported:', newFavorites.length, 'items');
    return true;
  } catch (error) {
    console.error('Failed to import favorites:', error);
    return false;
  }
}

/**
 * Import favorites from file input
 * @param {File} file - File object from input element
 * @param {boolean} merge - If true, merge with existing favorites; if false, replace
 * @returns {Promise<boolean>} Success status
 */
export function importFavoritesFromFile(file, merge = true) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = e.target.result;
        const success = importFavoritesData(jsonData, merge);
        resolve(success);
      } catch (error) {
        console.error('Failed to read file:', error);
        resolve(false);
      }
    };
    
    reader.onerror = () => {
      console.error('File read error');
      resolve(false);
    };
    
    reader.readAsText(file);
  });
}
