/**
 * API utilities for fetching facility data
 */

let cachedFacilities = null;

/**
 * Fetch all facilities from the data file
 * @returns {Promise<Array>} Array of facility objects
 */
export async function fetchFacilities() {
  if (cachedFacilities) {
    return cachedFacilities;
  }

  try {
    const response = await fetch(import.meta.env.BASE_URL + 'data/facilities.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    cachedFacilities = data.facilities;
    return cachedFacilities;
  } catch (error) {
    console.error('Failed to fetch facilities:', error);
    return [];
  }
}

/**
 * Get a single facility by ID
 * @param {string} id - Facility ID
 * @returns {Promise<Object|null>} Facility object or null
 */
export async function getFacilityById(id) {
  const facilities = await fetchFacilities();
  return facilities.find(f => f.id === id) || null;
}

/**
 * Get a single facility by slug
 * @param {string} slug - Facility slug
 * @returns {Promise<Object|null>} Facility object or null
 */
export async function getFacilityBySlug(slug) {
  const facilities = await fetchFacilities();
  return facilities.find(f => f.slug === slug) || null;
}

/**
 * Search facilities by keyword
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} Filtered facilities
 */
export async function searchFacilities(keyword) {
  const facilities = await fetchFacilities();
  if (!keyword) return facilities;

  const lowerKeyword = keyword.toLowerCase();
  return facilities.filter(f =>
    f.name.toLowerCase().includes(lowerKeyword) ||
    f.prefecture.toLowerCase().includes(lowerKeyword) ||
    f.city.toLowerCase().includes(lowerKeyword) ||
    f.address.toLowerCase().includes(lowerKeyword) ||
    f.description.toLowerCase().includes(lowerKeyword)
  );
}

/**
 * Filter facilities by prefecture
 * @param {string} prefecture - Prefecture name
 * @returns {Promise<Array>} Filtered facilities
 */
export async function filterByPrefecture(prefecture) {
  const facilities = await fetchFacilities();
  if (!prefecture) return facilities;
  return facilities.filter(f => f.prefecture === prefecture);
}

/**
 * Filter facilities by tags
 * @param {Array<string>} tags - Array of tag names
 * @returns {Promise<Array>} Filtered facilities
 */
export async function filterByTags(tags) {
  const facilities = await fetchFacilities();
  if (!tags || tags.length === 0) return facilities;

  return facilities.filter(f =>
    tags.some(tag => f.tags.includes(tag))
  );
}

/**
 * Get unique prefectures from all facilities
 * @returns {Promise<Array<string>>} Array of prefecture names
 */
export async function getUniquePrefectures() {
  const facilities = await fetchFacilities();
  const prefectures = [...new Set(facilities.map(f => f.prefecture))];
  return prefectures.sort();
}

/**
 * Get unique tags from all facilities
 * @returns {Promise<Array<string>>} Array of tag names
 */
export async function getUniqueTags() {
  const facilities = await fetchFacilities();
  const tags = [...new Set(facilities.flatMap(f => f.tags))];
  return tags.sort();
}

/**
 * Clear the facilities cache
 */
export function clearCache() {
  cachedFacilities = null;
}
