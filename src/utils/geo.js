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
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    // Use watchPosition for better accuracy and multiple readings
    let bestPosition = null;
    let positions = [];
    const maxReadings = 5; // Collect up to 5 readings and use the most accurate
    let timeoutId;

    const handlePosition = (position) => {
      positions.push(position);
      
      // Use position with best (lowest) accuracy
      if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
        bestPosition = position;
      }

      // If we have enough readings or got a very accurate one, resolve
      if (positions.length >= maxReadings || bestPosition.coords.accuracy < 20) {
        clearTimeout(timeoutId);
        watchId && navigator.geolocation.clearWatch(watchId);
        resolve({
          lat: bestPosition.coords.latitude,
          lng: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
        });
      }
    };

    const handleError = (error) => {
      clearTimeout(timeoutId);
      watchId && navigator.geolocation.clearWatch(watchId);
      
      // If we got at least one reading, use it despite error
      if (bestPosition) {
        resolve({
          lat: bestPosition.coords.latitude,
          lng: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
        });
      } else {
        reject(error);
      }
    };

    let watchId = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    });

    // Timeout after 6 seconds
    timeoutId = setTimeout(() => {
      navigator.geolocation.clearWatch(watchId);
      if (bestPosition) {
        resolve({
          lat: bestPosition.coords.latitude,
          lng: bestPosition.coords.longitude,
          accuracy: bestPosition.coords.accuracy,
        });
      } else {
        reject(new Error('Timeout getting current location'));
      }
    }, 6000);
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
