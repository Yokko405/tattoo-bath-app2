/**
 * Main application entry point
 */

import { SearchBar } from './components/SearchBar.js';
import { FilterPanel } from './components/FilterPanel.js';
import { MapView } from './components/MapView.js';
import { FacilityCard } from './components/FacilityCard.js';
import { FacilityDetail } from './components/FacilityDetail.js';
import { LoginModal } from './components/LoginModal.js';

import {
  fetchFacilities,
  getFacilityById,
  searchFacilities,
  getUniquePrefectures,
  getUniqueTags,
} from './utils/api.js';

import { getFavorites } from './utils/storage.js';
import { getCurrentLocation, sortByDistance } from './utils/geo.js';
import { checkAuthStatus, logout } from './utils/auth.js';

import './styles/main.css';

class TattooBathApp {
  constructor() {
    this.allFacilities = [];
    this.displayedFacilities = [];
    this.currentFilters = {
      keyword: '',
      prefecture: '',
      tags: [],
      favoritesOnly: false,
    };
    this.userLocation = null;

    // Google Maps API Key from environment variable
    this.googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    this.init();
  }

  async init() {
    try {
      // Check authentication if API is configured
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      // デバッグ出力: フロントで読み込まれている API ベースURL
      console.log('[init] VITE_API_BASE_URL =', apiBaseUrl);
      console.log('[init] Current cookies:', document.cookie);

      // API URLが設定されている場合のみ認証チェック
      if (apiBaseUrl && apiBaseUrl.startsWith('http')) {
        console.log('[init] Calling checkAuthStatus()...');
        const isAuthenticated = await checkAuthStatus();
        console.log('[init] checkAuthStatus result =', isAuthenticated);
        console.log('[init] Cookies after checkAuthStatus:', document.cookie);
        if (!isAuthenticated) {
          console.log('[init] Not authenticated, showing login modal');
          this.showLoginModal();
          return;
        }
      }

      // 認証が不要、または認証済みの場合、アプリコンテンツを表示
      const appElement = document.getElementById('app');
      if (appElement) {
        appElement.classList.add('authenticated');
      }

      // ログアウトボタン表示制御
      this.setupLogoutButton();

      // Show loading
      this.showLoading();

      // Fetch data
      this.allFacilities = await fetchFacilities();
      this.displayedFacilities = [...this.allFacilities];

      // Get unique values for filters
      const prefectures = await getUniquePrefectures();
      const tags = await getUniqueTags();

      // Initialize components
      this.initializeComponents(prefectures, tags);

      // Initialize map
      await this.initializeMap();

      // Display initial data
      this.updateDisplay();

      // Hide loading
      this.hideLoading();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showError('アプリケーションの初期化に失敗しました。');
    }
  }

  showLoginModal() {
    const loginContainer = document.getElementById('login-modal-container');
    if (!loginContainer) return;

    // Hide app content until authenticated
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.classList.remove('authenticated');
    }

    this.loginModal = new LoginModal(loginContainer, async () => {
      // Login successful, reload the app
      await this.init();
    });
    this.loginModal.show();
  }

  setupLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;

    // 表示制御: #app に .authenticated があれば表示
    const appElement = document.getElementById('app');
    if (appElement && appElement.classList.contains('authenticated')) {
      logoutBtn.style.display = 'inline-block';
    } else {
      logoutBtn.style.display = 'none';
    }

    // クリックハンドラ
    logoutBtn.onclick = async (e) => {
      e.preventDefault();
      try {
        const result = await logout();
        console.log('logout result', result);
      } catch (err) {
        console.error('Logout failed', err);
      }

      // Hide app and show login modal
      if (appElement) appElement.classList.remove('authenticated');
      this.showLoginModal();
    };
  }

  initializeComponents(prefectures, tags) {
    // Search bar
    const searchContainer = document.getElementById('search-container');
    this.searchBar = new SearchBar(searchContainer, (search) => {
      this.handleSearch(search);
    });

    // Filter panel
    const filterContainer = document.getElementById('filter-container');
    this.filterPanel = new FilterPanel(
      filterContainer,
      prefectures,
      tags,
      (filters) => {
        this.handleFilter(filters);
      }
    );
  }

  async initializeMap() {
    const mapContainer = document.getElementById('map');
    this.mapView = new MapView(
      mapContainer,
      this.googleMapsApiKey,
      (facility) => {
        this.showFacilityDetail(facility);
      }
    );

    try {
      await this.mapView.initialize();
    } catch (error) {
      console.error('Failed to initialize map:', error);
      // Map initialization failed, but app can still work with list view
    }
  }

  async handleSearch(search) {
    if (search.type === 'keyword') {
      this.currentFilters.keyword = search.value;
      this.applyFilters();
    } else if (search.type === 'location') {
      await this.searchNearby();
    }
  }

  handleFilter(filters) {
    this.currentFilters.prefecture = filters.prefecture;
    this.currentFilters.tags = filters.tags;
    this.currentFilters.favoritesOnly = filters.favoritesOnly;
    this.applyFilters();
  }

  async applyFilters() {
    let filtered = [...this.allFacilities];

    // Apply keyword filter
    if (this.currentFilters.keyword) {
      filtered = await searchFacilities(this.currentFilters.keyword);
    }

    // Apply prefecture filter
    if (this.currentFilters.prefecture) {
      filtered = filtered.filter(
        f => f.prefecture === this.currentFilters.prefecture
      );
    }

    // Apply tags filter
    if (this.currentFilters.tags.length > 0) {
      filtered = filtered.filter(f =>
        this.currentFilters.tags.some(tag => f.tags.includes(tag))
      );
    }

    // Apply favorites filter
    if (this.currentFilters.favoritesOnly) {
      const favorites = getFavorites();
      filtered = filtered.filter(f => favorites.includes(f.id));
    }

    this.displayedFacilities = filtered;
    this.updateDisplay();
  }

  async searchNearby() {
    try {
      this.showLoading('現在地を取得中...');
      const location = await getCurrentLocation();
      this.userLocation = location;

      // Sort by distance
      const sorted = sortByDistance(this.allFacilities, location.lat, location.lng);
      this.displayedFacilities = sorted.slice(0, 20); // Show nearest 20

      this.updateDisplay();

      // Center map on user location with accuracy circle
      if (this.mapView) {
        this.mapView.centerOnLocation(location.lat, location.lng, 12, location.accuracy);
      }

      this.hideLoading();
    } catch (error) {
      console.error('Failed to get location:', error);
      this.showError('現在地の取得に失敗しました。位置情報の許可を確認してください。');
      this.hideLoading();
    }
  }

  updateDisplay() {
    // Update facility list
    this.updateFacilityList();

    // Update map
    if (this.mapView) {
      this.mapView.displayFacilities(this.displayedFacilities);
    }

    // Update result count
    this.updateResultCount();
  }

  updateFacilityList() {
    const listContainer = document.getElementById('facility-list');
    listContainer.innerHTML = '';

    if (this.displayedFacilities.length === 0) {
      listContainer.innerHTML = '<p class="no-results">該当する施設が見つかりませんでした。</p>';
      return;
    }

    this.displayedFacilities.forEach(facility => {
      const card = new FacilityCard(
        facility,
        (f) => this.showFacilityDetail(f),
        () => this.applyFilters() // Refresh on favorite toggle
      );
      listContainer.appendChild(card.render());
    });
  }

  updateResultCount() {
    const countElement = document.getElementById('result-count');
    if (countElement) {
      countElement.textContent = `${this.displayedFacilities.length}件の施設`;
    }
  }

  showFacilityDetail(facility) {
    const modalContainer = document.getElementById('modal-container');
    const detail = new FacilityDetail(modalContainer, facility);
    detail.show();
  }

  showLoading(message = '読み込み中...') {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.textContent = message;
      loader.style.display = 'block';
    }
  }

  hideLoading() {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.style.display = 'none';
    }
  }

  showError(message) {
    alert(message);
  }
}

// Global function for map info window
window.showFacilityDetail = async (facilityId) => {
  const facility = await getFacilityById(facilityId);
  if (facility && window.app) {
    window.app.showFacilityDetail(facility);
  }
};

// Service Worker は使用しない（キャッシュが古い状態を保持するため）
// PWA機能が必要になった場合は後で再度有効化
console.log('[init] Service Worker registration disabled');

// Initialize app when DOM is ready
console.log('[init] main.js loaded, setting up DOMContentLoaded listener');

if (document.readyState === 'loading') {
  // DOM is still loading
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[init] DOMContentLoaded fired, initializing app');
    window.app = new TattooBathApp();
  });
} else {
  // DOM is already loaded
  console.log('[init] DOM already loaded, initializing app immediately');
  window.app = new TattooBathApp();
}
