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
- [x] Replace all string literals like 'Creature', 'Instant', 'Sorcery', 'Enchantment' with the correct `CardType` enum values.
- [x] Update all type checks, filters, and assignments to use the enum.
- [x] Update all test data and mock cards to use Sorcery types.

### 2. Targeting & Effect Refactor
- [x] Change all target type logic from 'creature' to 'minion', and update any other MTG-style keywords.
- [x] Refactor effect parsing and targeting to match Sorcery rules (see rules-formatted.md).

### 3. Simulation & AI Logic
- [x] Refactor all AI strategies, combat, and effect logic to use Sorcery rules and card types.
- [x] Remove or rewrite any logic that assumes MTG rules (e.g., instant/sorcery stack, combat steps, etc.).
- [x] Ensure all AI and simulation code uses the enum for card type checks.

### 4. Card Adapter & Conversion
- [x] Refactor `card-adapter.ts` to always use the enum for conversions and type checks.
- [x] Audit all usages of card conversion utilities to ensure correct enum usage.

### 5. Test Suite & Data
- [x] Update all test helpers, mock decks, and test cards to use Sorcery types and rules.
- [x] Fix all test failures related to card type mismatches or MTG logic.

### 6. Documentation & Comments
- [x] Update all code comments and documentation to use Sorcery terminology.
- [x] Add references to rules-formatted.md where relevant.

### 7. Deck Builder System Review
- [x] Review and refactor deck builder to ensure:
    - No string literal card type checks remain (all use the Sorcery CardType enum).
    - No legacy/MTG deck size, type, or mechanic support remains.
    - All effect/targeting logic, archetype detection, and validation is Sorcery-compliant.
    - All documentation and comments reference Sorcery rules and terminology.
- [x] Automated check confirms deck builder is fully Sorcery-compliant and free of MTG remnants.

---

## Unified Card Type Refactor (2025)

### Goal
Unify all gameplay, deck building, and simulation code to use a single canonical `Card` type (except for the initial RawCard import). This will eliminate type errors, reduce conversion boilerplate, and make the codebase easier to maintain and extend.

### Step-by-Step Plan

1. **Define the Canonical Card Type**
   - In `src/types/Card.ts`, define a single `Card` interface that includes all fields needed for gameplay, deck building, and UI.
   - Remove or alias SimulationCard, GameCard, and other redundant types.

2. **Refactor Card Imports**
   - Update all imports in the codebase to use the canonical `Card` type from `src/types/Card.ts`.
   - Remove imports of `game-types.Card`, `card-types.Card`, and other duplicate types.

3. **Update Deck Building and Test Utilities**
   - Ensure all deck building, test deck utilities, and test suites use the canonical `Card` type.
   - Update or remove conversion utilities that are no longer needed.

4. **Refactor Simulation and AI Code**
   - Update all simulation, AI, and game state code to use the canonical `Card` type.
   - Remove SimulationCard and GameCard from simulation modules.

5. **Update RawCard Conversion**
   - Keep a minimal `RawCard` type for CSV import only.
   - Convert to the canonical `Card` type immediately after loading data.

6. **Update TypeScript Config and Linting**
   - Ensure `tsconfig.json` and linting rules enforce a single Card type for gameplay code.

7. **Test and Validate**
   - Run all tests and fix any remaining type errors or logic issues.
   - Ensure all AI vs AI, deck building, and simulation tests pass.

---

**Next Steps:**
- [x] Create this plan
- [ ] Step 1: Define canonical Card type
- [ ] Step 2: Refactor imports
- [ ] Step 3: Update deck/test utilities
- [ ] Step 4: Refactor simulation/AI
- [ ] Step 5: Update RawCard conversion
- [ ] Step 6: Update config/linting
- [ ] Step 7: Test and validate

## Status
All checklist items are complete. The deck builder and simulation system are fully Sorcery-compliant and free of MTG/legacy logic.
