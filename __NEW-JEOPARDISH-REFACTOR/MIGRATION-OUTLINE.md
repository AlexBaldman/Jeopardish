# Jeopardish Migration Outline - Carmack Style

**Created:** 2025-01-18  
**Author:** John Carmack (channeled through AI)  
**Status:** Ready for Implementation

## Philosophy

"The best architecture is no architecture. The second best is one that gets out of your way." 

We're going to strip this down to its essence. No cruft, no legacy baggage, just clean, functional code that does exactly what it needs to do.

## What We're Building

A trivia game that:
1. Loads questions from an API
2. Manages game state predictably
3. Renders UI efficiently
4. Integrates AI for personality
5. Handles user authentication (optional)
6. Tracks scores and statistics

## Core Directory Structure

```
jeopardish/
├── index.html                    # Single entry point, minimal markup
├── package.json                  # Minimal dependencies
├── vite.config.js               # Build configuration
├── src/
│   ├── main.js                  # Bootstrap and wire everything
│   ├── core/                    # Game logic - the beating heart
│   │   ├── game.js              # Game state machine
│   │   ├── question.js          # Question fetching and management
│   │   ├── scoring.js           # Score calculation logic
│   │   └── validation.js        # Answer validation
│   ├── state/                   # State management - simple Redux-like
│   │   ├── store.js             # The store itself
│   │   ├── actions.js           # Action creators
│   │   ├── reducers.js          # Pure state transformations
│   │   └── selectors.js         # Memoized state queries
│   ├── components/              # UI components - pure functions
│   │   ├── App.js               # Root component
│   │   ├── GameBoard.js         # Main game display
│   │   ├── QuestionDisplay.js   # Question/answer rendering
│   │   ├── ScoreBoard.js        # Score display
│   │   ├── GameControls.js      # User inputs
│   │   └── Modal.js             # Reusable modal component
│   ├── services/                # External integrations
│   │   ├── api.js               # JService API client
│   │   ├── ai.js                # AI Trebek integration
│   │   ├── audio.js             # Sound effects
│   │   └── storage.js           # Local storage persistence
│   ├── utils/                   # Pure utility functions
│   │   ├── constants.js         # Game constants
│   │   ├── helpers.js           # Helper functions
│   │   └── events.js            # Event bus (if needed)
│   └── styles/                  # Minimal, functional CSS
│       ├── main.css             # Core styles
│       ├── components.css       # Component-specific styles
│       └── themes.css           # Theme variables
├── assets/                      # Static assets
│   ├── images/                  # Optimized images
│   ├── audio/                   # Sound files
│   └── fonts/                   # Custom fonts
├── tests/                       # Test files mirroring src/
└── docs/                        # Documentation
    └── architecture.md          # This architecture, evolved
```

## Files to Migrate

### Essential Core Files (Priority 1)
```
FROM CURRENT:
src/core/game.js              → src/core/game.js
src/core/question.js          → src/core/question.js  
src/core/scoring.js           → src/core/scoring.js
src/core/validation.js        → src/core/validation.js
src/state/store.js            → src/state/store.js
src/state/actions.js          → src/state/actions.js
src/state/reducer.js          → src/state/reducers.js
src/state/selectors.js        → src/state/selectors.js
src/utils/constants.js        → src/utils/constants.js
src/utils/helpers.js          → src/utils/helpers.js
src/utils/validators.js       → src/utils/helpers.js (merge)
```

### UI Components (Priority 2)
```
FROM CURRENT:
src/ui/components/App.js              → src/components/App.js
src/ui/components/QuestionDisplay.js  → src/components/QuestionDisplay.js
src/ui/components/ScoreBoard.js       → src/components/ScoreBoard.js
src/ui/components/GameControls.js     → src/components/GameControls.js
src/ui/components/Modal.js            → src/components/Modal.js
```

### Services (Priority 3)
```
FROM CURRENT:
src/services/api/questionService.js   → src/services/api.js
src/ai/trebek.js                     → src/services/ai.js
src/services/soundManager.js         → src/services/audio.js
src/state/persistence.js             → src/services/storage.js
```

### Build Configuration
```
FROM CURRENT:
package.json                  → package.json (cleaned up)
vite.config.js               → vite.config.js
jest.config.js               → jest.config.js
index.html                   → index.html (simplified)
```

### Assets to Keep
```
fonts/Korinna.woff2
fonts/KorinnaBold.woff2
images/trebek/*.png (select best ones)
images/title/title-Jeopardish!.png
assets/audio/trebek/*.mp3 (curated selection)
```

### Documentation
```
docs/ARCHITECTURE.md         → docs/architecture.md (updated)
docs/development-journal/    → docs/development-journal/ (selected entries)
```

## What We're NOT Migrating

### Leave Behind:
- All backup folders
- Old project planning documents (keep in archive)
- Duplicate/redundant services (3 different sound managers!)
- Test HTML files
- Old CSS files (we'll write fresh, minimal CSS)
- Firebase config (can add back later if needed)
- Multiple AI provider experiments
- Legacy compatibility bridges
- jQuery/old framework code

### Consolidate:
- Merge multiple sound managers into one
- Combine validation utilities
- Unify modal implementations
- Merge duplicate component versions

## Implementation Order

### Phase 1: Foundation (Day 1)
1. Create directory structure
2. Set up build tooling (package.json, vite.config.js)
3. Create minimal index.html
4. Bootstrap main.js

### Phase 2: Core Logic (Day 2)
1. Migrate core game logic
2. Set up state management
3. Wire up basic data flow
4. Add minimal styling

### Phase 3: UI Components (Day 3)
1. Build component architecture
2. Create main game components
3. Add interactivity
4. Test game flow

### Phase 4: Services (Day 4)
1. Integrate API service
2. Add AI capabilities
3. Implement sound
4. Add persistence

### Phase 5: Polish (Day 5)
1. Optimize performance
2. Add remaining features
3. Write tests
4. Update documentation

## Key Principles

1. **No Premature Abstraction**: Don't create abstractions until you need them
2. **Data First**: Get the data structures right, code follows
3. **Pure Functions**: Prefer pure functions everywhere possible
4. **Explicit Over Implicit**: Clear data flow, no magic
5. **Performance Matters**: But clarity matters more
6. **Test What Matters**: Core logic gets tests, UI can wait

## Migration Commands

```bash
# Create new project structure
mkdir -p jeopardish-clean/src/{core,state,components,services,utils,styles}
mkdir -p jeopardish-clean/{assets/{images,audio,fonts},tests,docs}

# Copy essential files
cp index.html jeopardish-clean/
cp package.json jeopardish-clean/
cp vite.config.js jeopardish-clean/

# Copy core logic
cp -r src/core/*.js jeopardish-clean/src/core/
cp -r src/state/*.js jeopardish-clean/src/state/
cp -r src/utils/{constants,helpers,validators}.js jeopardish-clean/src/utils/

# Copy select assets
cp fonts/Korinna*.woff2 jeopardish-clean/assets/fonts/
cp images/title/title-Jeopardish!.png jeopardish-clean/assets/images/
```

## Success Criteria

1. **It Works**: Game loads, plays, scores correctly
2. **It's Fast**: Sub-second load time, 60fps animations
3. **It's Maintainable**: New developer can understand in 30 minutes
4. **It's Testable**: Core logic has 90%+ coverage
5. **It's Fun**: The soul of the game remains intact

## Final Thoughts

"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away."

We're not building a framework. We're not preparing for every possible future. We're building a game that works, works well, and is a joy to maintain. Everything else is noise.

Let's build something we can be proud of.

---

*Ready to execute. The path is clear. Time to code.*
