/**
 * FilterPanel component for filtering facilities by prefecture and tags
 */

export class FilterPanel {
  constructor(container, prefectures, tags, onFilter) {
    this.container = container;
    this.prefectures = prefectures;
    this.tags = tags;
    this.onFilter = onFilter;
    this.selectedPrefecture = '';
    this.selectedTags = [];
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="filter-panel">
        <div class="filter-section">
          <label class="filter-label">都道府県</label>
          <select id="prefecture-filter" class="filter-select">
            <option value="">全国</option>
            ${this.prefectures.map(p => `<option value="${p}">${p}</option>`).join('')}
          </select>
        </div>

        <div class="filter-section">
          <label class="filter-label">タグ</label>
          <div id="tag-filters" class="tag-filters">
            ${this.tags.map(tag => `
              <label class="tag-filter-item">
                <input type="checkbox" value="${tag}" class="tag-checkbox" />
                <span class="tag-label">${tag}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="filter-section">
          <label class="filter-label">
            <input type="checkbox" id="favorites-only" class="checkbox" />
            <span>お気に入りのみ表示</span>
          </label>
        </div>

        <div class="filter-actions">
          <button id="clear-filters-btn" class="btn-secondary">クリア</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const prefectureFilter = this.container.querySelector('#prefecture-filter');
    const tagCheckboxes = this.container.querySelectorAll('.tag-checkbox');
    const favoritesOnly = this.container.querySelector('#favorites-only');
    const clearBtn = this.container.querySelector('#clear-filters-btn');

    prefectureFilter.addEventListener('change', (e) => {
      this.selectedPrefecture = e.target.value;
      this.emitFilter();
    });

    tagCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.selectedTags = Array.from(tagCheckboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        this.emitFilter();
      });
    });

    favoritesOnly.addEventListener('change', (e) => {
      this.emitFilter();
    });

    clearBtn.addEventListener('click', () => {
      this.clearFilters();
    });
  }

  emitFilter() {
    const favoritesOnly = this.container.querySelector('#favorites-only').checked;

    if (this.onFilter) {
      this.onFilter({
        prefecture: this.selectedPrefecture,
        tags: this.selectedTags,
        favoritesOnly,
      });
    }
  }

  clearFilters() {
    this.selectedPrefecture = '';
    this.selectedTags = [];

    const prefectureFilter = this.container.querySelector('#prefecture-filter');
    const tagCheckboxes = this.container.querySelectorAll('.tag-checkbox');
    const favoritesOnly = this.container.querySelector('#favorites-only');

    prefectureFilter.value = '';
    tagCheckboxes.forEach(cb => cb.checked = false);
    favoritesOnly.checked = false;

    this.emitFilter();
  }

  updateTags(tags) {
    this.tags = tags;
    this.render();
  }

  updatePrefectures(prefectures) {
    this.prefectures = prefectures;
    this.render();
  }
}
