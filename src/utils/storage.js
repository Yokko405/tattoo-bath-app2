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
