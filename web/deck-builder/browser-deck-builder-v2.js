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
                rule_text: "Your spells cost 1 less mana.",
                threshold: { Air: 3 }
            },
            {
                name: "Percival",
                type: "Avatar",
                elements: ["Fire", "Earth"],
                rule_text: "Whenever you summon a minion, gain 1 life.",
                threshold: { Fire: 2, Earth: 2 }
            },
            
            // Sample Sites
            {
                name: "Crystal Lake",
                type: "Site",
                elements: ["Water"],
                rule_text: "Tap: Add Water mana to your pool."
            },
            {
                name: "Volcanic Peak",
                type: "Site",
                elements: ["Fire"],
                rule_text: "Tap: Add Fire mana to your pool."
            },
            {
                name: "Ancient Forest",
                type: "Site",
                elements: ["Earth"],
                rule_text: "Tap: Add Earth mana to your pool."
            },
            {
                name: "Sky Temple",
                type: "Site",
                elements: ["Air"],
                rule_text: "Tap: Add Air mana to your pool."
            },
            {
                name: "Void Sanctum",
                type: "Site",
                elements: ["Void"],
                rule_text: "Tap: Add Void mana to your pool."
            },
            {
                name: "Mystic Gardens",
                type: "Site",
                elements: ["Water", "Earth"],
                rule_text: "Tap: Add Water or Earth mana to your pool."
            },
            {
                name: "Elemental Nexus",
                type: "Site",
                elements: ["Fire", "Air"],
                rule_text: "Tap: Add Fire or Air mana to your pool."
            },
            {
                name: "Crystal Caverns",
                type: "Site",
                elements: ["Water"],
                rule_text: "Tap: Add Water mana. Scry 1."
            },
            
            // Sample Minions - Low Cost (1-3 mana)
            {
                name: "Water Sprite",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 1,
                attack: 1,
                defense: 1,
                rule_text: "Flying. When summoned, scry 1.",
                archetype: ["Aggro", "Control"]
            },
            {
                name: "Fire Imp",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 1,
                attack: 2,
                defense: 1,
                rule_text: "Haste. Deal 1 damage to yourself when summoned.",
                archetype: ["Aggro"]
            },
            {
                name: "Earth Golem",
                type: "Minion",
                elements: ["Earth"],
                mana_cost: 2,
                attack: 1,
                defense: 3,
                rule_text: "Defender. Gains +1/+1 each turn.",
                archetype: ["Control", "Midrange"]
            },
            {
                name: "Wind Walker",
                type: "Minion",
                elements: ["Air"],
                mana_cost: 2,
                attack: 2,
                defense: 2,
                rule_text: "Flying. Can't be blocked by creatures without flying.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Void Wraith",
                type: "Minion",
                elements: ["Void"],
                mana_cost: 3,
                attack: 3,
                defense: 2,
                rule_text: "When summoned, target player discards a card.",
                archetype: ["Control", "Midrange"]
            },
            {
                name: "Frost Mage",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 3,
                attack: 2,
                defense: 3,
                rule_text: "When summoned, tap target creature.",
                archetype: ["Control"]
            },
            {
                name: "Flame Warrior",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 2,
                attack: 3,
                defense: 1,
                rule_text: "First strike.",
                archetype: ["Aggro"]
            },
            
            // Sample Minions - Mid Cost (4-6 mana)
            {
                name: "Tidal Guardian",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 4,
                attack: 3,
                defense: 4,
                rule_text: "When summoned, return target spell to its owner's hand.",
                archetype: ["Control", "Midrange"]
            },
            {
                name: "Phoenix Warrior",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 5,
                attack: 4,
                defense: 3,
                rule_text: "When this dies, deal 2 damage to any target.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Stone Colossus",
                type: "Minion",
                elements: ["Earth"],
                mana_cost: 6,
                attack: 5,
                defense: 6,
                rule_text: "Trample. Costs 1 less for each Earth site you control.",
                archetype: ["Midrange", "Control"]
            },
            {
                name: "Storm Eagle",
                type: "Minion",
                elements: ["Air"],
                mana_cost: 4,
                attack: 3,
                defense: 3,
                rule_text: "Flying. When summoned, draw a card.",
                archetype: ["Control", "Midrange"]
            },
            {
                name: "Shadow Beast",
                type: "Minion",
                elements: ["Void"],
                mana_cost: 5,
                attack: 4,
                defense: 4,
                rule_text: "Intimidate. Opponents' creatures enter play tapped.",
                archetype: ["Control", "Midrange"]
            },
            {
                name: "Crystal Golem",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 5,
                attack: 4,
                defense: 5,
                rule_text: "When summoned, draw a card for each Water site you control.",
                archetype: ["Control"]
            },
            {
                name: "Lava Serpent",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 4,
                attack: 4,
                defense: 2,
                rule_text: "Haste. When this attacks, deal 1 damage to defending player.",
                archetype: ["Aggro"]
            },
            {
                name: "Tree Shepherd",
                type: "Minion",
                elements: ["Earth"],
                mana_cost: 4,
                attack: 2,
                defense: 4,
                rule_text: "When summoned, create two 1/1 Plant tokens.",
                archetype: ["Midrange"]
            },
            
            // Sample Minions - High Cost (7+ mana)
            {
                name: "Leviathan",
                type: "Minion",
                elements: ["Water"],
                mana_cost: 8,
                attack: 8,
                defense: 8,
                rule_text: "When summoned, return all other creatures to their owners' hands.",
                archetype: ["Control"]
            },
            {
                name: "Dragon Lord",
                type: "Minion",
                elements: ["Fire"],
                mana_cost: 7,
                attack: 7,
                defense: 5,
                rule_text: "Flying. When summoned, deal 3 damage to all enemies.",
                archetype: ["Midrange", "Control"]
            },
            {
                name: "World Tree",
                type: "Minion",
                elements: ["Earth"],
                mana_cost: 9,
                attack: 6,
                defense: 10,
                rule_text: "Defender. All your other creatures get +1/+1.",
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
                rule_text: "Equipped creature gets +2/+0 and first strike.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Earth Shield",
                type: "Artifact",
                elements: ["Earth"],
                mana_cost: 2,
                rule_text: "Equipped creature gets +0/+3 and blocks an additional creature.",
                archetype: ["Control"]
            },
            {
                name: "Wind Cloak",
                type: "Artifact",
                elements: ["Air"],
                mana_cost: 2,
                rule_text: "Equipped creature has flying and can't be blocked.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Void Crown",
                type: "Artifact",
                elements: ["Void"],
                mana_cost: 4,
                rule_text: "At the beginning of your turn, target opponent discards a card.",
                archetype: ["Control"]
            },
            {
                name: "Mana Crystal",
                type: "Artifact",
                elements: [],
                mana_cost: 1,
                rule_text: "Tap: Add one mana of any color to your pool.",
                archetype: ["Aggro", "Control", "Midrange"]
            },
            
            // Sample Magics - Instant/Sorcery equivalents
            {
                name: "Lightning Bolt",
                type: "Magic",
                elements: ["Fire"],
                mana_cost: 1,
                rule_text: "Deal 3 damage to any target.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Healing Touch",
                type: "Magic",
                elements: ["Earth"],
                mana_cost: 2,
                rule_text: "Restore 5 health to any target. Draw a card.",
                archetype: ["Control"]
            },
            {
                name: "Counterspell",
                type: "Magic",
                elements: ["Water"],
                mana_cost: 2,
                rule_text: "Counter target spell. Draw a card.",
                archetype: ["Control"]
            },
            {
                name: "Wind Blast",
                type: "Magic",
                elements: ["Air"],
                mana_cost: 3,
                rule_text: "Return target creature to its owner's hand. It costs 2 more to play.",
                archetype: ["Control", "Midrange"]
            },
            {
                name: "Mind Drain",
                type: "Magic",
                elements: ["Void"],
                mana_cost: 2,
                rule_text: "Target player discards two cards.",
                archetype: ["Control"]
            },
            {
                name: "Fireball",
                type: "Magic",
                elements: ["Fire"],
                mana_cost: 4,
                rule_text: "Deal 5 damage to target creature or player.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Giant Growth",
                type: "Magic",
                elements: ["Earth"],
                mana_cost: 1,
                rule_text: "Target creature gets +3/+3 until end of turn.",
                archetype: ["Aggro", "Midrange"]
            },
            {
                name: "Frost Nova",
                type: "Magic",
                elements: ["Water"],
                mana_cost: 3,
                rule_text: "Tap all enemy creatures. They don't untap next turn.",
                archetype: ["Control"]
            },
            {
                name: "Chain Lightning",
                type: "Magic",
                elements: ["Fire"],
                mana_cost: 3,
                rule_text: "Deal 2 damage to target creature, then 1 damage to two other targets.",
                archetype: ["Aggro", "Control"]
            },
            {
                name: "Earthquake",
                type: "Magic",
                elements: ["Earth"],
                mana_cost: 4,
                rule_text: "Deal 2 damage to all creatures and players.",
                archetype: ["Control"]
            },
            {
                name: "Whirlwind",
                type: "Magic",
                elements: ["Air"],
                mana_cost: 2,
                rule_text: "Return all creatures with mana cost 2 or less to their owners' hands.",
                archetype: ["Control"]
            },
            {
                name: "Dark Ritual",
                type: "Magic",
                elements: ["Void"],
                mana_cost: 1,
                rule_text: "Add 3 Void mana to your pool. Lose 2 life.",
                archetype: ["Combo"]
            },
            {
                name: "Blessing",
                type: "Magic",
                elements: ["Earth"],
                mana_cost: 1,
                rule_text: "Target creature gains +1/+1 permanently.",
                archetype: ["Midrange"]
            },
            {
                name: "Dispel",
                type: "Magic",
                elements: ["Air"],
                mana_cost: 1,
                rule_text: "Destroy target artifact or enchantment.",
                archetype: ["Control", "Midrange"]
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
            !spell.elements || spell.elements.length === 0 || spell.elements.includes(primaryElement)
        );
        
        // Filter by archetype if specified
        let filteredSpells = primarySpells;
        if (archetype && archetype !== 'Auto') {
            const archetypeSpells = primarySpells.filter(spell => 
                !spell.archetype || spell.archetype.includes(archetype)
            );
            if (archetypeSpells.length >= 20) {
                filteredSpells = archetypeSpells;
            }
        }
        
        // Select cards for deck (aim for 50 total)
        const selectedSpells = [];
        const cardCounts = {};
        
        // Sort by mana cost for better curve
        const sortedSpells = filteredSpells.sort((a, b) => (a.mana_cost || 0) - (b.mana_cost || 0));
        
        // Build mana curve: more low-cost cards, fewer high-cost
        const targetDistribution = {
            1: 8,  // 1 mana
            2: 12, // 2 mana
            3: 10, // 3 mana
            4: 8,  // 4 mana
            5: 6,  // 5 mana
            6: 4,  // 6+ mana
        };
        
        // First, try to hit target distribution
        for (const spell of sortedSpells) {
            const cost = Math.min(spell.mana_cost || 0, 6);
            const currentAtCost = selectedSpells.filter(s => Math.min(s.mana_cost || 0, 6) === cost).length;
            const target = targetDistribution[cost] || 2;
            
            const currentCount = cardCounts[spell.name] || 0;
            const maxCopies = this.getMaxCopies(spell);
            
            if (selectedSpells.length < 50 && currentAtCost < target && currentCount < maxCopies) {
                selectedSpells.push(spell);
                cardCounts[spell.name] = currentCount + 1;
            }
        }
        
        // Fill to 50 cards if needed
        let attempts = 0;
        while (selectedSpells.length < 50 && attempts < 100) {
            for (const spell of sortedSpells) {
                if (selectedSpells.length >= 50) break;
                
                const currentCount = cardCounts[spell.name] || 0;
                const maxCopies = this.getMaxCopies(spell);
                
                if (currentCount < maxCopies) {
                    selectedSpells.push(spell);
                    cardCounts[spell.name] = currentCount + 1;
                }
            }
            attempts++;
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
        const archetypes = archetype && archetype !== 'Auto' ? [archetype] : ['Auto'];
        
        // Calculate mana curve
        const manaCurve = {};
        spells.forEach(spell => {
            const cost = spell.mana_cost || 0;
            manaCurve[cost] = (manaCurve[cost] || 0) + 1;
        });
        
        return {
            totalCards,
            avgManaCost: Math.round(avgManaCost * 100) / 100,
            elements,
            archetypes,
            manaCurve,
            synergy: Math.floor(Math.random() * 20) + 80 // Placeholder synergy score 80-100
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
        const midCostSpells = spells.filter(s => (s.mana_cost || 0) >= 3 && (s.mana_cost || 0) <= 5).length;
        const highCostSpells = spells.filter(s => (s.mana_cost || 0) >= 6).length;
        
        if (lowCostSpells < 15) {
            suggestions.push('Consider adding more low-cost spells (1-2 mana) for early game');
        }
        
        if (highCostSpells > 8) {
            suggestions.push('Consider reducing high-cost spells (6+ mana) to avoid mana issues');
        }
        
        if (midCostSpells < 10) {
            suggestions.push('Consider adding more mid-range spells (3-5 mana) for board presence');
        }
        
        // Check creature count
        const creatures = spells.filter(s => s.type === 'Minion').length;
        if (creatures < 20) {
            suggestions.push('Consider adding more creatures for board presence');
        }
        if (creatures > 35) {
            suggestions.push('Consider adding more spells for versatility');
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
        return ['Aggro', 'Control', 'Midrange', 'Combo', 'Balanced'];
    }
}

// Make it globally available
window.SorceryDeckBuilder = {
    BrowserDeckBuilder: SimpleBrowserDeckBuilder
};

console.log('Sorcery Deck Builder loaded successfully');
