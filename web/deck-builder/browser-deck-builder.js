// Simple browser deck builder using plain JavaScript
// This will be embedded directly in the HTML without compilation

class SimpleBrowserDeckBuilder {
    constructor() {
        this.cardData = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        console.log('Loading card data...');
        this.cardData = this.getSampleCardData();
        this.isInitialized = true;
        console.log('Deck builder initialized with', this.cardData.cards.length, 'cards');
    }

    getSampleCardData() {
        const cards = [
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
            {
                name: "Guinevere", 
                type: "Avatar",
                elements: ["Earth"],
                rule_text: "Gain 2 life whenever you play a creature.",
                threshold: { Earth: 3 }
            },
            {
                name: "Lancelot",
                type: "Avatar",
                elements: ["Air"],
                rule_text: "Your creatures have flying.",
                threshold: { Air: 3 }
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
            {
                name: "Crystal Cavern",
                type: "Site",
                elements: ["Water"],
                rule_text: "Tap: Add Water to your mana pool. Scry 1."
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
            {
                name: "Frost Mage",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 3,
                rule_text: "Tap target creature. It doesn't untap next turn.",
                archetype: ["Control"]
            },
            {
                name: "Flame Warrior",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 1,
                rule_text: "First strike.",
                archetype: ["Aggro"]
            },
            {
                name: "Tree Shepherd",
                type: "Minion",
                elements: ["Earth"],
                mana_cost: 5,
                rule_text: "When summoned, create two 1/1 Plant tokens.",
                archetype: ["Midrange"]
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
            {
                name: "Earth Shield",
                type: "Artifact",
                elements: ["Earth"],
                mana_cost: 2,
                rule_text: "Equipped creature gets +0/+3.",
                archetype: ["Control"]
            },
            {
                name: "Wind Cloak",
                type: "Artifact",
                elements: ["Air"],
                mana_cost: 2,
                rule_text: "Equipped creature has flying.",
                archetype: ["Midrange"]
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
            },
            {
                name: "Wind Blast",
                type: "Magic",
                elements: ["Air"],
                mana_cost: 3,
                rule_text: "Return target creature to its owner's hand.",
                archetype: ["Control"]
            },
            {
                name: "Void Drain",
                type: "Magic",
                elements: ["Void"],
                mana_cost: 2,
                rule_text: "Target player discards a card.",
                archetype: ["Control"]
            },
            {
                name: "Fireball",
                type: "Magic",
                elements: ["Fire"],
                mana_cost: 4,
                rule_text: "Deal 5 damage to any target.",
                archetype: ["Aggro"]
            },
            {
                name: "Giant Growth",
                type: "Magic",
                elements: ["Earth"],
                mana_cost: 1,
                rule_text: "Target creature gets +3/+3 until end of turn.",
                archetype: ["Aggro"]
            }
        ];

        return {
            cards,
            avatars: cards.filter(card => card.type === 'Avatar'),
            sites: cards.filter(card => card.type === 'Site'),
            minions: cards.filter(card => card.type === 'Minion'),
            artifacts: cards.filter(card => card.type === 'Artifact'),
            auras: cards.filter(card => card.type === 'Aura'),
            magics: cards.filter(card => card.type === 'Magic')
        };
    }

    async buildDeck(options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const {
            avatarName,
            preferredElement,
            preferredArchetype
        } = options;

        // Select avatar
        let selectedAvatar = null;
        if (avatarName) {
            selectedAvatar = this.cardData.avatars.find(a => a.name === avatarName);
        }
        if (!selectedAvatar && preferredElement) {
            selectedAvatar = this.cardData.avatars.find(a => a.elements.includes(preferredElement));
        }
        if (!selectedAvatar) {
            selectedAvatar = this.cardData.avatars[0];
        }

        // Determine primary element
        const primaryElement = preferredElement || selectedAvatar.elements[0] || 'Water';

        // Select sites (30 cards)
        const selectedSites = this.selectSites(primaryElement, 30);

        // Build spellbook (50 cards)
        const spellbook = this.buildSpellbook(primaryElement, preferredArchetype);

        // Create deck list
        const deckList = this.createDeckList(spellbook);

        // Calculate summary
        const summary = this.calculateSummary(spellbook, primaryElement, preferredArchetype);

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

    selectSites(primaryElement, count) {
        const elementSites = this.cardData.sites.filter(site => 
            site.elements.includes(primaryElement)
        );
        const otherSites = this.cardData.sites.filter(site => 
            !site.elements.includes(primaryElement)
        );
        
        const selected = [];
        
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
            const site = this.cardData.sites[selected.length % this.cardData.sites.length];
            if (site) selected.push(site);
        }
        
        return selected.slice(0, count);
    }

    buildSpellbook(primaryElement, archetype) {
        const spells = [
            ...this.cardData.minions,
            ...this.cardData.artifacts,
            ...this.cardData.auras,
            ...this.cardData.magics
        ];
        
        // Filter by element preference
        const primarySpells = spells.filter(spell => 
            !spell.elements || spell.elements.includes(primaryElement)
        );
        
        // Filter by archetype if specified
        let filteredSpells = primarySpells;
        if (archetype) {
            const archetypeSpells = primarySpells.filter(spell => 
                !spell.archetype || spell.archetype.includes(archetype)
            );
            if (archetypeSpells.length >= 30) {
                filteredSpells = archetypeSpells;
            }
        }
        
        // Select cards for deck (aim for 50 total)
        const selectedSpells = [];
        const cardCounts = {};
        
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

    getMaxCopies(card) {
        // Most cards can have up to 4 copies
        if (card.rarity === 'Legendary') return 1;
        if (card.type === 'Avatar') return 1;
        return 4;
    }

    createDeckList(spells) {
        const counts = {};
        
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

    calculateSummary(spells, primaryElement, archetype) {
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
            synergy: Math.floor(Math.random() * 100) // Placeholder synergy score
        };
    }

    validateDeck(avatar, sites, spells) {
        const warnings = [];
        const suggestions = [];
        
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

    getAvailableAvatars() {
        return this.cardData ? this.cardData.avatars : [];
    }

    getAvailableElements() {
        return ['Water', 'Fire', 'Earth', 'Air', 'Void'];
    }

    getAvailableArchetypes() {
        return ['Aggro', 'Control', 'Midrange', 'Combo', 'Balanced', 'Minion-Heavy'];
    }
}

// Make it globally available
window.SorceryDeckBuilder = {
    BrowserDeckBuilder: SimpleBrowserDeckBuilder
};

console.log('Sorcery Deck Builder loaded successfully');
