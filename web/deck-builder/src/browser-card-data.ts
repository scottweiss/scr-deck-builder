// Browser-compatible card data
// This file will be generated from the processed card data

export interface BrowserCard {
    name: string;
    type: string;
    mana_cost?: number;
    elements?: string[];
    threshold?: string;
    power?: number;
    life?: number;
    rarity?: string;
    description?: string;
    mechanics?: string[];
    baseName?: string;
}

// This will be populated by the build process
let CARD_DATA: BrowserCard[] = [];

// Load card data from embedded data or fetch if needed
export async function loadBrowserCardData(): Promise<BrowserCard[]> {
    if (CARD_DATA.length > 0) {
        return CARD_DATA;
    }

    try {
        // Try to load from embedded data first
        if (typeof window !== 'undefined' && (window as any).SORCERY_CARD_DATA) {
            CARD_DATA = (window as any).SORCERY_CARD_DATA;
            return CARD_DATA;
        }

        // Fallback: fetch from static file
        const response = await fetch('./data/cards.json');
        if (response.ok) {
            CARD_DATA = await response.json();
            return CARD_DATA;
        }

        throw new Error('Could not load card data');
    } catch (error) {
        console.error('Failed to load card data:', error);
        return [];
    }
}

export function getBrowserCards(): BrowserCard[] {
    return CARD_DATA;
}

export function getBrowserAvatars(): BrowserCard[] {
    return CARD_DATA.filter(card => card.type === 'Avatar');
}

export function getBrowserSites(): BrowserCard[] {
    return CARD_DATA.filter(card => card.type === 'Site');
}

export function getBrowserMinions(): BrowserCard[] {
    return CARD_DATA.filter(card => card.type === 'Minion');
}

export function getBrowserArtifacts(): BrowserCard[] {
    return CARD_DATA.filter(card => card.type === 'Artifact');
}

export function getBrowserAuras(): BrowserCard[] {
    return CARD_DATA.filter(card => card.type === 'Aura');
}

export function getBrowserMagics(): BrowserCard[] {
    return CARD_DATA.filter(card => card.type === 'Magic');
}
