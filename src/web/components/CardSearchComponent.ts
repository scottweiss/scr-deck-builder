/**
 * Card Search Component
 * Handles card searching and filtering functionality
 */

import type { Card } from '../../types/Card';

export class CardSearchComponent extends HTMLElement {
  private searchResults: Card[] = [];
  private currentQuery = '';

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  displayResults(cards: Card[], query: string) {
    this.searchResults = cards;
    this.currentQuery = query;
    this.render();
  }

  private render() {
    this.innerHTML = `
      <div class="card">
        <h2>🔍 Search Results</h2>
        ${this.currentQuery ? `
          <p>Search results for: <strong>"${this.currentQuery}"</strong></p>
          <p>Found <span class="text-success">${this.searchResults.length}</span> cards</p>
        ` : ''}
        
        <div class="search-filters" style="margin: var(--spacing-md) 0;">
          <div class="grid grid-3">
            <div class="form-group">
              <label class="form-label">Filter by Type</label>
              <select class="form-control" id="type-filter">
                <option value="">All Types</option>
                <option value="Avatar">Avatar</option>
                <option value="Site">Site</option>
                <option value="Minion">Minion</option>
                <option value="Magic">Magic</option>
                <option value="Artifact">Artifact</option>
                <option value="Aura">Aura</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Filter by Element</label>
              <select class="form-control" id="element-filter">
                <option value="">All Elements</option>
                <option value="Fire">Fire</option>
                <option value="Water">Water</option>
                <option value="Earth">Earth</option>
                <option value="Air">Air</option>
                <option value="Void">Void</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Filter by Mana Cost</label>
              <select class="form-control" id="cost-filter">
                <option value="">Any Cost</option>
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>
          </div>
        </div>

        <div id="search-results-container">
          ${this.renderSearchResults()}
        </div>
      </div>
    `;

    this.setupFilterListeners();
  }

  private setupFilterListeners() {
    const typeFilter = this.querySelector('#type-filter') as HTMLSelectElement;
    const elementFilter = this.querySelector('#element-filter') as HTMLSelectElement;
    const costFilter = this.querySelector('#cost-filter') as HTMLSelectElement;

    const updateResults = () => {
      const container = this.querySelector('#search-results-container');
      if (container) {
        container.innerHTML = this.renderSearchResults();
      }
    };

    typeFilter?.addEventListener('change', updateResults);
    elementFilter?.addEventListener('change', updateResults);
    costFilter?.addEventListener('change', updateResults);
  }

  private getFilteredResults(): Card[] {
    const typeFilter = (this.querySelector('#type-filter') as HTMLSelectElement)?.value;
    const elementFilter = (this.querySelector('#element-filter') as HTMLSelectElement)?.value;
    const costFilter = (this.querySelector('#cost-filter') as HTMLSelectElement)?.value;

    return this.searchResults.filter(card => {
      // Type filter
      if (typeFilter && card.type !== typeFilter) return false;

      // Element filter
      if (elementFilter && (!card.elements || !card.elements.includes(elementFilter as any))) return false;

      // Cost filter
      if (costFilter) {
        const cost = card.mana_cost || 0;
        if (costFilter === '5' && cost < 5) return false;
        if (costFilter !== '5' && cost !== parseInt(costFilter)) return false;
      }

      return true;
    });
  }

  private renderSearchResults(): string {
    if (this.searchResults.length === 0) {
      return '<p class="text-center" style="margin: var(--spacing-xl) 0;">No cards found. Try a different search term.</p>';
    }

    const filteredResults = this.getFilteredResults();

    if (filteredResults.length === 0) {
      return '<p class="text-center" style="margin: var(--spacing-xl) 0;">No cards match the current filters.</p>';
    }

    // Group cards by type
    const groupedCards = this.groupCardsByType(filteredResults);

    return Object.entries(groupedCards)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([type, cards]) => `
        <div class="card-group" style="margin-bottom: var(--spacing-lg);">
          <h3 style="color: var(--color-secondary); margin-bottom: var(--spacing-md);">
            ${type} (${cards.length})
          </h3>
          <div class="grid grid-2">
            ${cards.map(card => this.renderSearchCard(card)).join('')}
          </div>
        </div>
      `).join('');
  }

  private groupCardsByType(cards: Card[]): Record<string, Card[]> {
    return cards.reduce((groups, card) => {
      const type = card.type || 'Unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(card);
      return groups;
    }, {} as Record<string, Card[]>);
  }

  private renderSearchCard(card: Card): string {
    return `
      <div class="search-card-item" style="background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-sm); margin-bottom: var(--spacing-sm); border: 1px solid rgba(255,255,255,0.1);">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-xs);">
          <strong class="card-name" style="color: var(--color-primary); flex: 1;">${card.name}</strong>
          ${card.mana_cost !== undefined ? `
            <span class="mana-cost" style="background: var(--color-bg-primary); padding: 2px 8px; border-radius: var(--radius-sm); font-size: 0.9em; font-weight: bold;">
              ${card.mana_cost}
            </span>
          ` : ''}
        </div>
        
        <div class="card-info" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xs);">
          <span class="card-type" style="color: var(--color-text-muted); font-size: 0.9em;">
            ${card.type}${card.subtype ? ` - ${card.subtype}` : ''}
          </span>
          ${card.rarity ? `
            <span class="card-rarity" style="font-size: 0.8em; background: var(--color-bg-secondary); padding: 2px 6px; border-radius: 3px;">
              ${card.rarity}
            </span>
          ` : ''}
        </div>

        ${card.elements && card.elements.length > 0 ? `
          <div class="card-elements" style="margin-bottom: var(--spacing-xs);">
            ${card.elements.map(element => `
              <span class="element-badge element-${element.toLowerCase()}" title="${element}"></span>
            `).join('')}
            <span style="font-size: 0.9em; color: var(--color-text-muted);">
              ${card.elements.join(', ')}
            </span>
          </div>
        ` : ''}

        ${this.renderCardStats(card)}

        ${card.text ? `
          <div class="card-text" style="font-size: 0.9em; color: var(--color-text-secondary); margin-top: var(--spacing-sm); padding-top: var(--spacing-sm); border-top: 1px solid rgba(255,255,255,0.1);">
            ${this.highlightSearchTerm(card.text, this.currentQuery)}
          </div>
        ` : ''}

        ${card.threshold ? `
          <div class="card-threshold" style="font-size: 0.8em; color: var(--color-text-muted); margin-top: var(--spacing-xs);">
            <strong>Threshold:</strong> ${card.threshold}
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderCardStats(card: Card): string {
    const stats = [];
    
    if (card.power !== undefined && card.power > 0) {
      stats.push(`<strong>Power:</strong> ${card.power}`);
    }
    
    if (card.life !== undefined && card.life > 0) {
      stats.push(`<strong>Life:</strong> ${card.life}`);
    }
    
    if (card.defense !== undefined && card.defense > 0) {
      stats.push(`<strong>Defense:</strong> ${card.defense}`);
    }

    if (stats.length === 0) return '';

    return `
      <div class="card-stats" style="font-size: 0.9em; color: var(--color-text-secondary); margin: var(--spacing-xs) 0;">
        ${stats.join(' | ')}
      </div>
    `;
  }

  private highlightSearchTerm(text: string, searchTerm: string): string {
    if (!searchTerm || searchTerm.length < 2) return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--color-primary); color: var(--color-bg-primary); padding: 1px 2px; border-radius: 2px;">$1</mark>');
  }
}
