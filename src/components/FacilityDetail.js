/**
 * FacilityDetail component for displaying detailed facility information in a modal
 */

import { isFavorite, toggleFavorite } from '../utils/storage.js';
import { formatDistance } from '../utils/geo.js';

export class FacilityDetail {
  constructor(container, facility) {
    this.container = container;
    this.facility = facility;
  }

  show() {
    const isFav = isFavorite(this.facility.id);
    const distanceText = this.facility.distance
      ? `<p><strong>距離:</strong> ${formatDistance(this.facility.distance)}</p>`
      : '';

    this.container.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header-top">
            <button class="modal-close" id="modal-close">×</button>
            <button class="favorite-btn ${isFav ? 'active' : ''}" id="detail-favorite-btn">
              ${isFav ? '★' : '☆'}
            </button>
          </div>

          <div class="modal-header">
            <h2>${this.facility.name}</h2>
          </div>

          <div class="modal-body">
            <div class="detail-section">
              <h3>基本情報</h3>
              <p><strong>住所:</strong> <a href="#" id="address-link" class="address-link">${this.facility.address}</a></p>
              <p><strong>都道府県:</strong> ${this.facility.prefecture}</p>
              <p><strong>市区町村:</strong> ${this.facility.city}</p>
              ${distanceText}
            </div>

            <div class="detail-section">
              <h3>タトゥーポリシー</h3>
              <p class="policy-badge">${this.facility.tattooPolicy}</p>
            </div>

            <div class="detail-section">
              <h3>説明</h3>
              <p>${this.facility.description}</p>
            </div>

            <div class="detail-section">
              <h3>施設タイプ</h3>
              <div class="facility-tags">
                ${this.facility.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            </div>

            <div class="detail-section">
              <h3>営業情報</h3>
              <p><strong>営業時間:</strong> ${this.facility.hours}</p>
              <p><strong>料金:</strong> ${this.facility.price}</p>
            </div>

            <div class="detail-section">
              <h3>連絡先</h3>
              ${this.facility.phone ? `<p><strong>電話:</strong> <a href="tel:${this.facility.phone}">${this.facility.phone}</a></p>` : ''}
              ${this.facility.website ? `<p><strong>ウェブサイト:</strong> <a href="${this.facility.website}" target="_blank" rel="noopener noreferrer">公式サイトへ</a></p>` : ''}
            </div>

            <div class="detail-section">
              <p class="last-verified">最終確認日: ${this.facility.lastVerified}</p>
            </div>

            <div class="detail-actions">
              <button id="detail-maps-btn" class="btn-primary">
                Google Mapsで開く
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.style.display = 'block';
    this.attachEventListeners();
  }

  attachEventListeners() {
    const closeBtn = this.container.querySelector('#modal-close');
    const overlay = this.container.querySelector('.modal-overlay');
    const favoriteBtn = this.container.querySelector('#detail-favorite-btn');
    const mapsBtn = this.container.querySelector('#detail-maps-btn');

    closeBtn.addEventListener('click', () => {
      this.close();
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });

    favoriteBtn.addEventListener('click', () => {
      const newStatus = toggleFavorite(this.facility.id);
      favoriteBtn.classList.toggle('active', newStatus);
      favoriteBtn.textContent = newStatus ? '★' : '☆';
    });

    mapsBtn.addEventListener('click', () => {
      // 座標がある場合は座標で直接開く
      if (this.facility.lat && this.facility.lng) {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.facility.lat},${this.facility.lng}`;
        window.open(mapsUrl, '_blank');
      } else {
        // 座標がない場合は検索クエリで検索
        const searchQuery = this.buildMapsSearchQuery();
        const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
        window.open(mapsUrl, '_blank');
      }
    });

    const addressLink = this.container.querySelector('#address-link');
    if (addressLink) {
      addressLink.addEventListener('click', (e) => {
        e.preventDefault();
        // 座標がある場合は座標で直接開く
        if (this.facility.lat && this.facility.lng) {
          const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.facility.lat},${this.facility.lng}`;
          window.open(mapsUrl, '_blank');
        } else {
          // 座標がない場合は検索クエリで検索
          const searchQuery = this.buildMapsSearchQuery();
          const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;
          window.open(mapsUrl, '_blank');
        }
      });
    }

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  close() {
    this.container.style.display = 'none';
    this.container.innerHTML = '';
  }

  buildMapsSearchQuery() {
    // Google Maps用の名前（googleMapsName）がある場合はそれを使用
    const facilityName = this.facility.googleMapsName || this.facility.name;
    
    // 住所がある場合は「住所 施設名」で検索
    if (this.facility.address && this.facility.address.trim()) {
      return `${this.facility.address} ${facilityName}`;
    }
    
    // 住所がない場合は「都道府県 市区町村 施設名」で検索
    const parts = [this.facility.prefecture, this.facility.city, facilityName].filter(p => p && p.trim());
    return parts.join(' ');
  }
}
