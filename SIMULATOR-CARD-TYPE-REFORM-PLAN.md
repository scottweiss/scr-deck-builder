# Sorcery: Contested Realm Simulator Card Type & Rule Refactor Plan

## Background
Many simulation and AI files were written with Magic: The Gathering (MTG) card types and rules in mind. Sorcery: Contested Realm uses a different set of card types and rules. This has led to type mismatches, incorrect logic, and test failures. The full Sorcery rules are in `src/core/rules/rules-formatted.md`. This is a net new project and we do not need to maintain any MTG compatibility or legacy code.

## Goals
- **Standardize all card type usage** on the Sorcery enum (`CardType`) everywhere in the codebase.
- **Remove all MTG-style types** (e.g., 'Creature', 'Instant', 'Sorcery', 'Enchantment') from logic, tests, and data.
- **Refactor simulation, AI, and test logic** to use Sorcery rules and terminology.
- **Fix all type errors and test failures** related to card type mismatches.
- **Ensure all card conversions use the enum** (`CardType`) as the source of truth.
- **Align all targeting, effect, and rule logic** with the official Sorcery rules.

## Card Types (Sorcery Enum)
- Minion
- Magic
- Artifact
- Aura
- Site
- Avatar

## Action Plan

### 1. Card Type Standardization
- [ ] Replace all string literals like 'Creature', 'Instant', 'Sorcery', 'Enchantment' with the correct `CardType` enum values.
- [ ] Update all type checks, filters, and assignments to use the enum.
- [ ] Update all test data and mock cards to use Sorcery types.

### 2. Targeting & Effect Refactor
- [ ] Change all target type logic from 'creature' to 'minion', and update any other MTG-style keywords.
- [ ] Refactor effect parsing and targeting to match Sorcery rules (see rules-formatted.md).

### 3. Simulation & AI Logic
- [ ] Refactor all AI strategies, combat, and effect logic to use Sorcery rules and card types.
- [ ] Remove or rewrite any logic that assumes MTG rules (e.g., instant/sorcery stack, combat steps, etc.).
- [ ] Ensure all AI and simulation code uses the enum for card type checks.

### 4. Card Adapter & Conversion
- [x] Refactor `card-adapter.ts` to always use the enum for conversions and type checks.
- [ ] Audit all usages of card conversion utilities to ensure correct enum usage.

### 5. Test Suite & Data
- [ ] Update all test helpers, mock decks, and test cards to use Sorcery types and rules.
- [ ] Fix all test failures related to card type mismatches or MTG logic.

### 6. Documentation & Comments
- [ ] Update all code comments and documentation to use Sorcery terminology.
- [ ] Add references to rules-formatted.md where relevant.

## Next Steps
- Begin with a global search-and-replace for card type strings and target types.
- Refactor simulation and AI files to use the enum and Sorcery rules.
- Update all test data and helpers.
- Run the full test suite after each major step.
- Use this plan as a checklist and update as progress is made.
