/**
 * SearchBar component for searching facilities
 */

export class SearchBar {
  constructor(container, onSearch) {
    this.container = container;
    this.onSearch = onSearch;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="search-bar">
        <input
          type="text"
          id="search-input"
          class="search-input"
          placeholder="施設名、地域、キーワードで検索..."
          autocomplete="off"
        />
        <button id="search-btn" class="search-btn">検索</button>
        <button id="current-location-btn" class="location-btn" title="現在地から探す">
          <span class="location-icon">📍</span>
        </button>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const input = this.container.querySelector('#search-input');
    const searchBtn = this.container.querySelector('#search-btn');
    const locationBtn = this.container.querySelector('#current-location-btn');

    searchBtn.addEventListener('click', () => {
      this.handleSearch(input.value);
    });

    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch(input.value);
      }
    });

    locationBtn.addEventListener('click', () => {
      this.handleLocationSearch();
    });

    // Real-time search (with debounce)
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleSearch(e.target.value);
      }, 300);
    });
  }

  handleSearch(keyword) {
    if (this.onSearch) {
      this.onSearch({ type: 'keyword', value: keyword });
    }
  }

  handleLocationSearch() {
    if (this.onSearch) {
      this.onSearch({ type: 'location' });
    }
  }

  setValue(value) {
    const input = this.container.querySelector('#search-input');
    if (input) {
      input.value = value;
    }
  }

  clear() {
    this.setValue('');
  }
}
