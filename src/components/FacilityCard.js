/**
 * FacilityCard component for displaying facility information in a card format
 */

import { isFavorite, toggleFavorite } from '../utils/storage.js';
import { formatDistance } from '../utils/geo.js';

export class FacilityCard {
  constructor(facility, onClick, onFavoriteToggle) {
    this.facility = facility;
    this.onClick = onClick;
    this.onFavoriteToggle = onFavoriteToggle;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'facility-card';
    card.dataset.facilityId = this.facility.id;

    const isFav = isFavorite(this.facility.id);
    const distanceText = this.facility.distance
      ? `<span class="distance">${formatDistance(this.facility.distance)}</span>`
      : '';

    card.innerHTML = `
      <div class="facility-card-header">
        <h3 class="facility-name">${this.facility.name}</h3>
        <button class="favorite-btn ${isFav ? 'active' : ''}" data-id="${this.facility.id}">
          ${isFav ? '★' : '☆'}
        </button>
      </div>

      <div class="facility-info">
        <p class="facility-location">
          ${this.facility.prefecture} ${this.facility.city}
          ${distanceText}
        </p>
        <p class="facility-policy">${this.facility.tattooPolicy}</p>
        <div class="facility-tags">
          ${this.facility.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <p class="facility-description">${this.facility.description}</p>
      </div>

      <div class="facility-meta">
        <span class="facility-hours">${this.facility.hours}</span>
        <span class="facility-price">${this.facility.price}</span>
      </div>
    `;

    // Click event for the card
    card.addEventListener('click', (e) => {
      if (!e.target.classList.contains('favorite-btn')) {
        if (this.onClick) {
          this.onClick(this.facility);
        }
      }
    });

    // Favorite button event
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newStatus = toggleFavorite(this.facility.id);
      favoriteBtn.classList.toggle('active', newStatus);
      favoriteBtn.textContent = newStatus ? '★' : '☆';

      if (this.onFavoriteToggle) {
        this.onFavoriteToggle(this.facility.id, newStatus);
      }
    });

    return card;
  }
}
