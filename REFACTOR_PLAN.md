# Jeopardish Refactoring Plan - Carmack Style

## Core Principles
1. **Simplicity over Cleverness** - Write code that's easy to understand
2. **Performance Matters** - But not at the expense of maintainability
3. **Data-Oriented Design** - Structure around data flow, not objects
4. **Minimize Dependencies** - Each module should be as independent as possible
5. **Test Everything** - If it's not tested, it's broken

## Module Structure

```
src/
├── core/               # Core game engine
│   ├── game.js        # Main game loop and state
│   ├── question.js    # Question/answer logic
│   ├── scoring.js     # Score calculation
│   └── validation.js  # Answer validation
│
├── services/          # External service interfaces
│   ├── api/          # API clients
│   │   ├── trivia.js # Trivia API abstraction
│   │   └── ai.js     # AI service abstraction
│   ├── storage/      # Data persistence
│   │   ├── local.js  # LocalStorage wrapper
│   │   └── firebase.js # Firebase abstraction
│   └── audio/        # Sound management
│       └── sounds.js
│
├── ui/               # UI components (framework-agnostic)
│   ├── components/   # Reusable UI components
│   │   ├── scoreboard.js
│   │   ├── question-display.js
│   │   ├── input-handler.js
│   │   └── host-avatar.js
│   ├── animations/   # Animation controllers
│   │   └── host-animations.js
│   └── themes/       # Theme management
│       └── theme-controller.js
│
├── state/            # State management
│   ├── store.js      # Central state store
│   ├── actions.js    # State actions/mutations
│   └── selectors.js  # State selectors
│
├── utils/            # Utility functions
│   ├── constants.js  # Game constants
│   ├── helpers.js    # Helper functions
│   └── validators.js # Input validators
│
└── main.js          # Application entry point
```

## Refactoring Steps

### Phase 1: Module Structure (Current)
- Create directory structure
- Set up module system with proper exports/imports
- Move existing code into appropriate modules

### Phase 2: Game Logic Refactoring
- Extract game logic from UI
- Create clean interfaces between modules
- Implement proper error handling

### Phase 3: State Management
- Implement centralized state store
- Create action/mutation system
- Add state persistence layer

### Phase 4: Component Architecture
- Convert UI to component-based system
- Add proper lifecycle management
- Implement efficient rendering

## Key Architectural Decisions

1. **No Framework (Initially)** - We'll build vanilla JS components first, making it easy to migrate to any framework later
2. **Event-Driven Architecture** - Components communicate via events, not direct calls
3. **Immutable State** - State changes create new objects, never mutate
4. **Functional Core** - Business logic is pure functions where possible
5. **Imperative Shell** - UI and side effects at the edges

## Performance Considerations

1. **Lazy Loading** - Load features only when needed
2. **Request Batching** - Minimize API calls
3. **Efficient DOM Updates** - Update only what changes
4. **Memory Management** - Clean up resources properly

## Testing Strategy

1. **Unit Tests** - For all pure functions
2. **Integration Tests** - For API and storage layers
3. **Component Tests** - For UI components
4. **E2E Tests** - For critical user flows
