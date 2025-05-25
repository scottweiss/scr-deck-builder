/**
 * Deck Display Component
 * Shows the built deck with detailed breakdown
 */

import type { DeckResult } from '../../browser/unified-deck-builder';
import type { Card } from '../../types/Card';

export class DeckDisplayComponent extends HTMLElement {
  private currentDeck: DeckResult | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.render();
  }

  displayDeck(deck: DeckResult) {
    this.currentDeck = deck;
    this.render();
  }

  private render() {
    if (!this.currentDeck) {
      this.innerHTML = '<div class="card">No deck to display</div>';
      return;
    }

    const deck = this.currentDeck;

    this.innerHTML = `
      <div class="fade-in">
        <!-- Deck Overview -->
        <div class="card">
          <h2>🎯 Deck Overview</h2>
          <div class="grid grid-3">
            <div class="stat-item">
              <strong>Total Cards:</strong> ${deck.stats.totalCards}
            </div>
            <div class="stat-item">
              <strong>Synergy Score:</strong> <span class="text-success">${deck.synergy.toFixed(2)}</span>
            </div>
            <div class="stat-item">
              <strong>Avg Mana Cost:</strong> ${deck.stats.averageManaCost.toFixed(1)}
            </div>
            <div class="stat-item">
              <strong>Spells:</strong> ${deck.stats.spellsCount}
            </div>
            <div class="stat-item">
              <strong>Sites:</strong> ${deck.stats.sitesCount}
            </div>
            <div class="stat-item">
              <strong>Validation:</strong> <span class="text-${deck.validation?.isValid ? 'success' : 'warning'}">
                ${deck.validation?.isValid ? '✅ Valid' : '⚠️ Issues'}
              </span>
            </div>
          </div>
        </div>

        <!-- Avatar -->
        <div class="card">
          <h2>👑 Avatar</h2>
          ${this.renderCard(deck.avatar)}
        </div>

        <!-- Element Distribution -->
        <div class="card">
          <h2>🌟 Element Distribution</h2>
          <div class="element-distribution">
            ${this.renderElementDistribution(deck.stats.elementDistribution)}
          </div>
        </div>

        <!-- Mana Curve -->
        <div class="card">
          <h2>📊 Mana Curve</h2>
          <div class="mana-curve">
            ${this.renderManaCurve(deck.stats.manaCurve)}
          </div>
        </div>

        <!-- Sample Spells -->
        <div class="card">
          <h2>⚡ Sample Spells (${Math.min(10, deck.spells.length)})</h2>
          <div class="grid grid-2">
            ${deck.spells.slice(0, 10).map(spell => this.renderCard(spell)).join('')}
          </div>
        </div>

        <!-- Sample Sites -->
        <div class="card">
          <h2>🏰 Sample Sites (${Math.min(10, deck.sites.length)})</h2>
          <div class="grid grid-2">
            ${deck.sites.slice(0, 10).map(site => this.renderCard(site)).join('')}
          </div>
        </div>

        <!-- Combo Information -->
        ${deck.combos && deck.combos.length > 0 ? `
          <div class="card">
            <h2>🎯 Detected Combos</h2>
            <div class="combo-list">
              ${deck.combos.map(combo => this.renderCombo(combo)).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Export Options -->
        <div class="card">
          <h2>📤 Export Options</h2>
          <div style="display: flex; gap: var(--spacing-md); flex-wrap: wrap;">
            <button class="btn" onclick="this.closest('deck-display').exportAsText()">
              📄 Export as Text
            </button>
            <button class="btn" onclick="this.closest('deck-display').exportAsJSON()">
              🗂️ Export as JSON
            </button>
            <button class="btn" onclick="this.closest('deck-display').copyDeckList()">
              📋 Copy Deck List
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderCard(card: Card): string {
    if (!card) return '<div class="card-item">No card data</div>';

    return `
      <div class="card-item" style="background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-sm); margin-bottom: var(--spacing-sm);">
        <div class="card-header">
          <strong class="card-name" style="color: var(--color-primary);">${card.name}</strong>
          ${card.mana_cost !== undefined ? `<span class="mana-cost" style="float: right; background: var(--color-bg-primary); padding: 2px 6px; border-radius: 3px;">${card.mana_cost}</span>` : ''}
        </div>
        <div class="card-type" style="color: var(--color-text-muted); font-size: 0.9em;">
          ${card.type} ${card.subtype ? `- ${card.subtype}` : ''}
        </div>
        ${card.elements && card.elements.length > 0 ? `
          <div class="card-elements" style="margin: var(--spacing-xs) 0;">
            ${card.elements.map(element => `<span class="element-badge element-${element.toLowerCase()}" title="${element}"></span>`).join('')}
          </div>
        ` : ''}
        ${card.power !== undefined && card.power > 0 ? `
          <div class="card-stats" style="font-size: 0.9em;">
            <strong>Power:</strong> ${card.power}
            ${card.life !== undefined ? ` | <strong>Life:</strong> ${card.life}` : ''}
            ${card.defense !== undefined ? ` | <strong>Defense:</strong> ${card.defense}` : ''}
          </div>
        ` : ''}
        ${card.text ? `
          <div class="card-text" style="font-size: 0.9em; margin-top: var(--spacing-xs); color: var(--color-text-secondary);">
            ${card.text}
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

  private renderElementDistribution(distribution: Record<string, number>): string {
    if (!distribution || Object.keys(distribution).length === 0) {
      return '<p>No element distribution data</p>';
    }

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .map(([element, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        return `
          <div class="element-stat" style="display: flex; align-items: center; margin-bottom: var(--spacing-xs);">
            <span class="element-badge element-${element.toLowerCase()}" title="${element}"></span>
            <span style="margin-right: var(--spacing-sm);">${element}:</span>
            <span style="font-weight: bold;">${count} (${percentage}%)</span>
          </div>
        `;
      }).join('');
  }

  private renderManaCurve(curve: Record<number, number>): string {
    if (!curve || Object.keys(curve).length === 0) {
      return '<p>No mana curve data</p>';
    }

    const maxCount = Math.max(...Object.values(curve));
    
    return Object.entries(curve)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([cost, count]) => {
        const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
        return `
          <div class="mana-cost-bar" style="display: inline-block; margin: 0 2px; text-align: center; vertical-align: bottom;">
            <div style="background: var(--color-primary); width: 20px; height: ${height}px; margin-bottom: 4px; border-radius: 2px;"></div>
            <div style="font-size: 0.8em;">${cost}</div>
            <div style="font-size: 0.7em; color: var(--color-text-muted);">${count}</div>
          </div>
        `;
      }).join('');
  }

  private renderCombo(combo: any): string {
    return `
      <div class="combo-item" style="background: var(--color-bg-tertiary); padding: var(--spacing-md); border-radius: var(--radius-sm); margin-bottom: var(--spacing-sm);">
        <strong>${combo.name || 'Unnamed Combo'}</strong>
        <p style="margin: var(--spacing-xs) 0; color: var(--color-text-secondary);">
          ${combo.description || 'No description available'}
        </p>
        ${combo.cards ? `
          <div style="font-size: 0.9em; color: var(--color-text-muted);">
            Cards: ${combo.cards.map((card: any) => card.name).join(', ')}
          </div>
        ` : ''}
      </div>
    `;
  }

  exportAsText() {
    if (!this.currentDeck) return;

    const text = this.generateDeckListText();
    this.downloadFile('deck-list.txt', text);
  }

  exportAsJSON() {
    if (!this.currentDeck) return;

    const json = JSON.stringify(this.currentDeck, null, 2);
    this.downloadFile('deck-data.json', json);
  }

  copyDeckList() {
    if (!this.currentDeck) return;

    const text = this.generateDeckListText();
    navigator.clipboard.writeText(text).then(() => {
      alert('Deck list copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard. Please try the export option instead.');
    });
  }

  private generateDeckListText(): string {
    if (!this.currentDeck) return '';

    const deck = this.currentDeck;
    let text = `Sorcery: Contested Realm Deck\n`;
    text += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    if (deck.avatar) {
      text += `Avatar:\n1x ${deck.avatar.name}\n\n`;
    }
    
    text += `Spells (${deck.spells.length}):\n`;
    deck.spells.forEach(spell => {
      text += `1x ${spell.name}\n`;
    });
    
    text += `\nSites (${deck.sites.length}):\n`;
    deck.sites.forEach(site => {
      text += `1x ${site.name}\n`;
    });
    
    text += `\nTotal Cards: ${deck.stats.totalCards}\n`;
    text += `Synergy Score: ${deck.synergy.toFixed(2)}\n`;
    text += `Average Mana Cost: ${deck.stats.averageManaCost.toFixed(1)}\n`;
    
    return text;
  }

  private downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
