/**
 * Script to update facilities data
 * This can be run manually or automated via GitHub Actions
 */

import fs from 'fs';
import path from 'path';

const FACILITIES_FILE = path.join(process.cwd(), 'public/data/facilities.json');

/**
 * Update facilities data
 */
function updateFacilities() {
  try {
    // Read existing data
    const data = JSON.parse(fs.readFileSync(FACILITIES_FILE, 'utf-8'));

    // Update version
    data.version = new Date().toISOString().split('T')[0];

    // Validate facilities
    data.facilities.forEach((facility, index) => {
      if (!facility.id || !facility.name || !facility.lat || !facility.lng) {
        console.error(`Facility at index ${index} is missing required fields`);
      }
    });

    // Write back
    fs.writeFileSync(FACILITIES_FILE, JSON.stringify(data, null, 2));

    console.log(`Updated facilities data. Version: ${data.version}`);
    console.log(`Total facilities: ${data.facilities.length}`);
  } catch (error) {
    console.error('Failed to update facilities:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateFacilities();
}

export { updateFacilities };
