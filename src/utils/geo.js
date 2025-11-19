/**
 * Geolocation utilities for distance calculation and location services
 */

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Get user's current location
 * @returns {Promise<{lat: number, lng: number, accuracy: number}>} Current coordinates with accuracy
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      const error = 'Geolocation is not supported by this browser';
      console.error('[GEO]', error);
      reject(new Error(error));
      return;
    }

    console.log('[GEO] Starting location acquisition...');

    // Try getCurrentPosition first for faster response on mobile
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[GEO] getCurrentPosition success:', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        console.error('[GEO] getCurrentPosition error:', error.code, error.message);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds for mobile
        maximumAge: 0,
      }
    );
  });
}

/**
 * Sort facilities by distance from a location
 * @param {Array} facilities - Array of facility objects
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @returns {Array} Sorted facilities with distance property
 */
export function sortByDistance(facilities, lat, lng) {
  return facilities
    .map((facility) => ({
      ...facility,
      distance: calculateDistance(lat, lng, facility.lat, facility.lng),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Filter facilities within a certain radius
 * @param {Array} facilities - Array of facility objects
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radius - Radius in kilometers
 * @returns {Array} Filtered facilities
 */
export function filterByRadius(facilities, lat, lng, radius) {
  return facilities.filter((facility) => {
    const distance = calculateDistance(lat, lng, facility.lat, facility.lng);
    return distance <= radius;
  });
}

/**
 * Get bounds for a set of facilities
 * @param {Array} facilities - Array of facility objects
 * @returns {Object|null} Bounds object with north, south, east, west
 */
export function getBounds(facilities) {
  if (!facilities || facilities.length === 0) return null;

  const lats = facilities.map(f => f.lat);
  const lngs = facilities.map(f => f.lng);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs),
  };
}

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export function formatDistance(distance) {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}
