# Sorcery: Contested Realm Game Simulator Build Plan

## 📋 Project Overview

This document outlines the comprehensive plan for building a complete game simulator for Sorcery: Contested Realm with an interactive web-based UI. The simulator will provide full game mechanics implementation, AI opponents, deck testing capabilities, and visual gameplay representation.

---

## 🎯 Goals & Objectives

### Primary Goals
1. **Complete Game Engine**: Implement all core Sorcery game mechanics
2. **Interactive UI**: Create an intuitive web interface for gameplay visualization
3. **AI System**: Develop intelligent opponents with multiple difficulty levels
4. **Deck Analysis**: Provide comprehensive deck testing and optimization tools
5. **Educational Tool**: Help players understand game mechanics and strategy

### Success Metrics
- Full rules compliance with official Sorcery rulebook
- Smooth 60fps gameplay visualization
- AI that can challenge human players
- Comprehensive test coverage (>90%)
- Mobile-responsive design

---

## 🏗️ System Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    Web UI Layer                         │
├─────────────────────────────────────────────────────────┤
│  Game Board │ Controls │ Card Views │ Analytics Panel  │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                 Browser Integration                     │
├─────────────────────────────────────────────────────────┤
│  Simulation │ Deck Builder │ State Management │ Events │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   Core Game Engine                      │
├─────────────────────────────────────────────────────────┤
│  Turn Engine │ Combat │ AI Engine │ Rule Enforcement   │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   Data & Card System                    │
├─────────────────────────────────────────────────────────┤
│  Card Database │ Deck Validation │ Effect Parser      │
└─────────────────────────────────────────────────────────┘
```

---

## 📅 Development Phases

## Phase 1: Core Engine Foundation (Weeks 1-3)

### 1.1 Game State Management
**Priority: Critical**
- [x] Implement `GameState` class with complete state tracking
- [x] Player state (health, mana, hand, battlefield)
- [x] Board state (5x4 grid with regions)
- [x] Turn phases and priority system
- [x] Game history for rollback/replay

**Files to Create/Modify:**
- `src/core/simulation/core/gameState.ts` ✅ (exists, needs enhancement)
- `src/core/simulation/core/playerState.ts` ✅ (completed)
- `src/core/simulation/core/boardState.ts` ✅ (completed)

### 1.2 Turn Engine
**Priority: Critical**
- [x] Phase management (Beginning, Main, Combat, End)
- [x] Priority passing system
- [x] Action stack implementation
- [x] Timing restrictions and windows

**Files to Create/Modify:**
- `src/core/simulation/core/turnEngine.ts` ✅ (exists, needs enhancement)
- `src/core/simulation/core/actionStack.ts` ✅ (completed)
- `src/core/simulation/core/prioritySystem.ts` ✅ (completed)

### 1.3 Card Effect System
**Priority: Critical**
- [x] Effect parsing and execution
- [x] Targeting system
- [x] Continuous effects tracking
- [x] Triggered abilities

**Files to Create/Modify:**
- `src/core/simulation/core/spellEffectSystem.ts` ✅ (exists, needs enhancement)
- `src/core/simulation/core/effectParser.ts` ✅ (completed)
- `src/core/simulation/core/targetingSystem.ts` ✅ (completed)

### Phase 1 Deliverables ✅ COMPLETED
- [x] Basic game can be simulated programmatically
- [x] Core rules engine passes unit tests
- [x] Command-line simulation tool

**Phase 1 Status**: COMPLETE - All core engine foundation components implemented
- ✅ PlayerStateManager with comprehensive state tracking
- ✅ BoardStateManager with 5x4 grid and movement systems
- ✅ ActionStack with priority and spell resolution
- ✅ PrioritySystem with turn phases and timing
- ✅ EffectParser with card effect parsing and execution
- ✅ TargetingSystem with validation and restrictions

---

## Phase 2: Combat & Positioning (Weeks 4-5)

### 2.1 Combat System
**Priority: Critical**
- [x] Attack declaration and resolution
- [x] Intercept/Defend mechanics
- [x] Damage assignment and prevention
- [x] Combat modifiers and effects

**Files to Create/Modify:**
- `src/core/simulation/core/combatSystem.ts` ✅ (exists, needs enhancement)
- `src/core/simulation/core/combatPhase.ts` ✅ (completed)
- `src/core/simulation/core/damageSystem.ts` ✅ (completed)

### 2.2 Positional Mechanics
**Priority: High**
- [x] Unit placement and movement
- [x] Regional effects (void/surface/underground/underwater)
- [x] Adjacency rules and site placement
- [x] Line of sight and range calculations

**Files to Create/Modify:**
- `src/core/simulation/core/positionSystem.ts` ✅ (completed)
- `src/core/simulation/core/movementEngine.ts` ✅ (completed)
- `src/core/simulation/core/regionManager.ts` ✅ (completed)

### Phase 2 Deliverables
- ✅ Complete combat resolution
- ✅ Accurate positioning mechanics
- ✅ Integration tests for complex scenarios

**Phase 2 Status**: COMPLETE - All combat and positioning components implemented and validated by integration tests
- ✅ CombatPhase with complete combat step management
- ✅ DamageSystem with damage prevention and resolution
- ✅ PositionSystem with placement validation and adjacency rules
- ✅ MovementEngine with pathfinding and movement restrictions
- ✅ RegionManager with regional effects and terrain modifiers

---

## Phase 3: AI Engine (Weeks 6-8)

### 3.1 AI Decision Framework
**Priority: High**
- [x] Game state evaluation
- [x] Action generation and filtering
- [x] Decision tree algorithms
- [x] Multiple difficulty levels

**Files to Create/Modify:**
- `src/core/simulation/core/aiEngine.ts` ✅ (enhanced with pluggable strategies)
- `src/core/simulation/ai/aiStrategy.ts` ✅ (completed)
- `src/core/simulation/ai/actionEvaluator.ts` ✅ (completed)
- `src/core/simulation/ai/difficultyManager.ts` ✅ (completed)

### 3.2 Strategic AI Personalities
**Priority: Medium**
- [ ] Aggressive AI (fast pressure)
- [ ] Control AI (card advantage)
- [ ] Midrange AI (balanced approach)
- [ ] Combo AI (specific win conditions)

**Files to Create/Modify:**
- `src/core/simulation/ai/strategies/aggressiveAI.ts` ✅ (created)
- `src/core/simulation/ai/strategies/controlAI.ts` ✅ (created)
- `src/core/simulation/ai/strategies/midrangeAI.ts` ✅ (created)
- `src/core/simulation/ai/strategies/comboAI.ts` ✅ (created)

### 3.3 AI vs AI Testing & Analysis
**Priority: Medium**
- [ ] Automated AI vs AI match simulation
- [ ] Statistical analysis of AI performance
- [ ] Logging and replay of AI games

**Files to Create/Modify:**
- `src/core/simulation/testing/aiVsAiTests.ts` (exists, needs enhancement)
- `src/core/simulation/analysis/metaTester.ts` (exists)
- `src/core/simulation/analysis/matchupAnalyzer.ts` (exists)

### 3.4 AI Engine Next Steps & Milestones
**Immediate Next Steps:**
- [ ] Finalize and tune all strategic AI personalities (Aggressive, Control, Midrange, Combo)
- [ ] Expand AI action evaluation for advanced tactics (bluffing, multi-turn planning)
- [ ] Integrate AI difficulty scaling and user configuration
- [ ] Complete AI vs AI batch simulation and statistical reporting
- [ ] Enhance logging and replay for AI decision transparency

**Milestones:**
- [ ] All AI personalities pass scenario-based integration tests
- [ ] AI vs AI test suite produces actionable performance metrics
- [ ] User-selectable AI difficulty and personality in UI
- [ ] Documentation for AI engine and strategy design

**Phase 3 Status Update:**
- Core AI framework and basic personalities are implemented and tested
- Strategic tuning, advanced tactics, and analysis tools are in progress
- AI vs AI simulation and reporting are the final deliverables for this phase

---

## Phase 4: Web UI Foundation (Weeks 9-11)

### 4.1 Game Board Visualization
**Priority: Critical**
- [ ] 5x4 grid representation
- [ ] Card rendering and animations
- [ ] Drag-and-drop interactions
- [ ] Zoom and pan controls

**Files to Create/Modify:**
- `src/web/components/GameBoard.ts` (new)
- `src/web/components/GridCell.ts` (new)
- `src/web/components/CardComponent.ts` (new)
- `src/web/utils/boardRenderer.ts` (new)

### 4.2 Game Controls
**Priority: High**
- [ ] Turn phase indicators
- [ ] Action buttons and menus
- [ ] Hand and deck viewers
- [ ] Game speed controls

**Files to Create/Modify:**
- `src/web/components/GameControls.ts` (new)
- `src/web/components/PhaseIndicator.ts` (new)
- `src/web/components/HandViewer.ts` (new)
- `src/web/components/SpeedControls.ts` (new)

### 4.3 Card Detail Views
**Priority: Medium**
- [ ] Card zoom and inspection
- [ ] Rules text formatting
- [ ] Interaction highlighting
- [ ] History and effect tracking

**Files to Create/Modify:**
- `src/web/components/CardDetail.ts` (new)
- `src/web/components/EffectHistory.ts` (new)
- `src/web/utils/cardFormatter.ts` (new)

### Phase 4 Deliverables
- Interactive game board
- Basic gameplay controls
- Card visualization system

**Phase 4 Status**: NOT STARTED

---

## Phase 5: Advanced UI Features (Weeks 12-14)

### 5.1 Game Analytics
**Priority: Medium**
- [ ] Real-time statistics
- [ ] Probability calculations
- [ ] Decision impact analysis
- [ ] Performance metrics

**Files to Create/Modify:**
- `src/web/components/AnalyticsPanel.ts` (new)
- `src/web/components/StatisticsView.ts` (new)
- `src/web/utils/probabilityCalculator.ts` (new)

### 5.2 Deck Testing Interface
**Priority: High**
- [ ] Deck import/export
- [ ] Batch simulation controls
- [ ] Results visualization
- [ ] Optimization suggestions

**Files to Create/Modify:**
- `src/web/components/DeckTester.ts` (new)
- `src/web/components/SimulationResults.ts` (new)
- `src/web/components/OptimizationPanel.ts` (new)

### 5.3 Learning & Tutorial System
**Priority: Low**
- [ ] Interactive tutorials
- [ ] Rule explanations
- [ ] Strategy guides
- [ ] Replay analysis

**Files to Create/Modify:**
- `src/web/components/TutorialSystem.ts` (new)
- `src/web/components/RuleExplainer.ts` (new)
- `src/web/components/ReplayViewer.ts` (new)

### Phase 5 Deliverables
- Complete analytics dashboard
- Deck testing workflow
- Educational features

**Phase 5 Status**: NOT STARTED

---

## Phase 6: Integration & Polish (Weeks 15-16)

### 6.1 Performance Optimization
**Priority: High**
- [ ] Simulation speed improvements
- [ ] UI rendering optimization
- [ ] Memory usage reduction
- [ ] Mobile responsiveness

### 6.2 Testing & Validation
**Priority: Critical**
- [ ] Comprehensive unit tests
- [ ] Integration test suites
- [ ] Performance benchmarks
- [ ] Rules compliance verification

### 6.3 Documentation & Deployment
**Priority: Medium**
- [ ] API documentation
- [ ] User guides
- [ ] Developer documentation
- [ ] Production deployment

### Phase 6 Deliverables
- Production-ready simulator
- Complete documentation
- Deployment pipeline

**Phase 6 Status**: NOT STARTED

---

## Phase 7: Future Enhancements (Post-MVP)

### 7.1 Multiplayer & Community Features
- [ ] Multiplayer online gameplay
- [ ] Tournament bracket system
- [ ] Community deck sharing
- [ ] Statistical analysis dashboard
- [ ] Mobile native apps
- [ ] VR/AR experimental interface

### 7.2 Advanced AI & Data Integration
- [ ] Advanced AI with machine learning
- [ ] Official Sorcery tournament data integration
- [ ] Card price tracking APIs
- [ ] Social media and community integration
- [ ] Video replay export

---

*Last Updated: May 25, 2025*
*Version: 1.1*
