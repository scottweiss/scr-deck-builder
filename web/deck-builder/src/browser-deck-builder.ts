// Browser-compatible deck builder entry point
// Simplified version that works with embedded card data

interface SimpleCard {
    name: string;
    type: string;
    elements?: string[];
    mana_cost?: number;
    rule_text?: string;
    threshold?: { [element: string]: number };
    archetype?: string[];
    rarity?: string;
}

interface SimpleDeck {
    avatar: SimpleCard | null;
    sites: SimpleCard[];
    spells: SimpleCard[];
    deckList: Array<{ name: string; count: number }>;
    summary: {
        totalCards: number;
        avgManaCost: number;
        elements: string[];
        archetypes: string[];
        synergy: number;
    };
    validation: {
        isValid: boolean;
        warnings: string[];
        suggestions: string[];
    };
}

// Browser-compatible card data loading
class BrowserCardLoader {
    private static cardCache: SimpleCard[] | null = null;

    static async loadCards(): Promise<{
        cards: SimpleCard[],
        avatars: SimpleCard[],
        sites: SimpleCard[],
        minions: SimpleCard[],
        artifacts: SimpleCard[],
        auras: SimpleCard[],
        magics: SimpleCard[]
    }> {
        if (!this.cardCache) {
            // Use embedded card data or create sample data
            if (typeof window !== 'undefined' && (window as any).SORCERY_CARD_DATA) {
                this.cardCache = (window as any).SORCERY_CARD_DATA.cards;
            } else {
                // Create sample data for development
                this.cardCache = this.createSampleCardData();
            }
        }

        const cards = this.cardCache;
        
        // Categorize cards
        const avatars = cards.filter(card => card.type === 'Avatar');
        const sites = cards.filter(card => card.type === 'Site');
        const minions = cards.filter(card => card.type === 'Minion');
        const artifacts = cards.filter(card => card.type === 'Artifact');
        const auras = cards.filter(card => card.type === 'Aura');
        const magics = cards.filter(card => card.type === 'Magic');

        return {
            cards,
            avatars,
            sites,
            minions,
            artifacts,
            auras,
            magics
        };
    }

    private static createSampleCardData(): SimpleCard[] {
        return [
            // Sample Avatars
            {
                name: "Merlin",
                type: "Avatar",
                elements: ["Water"],
                rule_text: "At the beginning of your turn, draw an additional card.",
                threshold: { Water: 3 }
            },
            {
                name: "Arthur",
                type: "Avatar", 
                elements: ["Fire"],
                rule_text: "Your minions have +1 attack.",
                threshold: { Fire: 3 }
            },
            {
                name: "Morgana",
                type: "Avatar",
                elements: ["Void"],
                rule_text: "When you play a magic, deal 1 damage to target.",
                threshold: { Void: 3 }
            },
            
            // Sample Sites
            {
                name: "Mystical Springs",
                type: "Site",
                elements: ["Water"],
                rule_text: "Tap: Add Water to your mana pool."
            },
            {
                name: "Volcanic Peak",
                type: "Site",
                elements: ["Fire"],
                rule_text: "Tap: Add Fire to your mana pool."
            },
            {
                name: "Ancient Grove",
                type: "Site",
                elements: ["Earth"],
                rule_text: "Tap: Add Earth to your mana pool."
            },
            {
                name: "Storm Clouds",
                type: "Site",
                elements: ["Air"],
                rule_text: "Tap: Add Air to your mana pool."
            },
            {
                name: "Void Rift",
                type: "Site",
                elements: ["Void"],
                rule_text: "Tap: Add Void to your mana pool."
            },
            
            // Sample Minions
            {
                name: "Water Elemental",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 3,
                rule_text: "When summoned, draw a card.",
                archetype: ["Control"]
            },
            {
                name: "Fire Sprite",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 2,
                rule_text: "Haste. Deal 1 damage when summoned.",
                archetype: ["Aggro"]
            },
            {
                name: "Earth Guardian",
                type: "Minion",
                elements: ["Earth"],
                mana_cost: 4,
                rule_text: "Defender. +2 health.",
                archetype: ["Control"]
            },
            {
                name: "Air Djinn",
                type: "Minion",
                elements: ["Air"],
                mana_cost: 3,
                rule_text: "Flying. Cannot be blocked.",
                archetype: ["Midrange"]
            },
            {
                name: "Void Stalker",
                type: "Minion",
                elements: ["Void"],
                mana_cost: 2,
                rule_text: "When destroyed, opponent discards a card.",
                archetype: ["Control"]
            },
            
            // Sample Artifacts
            {
                name: "Crystal Orb",
                type: "Artifact",
                elements: ["Water"],
                mana_cost: 2,
                rule_text: "Tap: Scry 1.",
                archetype: ["Control"]
            },
            {
                name: "Flame Sword",
                type: "Artifact",
                elements: ["Fire"],
                mana_cost: 3,
                rule_text: "Equipped creature gets +2 attack.",
                archetype: ["Aggro"]
            },
            
            // Sample Magics
            {
                name: "Lightning Bolt",
                type: "Magic",
                elements: ["Fire"],
                mana_cost: 1,
                rule_text: "Deal 3 damage to any target.",
                archetype: ["Aggro"]
            },
            {
                name: "Healing Potion",
                type: "Magic",
                elements: ["Earth"],
                mana_cost: 2,
                rule_text: "Restore 5 health to any target.",
                archetype: ["Control"]
            },
            {
                name: "Counterspell",
                type: "Magic",
                elements: ["Water"],
                mana_cost: 2,
                rule_text: "Counter target spell.",
                archetype: ["Control"]
            }
        ];
    }
}

// Simplified deck building logic
class SimpleDeckBuilder {
    private cards: SimpleCard[] = [];
    private avatars: SimpleCard[] = [];
    private sites: SimpleCard[] = [];
    private minions: SimpleCard[] = [];
    private artifacts: SimpleCard[] = [];
    private auras: SimpleCard[] = [];
    private magics: SimpleCard[] = [];

    async initialize(): Promise<void> {
        const cardData = await BrowserCardLoader.loadCards();
        this.cards = cardData.cards;
        this.avatars = cardData.avatars;
        this.sites = cardData.sites;
        this.minions = cardData.minions;
        this.artifacts = cardData.artifacts;
        this.auras = cardData.auras;
        this.magics = cardData.magics;
    }

    buildDeck(options: {
        preferredElement?: string;
        preferredArchetype?: string;
        avatarName?: string;
    } = {}): SimpleDeck {
        // Select avatar
        let selectedAvatar: SimpleCard | null = null;
        if (options.avatarName) {
            selectedAvatar = this.avatars.find(a => a.name === options.avatarName) || null;
        }
        if (!selectedAvatar && options.preferredElement) {
            selectedAvatar = this.avatars.find(a => a.elements?.includes(options.preferredElement!)) || null;
        }
        if (!selectedAvatar && this.avatars.length > 0) {
            selectedAvatar = this.avatars[0];
        }

        // Determine primary element
        const primaryElement = options.preferredElement || selectedAvatar?.elements?.[0] || 'Water';

        // Select sites (30 cards)
        const selectedSites = this.selectSites(primaryElement, 30);

        // Build spellbook (50 cards)
        const spellbook = this.buildSpellbook(primaryElement, options.preferredArchetype);

        // Create deck list
        const deckList = this.createDeckList(spellbook);

        // Calculate summary
        const summary = this.calculateSummary(spellbook, primaryElement, options.preferredArchetype);

        // Validate deck
        const validation = this.validateDeck(selectedAvatar, selectedSites, spellbook);

        return {
            avatar: selectedAvatar,
            sites: selectedSites,
            spells: spellbook,
            deckList,
            summary,
            validation
        };
    }

    private selectSites(primaryElement: string, count: number): SimpleCard[] {
        const elementSites = this.sites.filter(site => site.elements?.includes(primaryElement));
        const otherSites = this.sites.filter(site => !site.elements?.includes(primaryElement));
        
        const selected: SimpleCard[] = [];
        
        // Add primary element sites (about 60% of total)
        const primaryCount = Math.floor(count * 0.6);
        for (let i = 0; i < primaryCount && i < elementSites.length; i++) {
            selected.push(elementSites[i]);
        }
        
        // Fill remaining with other sites
        const remaining = count - selected.length;
        for (let i = 0; i < remaining && i < otherSites.length; i++) {
            selected.push(otherSites[i]);
        }
        
        // Fill up to count with repeated sites if needed
        while (selected.length < count) {
            const site = this.sites[selected.length % this.sites.length];
            if (site) selected.push(site);
        }
        
        return selected.slice(0, count);
    }

    private buildSpellbook(primaryElement: string, archetype?: string): SimpleCard[] {
        const spells = [...this.minions, ...this.artifacts, ...this.auras, ...this.magics];
        
        // Filter by element preference
        const primarySpells = spells.filter(spell => 
            spell.elements?.includes(primaryElement) || !spell.elements?.length
        );
        
        // Filter by archetype if specified
        let filteredSpells = primarySpells;
        if (archetype) {
            const archetypeSpells = primarySpells.filter(spell => 
                spell.archetype?.includes(archetype) || !spell.archetype?.length
            );
            if (archetypeSpells.length >= 30) {
                filteredSpells = archetypeSpells;
            }
        }
        
        // Select cards for deck (aim for 50 total)
        const selectedSpells: SimpleCard[] = [];
        const cardCounts: { [name: string]: number } = {};
        
        // Sort by mana cost for better curve
        const sortedSpells = filteredSpells.sort((a, b) => (a.mana_cost || 0) - (b.mana_cost || 0));
        
        // Add cards with some duplicates
        for (const spell of sortedSpells) {
            const currentCount = cardCounts[spell.name] || 0;
            const maxCopies = this.getMaxCopies(spell);
            
            if (selectedSpells.length < 50 && currentCount < maxCopies) {
                selectedSpells.push(spell);
                cardCounts[spell.name] = currentCount + 1;
            }
        }
        
        // Fill to 50 cards if needed
        while (selectedSpells.length < 50 && sortedSpells.length > 0) {
            const spell = sortedSpells[selectedSpells.length % sortedSpells.length];
            selectedSpells.push(spell);
        }
        
        return selectedSpells.slice(0, 50);
    }

    private getMaxCopies(card: SimpleCard): number {
        // Most cards can have up to 4 copies
        if (card.rarity === 'Legendary') return 1;
        if (card.type === 'Avatar') return 1;
        return 4;
    }

    private createDeckList(spells: SimpleCard[]): Array<{ name: string; count: number }> {
        const counts: { [name: string]: number } = {};
        
        spells.forEach(spell => {
            counts[spell.name] = (counts[spell.name] || 0) + 1;
        });
        
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => {
                if (b.count !== a.count) return b.count - a.count;
                return a.name.localeCompare(b.name);
            });
    }

    private calculateSummary(spells: SimpleCard[], primaryElement: string, archetype?: string): {
        totalCards: number;
        avgManaCost: number;
        elements: string[];
        archetypes: string[];
        synergy: number;
    } {
        const totalCards = spells.length;
        const totalManaCost = spells.reduce((sum, spell) => sum + (spell.mana_cost || 0), 0);
        const avgManaCost = totalCards > 0 ? totalManaCost / totalCards : 0;
        
        const elements = [...new Set(spells.flatMap(spell => spell.elements || []))];
        const archetypes = archetype ? [archetype] : ['Auto'];
        
        return {
            totalCards,
            avgManaCost: Math.round(avgManaCost * 100) / 100,
            elements,
            archetypes,
            synergy: Math.random() * 100 // Placeholder synergy score
        };
    }

    private validateDeck(avatar: SimpleCard | null, sites: SimpleCard[], spells: SimpleCard[]): {
        isValid: boolean;
        warnings: string[];
        suggestions: string[];
    } {
        const warnings: string[] = [];
        const suggestions: string[] = [];
        
        if (!avatar) {
            warnings.push('No avatar selected');
        }
        
        if (sites.length !== 30) {
            warnings.push(`Sites count is ${sites.length}, should be 30`);
        }
        
        if (spells.length !== 50) {
            warnings.push(`Spellbook count is ${spells.length}, should be 50`);
        }
        
        // Check mana curve
        const lowCostSpells = spells.filter(s => (s.mana_cost || 0) <= 2).length;
        const highCostSpells = spells.filter(s => (s.mana_cost || 0) >= 6).length;
        
        if (lowCostSpells < 10) {
            suggestions.push('Consider adding more low-cost spells for early game');
        }
        
        if (highCostSpells > 8) {
            suggestions.push('Consider reducing high-cost spells to avoid mana issues');
        }
        
        const isValid = warnings.length === 0;
        
        return {
            isValid,
            warnings,
            suggestions
        };
    }

    getAvailableAvatars(): SimpleCard[] {
        return this.avatars;
    }

    getAvailableElements(): string[] {
        return ['Water', 'Fire', 'Earth', 'Air', 'Void'];
    }

    getAvailableArchetypes(): string[] {
        return ['Aggro', 'Control', 'Midrange', 'Combo', 'Balanced', 'Minion-Heavy'];
    }
}

// Main deck builder class for browser
export class BrowserDeckBuilder {
    private deckBuilder: SimpleDeckBuilder;
    private isInitialized = false;

    constructor() {
        this.deckBuilder = new SimpleDeckBuilder();
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        console.log('Loading card data...');
        await this.deckBuilder.initialize();
        this.isInitialized = true;
        console.log('Deck builder initialized successfully');
    }

    async buildDeck(options: {
        preferredElement?: string;
        preferredArchetype?: string;
        avatarName?: string;
    } = {}): Promise<SimpleDeck> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        return this.deckBuilder.buildDeck(options);
    }

    getAvailableAvatars(): SimpleCard[] {
        return this.deckBuilder.getAvailableAvatars();
    }

    getAvailableElements(): string[] {
        return this.deckBuilder.getAvailableElements();
    }

    getAvailableArchetypes(): string[] {
        return this.deckBuilder.getAvailableArchetypes();
    }
}

// Make it globally available
if (typeof window !== 'undefined') {
    (window as any).SorceryDeckBuilder = {
        BrowserDeckBuilder,
        BrowserCardLoader
    };
}

export default BrowserDeckBuilder;
