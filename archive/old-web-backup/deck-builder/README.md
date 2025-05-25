# Sorcery: Contested Realm - Browser Deck Builder

A client-side deck builder for Sorcery: Contested Realm that runs entirely in the browser without requiring a server or API.

## Features

- **AI-Powered Deck Building**: Automatically builds optimized 50-card spellbooks
- **Avatar Selection**: Choose from 6 different avatars with unique abilities  
- **Element Support**: Water, Fire, Earth, Air, and Void elements
- **Archetype Selection**: Aggro, Control, Midrange, Combo, and Balanced strategies
- **Deck Validation**: Real-time validation with warnings and suggestions
- **Export Options**: 
  - JSON format for data exchange
  - Text format for sharing
  - Copy to clipboard for quick sharing

## How to Use

1. **Open** `index.html` in any modern web browser
2. **Select Avatar**: Choose your preferred avatar (optional - will auto-select based on element)
3. **Choose Element**: Pick your primary element or let it auto-detect from avatar
4. **Pick Archetype**: Select your preferred strategy or let it auto-select
5. **Build Deck**: Click "Build Deck" to generate your optimized deck
6. **Review Results**: Check the deck summary, validation, and card lists
7. **Export**: Use the export buttons to save or share your deck

## File Structure

```
web/deck-builder/
├── index.html                    # Main interface
├── styles.css                    # Modern styling
├── app.js                        # UI logic and event handling
├── browser-deck-builder-v2.js    # Core deck building engine
├── test.html                     # Simple test page
└── README.md                     # This documentation
```

## Technical Details

### Card Database
Currently uses a sample database with 40+ cards including:
- 6 Avatars (one for each element plus one dual-element)
- 8 Sites for mana generation
- 20+ Minions across all mana costs
- 6 Artifacts for equipment and utility
- 14 Magic spells for combat and control

### Deck Building Algorithm
- **Sites**: 30 cards, 60% matching avatar's element
- **Spellbook**: 50 cards with optimized mana curve
- **Mana Curve**: Prioritizes low-cost cards for early game
- **Element Focus**: Filters cards by primary element
- **Archetype Matching**: Selects cards that fit the chosen strategy

### Validation Rules
- Checks for correct deck size (30 sites + 50 spells)
- Validates mana curve distribution
- Ensures good creature-to-spell ratio
- Provides optimization suggestions

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript features
- Fetch API
- Local storage
- Clipboard API (for copy functionality)

## Development

To modify or extend the deck builder:

1. **Add Cards**: Edit the `getSampleCardData()` function in `browser-deck-builder-v2.js`
2. **Adjust Algorithm**: Modify the deck building logic in `buildSpellbook()` method
3. **Update UI**: Edit `app.js` for interface changes or `styles.css` for styling
4. **Test**: Use `test.html` for quick functionality testing

## Future Enhancements

- Real card data integration from official sources
- Advanced filtering and search
- Deck comparison tools
- Mulligan simulator
- Mana curve visualization
- Collection management
- Deck sharing and community features

## License

This is a fan-made tool for educational and community purposes. Sorcery: Contested Realm is a trademark of its respective owners.
