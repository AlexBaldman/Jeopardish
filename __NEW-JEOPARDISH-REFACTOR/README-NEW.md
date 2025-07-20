# Jeopardish: A Trivia Game Done Right

*"Focus is a matter of deciding what things you're not going to do." - John Carmack*

## What This Is

Jeopardish is a trivia game. It asks questions, validates answers, keeps score. That's the core. Everything else - the AI host, the animations, the leaderboards - those are features that enhance the core experience without compromising it.

This isn't a framework. It's not a platform. It's a game that does one thing exceptionally well: deliver an engaging trivia experience.

## Core Features

### The Essentials
- **Question/Answer Engine**: Pulls from JService API, manages question flow
- **Score System**: Tracks points, streaks, and statistics
- **Answer Validation**: Smart matching that handles variations
- **State Management**: Predictable, debuggable game state

### The Enhancements
- **AI Host**: Dynamic responses from an AI-powered Alex Trebek
- **Sound Effects**: Audio feedback for game events
- **Animations**: Smooth transitions that don't compromise performance
- **Persistence**: Local storage for scores and preferences
- **Themes**: Light/dark mode that respects user preference

## Technical Architecture

*"The code is more what you'd call guidelines than actual rules." - But not here. Here, principles matter.*

### Core Principles

1. **Data First**: Get your data structures right, and the code almost writes itself
2. **Pure Functions**: Side effects are bugs waiting to happen
3. **Explicit State**: No hidden state, no magic, everything is trackable
4. **Performance Through Simplicity**: Fast code is simple code
5. **Minimal Dependencies**: Every dependency is a liability

### Directory Structure

```
jeopardish/
├── index.html              # Minimal HTML shell
├── src/
│   ├── main.js            # Bootstrap the app
│   ├── core/              # Game logic (pure functions)
│   │   ├── game.js        # Game state machine
│   │   ├── question.js    # Question management
│   │   ├── scoring.js     # Score calculation
│   │   └── validation.js  # Answer validation
│   ├── state/             # State management
│   │   ├── store.js       # Simple Redux-like store
│   │   ├── actions.js     # Action creators
│   │   ├── reducers.js    # Pure reducers
│   │   └── selectors.js   # Memoized queries
│   ├── components/        # UI components
│   │   ├── App.js         # Root component
│   │   ├── GameBoard.js   # Main game area
│   │   ├── QuestionDisplay.js
│   │   ├── ScoreBoard.js
│   │   └── GameControls.js
│   ├── services/          # External integrations
│   │   ├── api.js         # Question API
│   │   ├── ai.js          # AI Trebek
│   │   └── storage.js     # Persistence
│   └── utils/             # Helpers
│       ├── constants.js
│       └── helpers.js
├── assets/                # Static files
├── tests/                 # Test suite
└── docs/                  # Documentation
```

### State Shape

```javascript
{
  game: {
    status: 'idle' | 'playing' | 'answered' | 'gameover',
    currentQuestion: { question, answer, value, category },
    score: number,
    streak: number,
    questionsAnswered: number
  },
  user: {
    preferences: { theme, sound, difficulty },
    statistics: { topScore, totalGames, correctAnswers }
  },
  ui: {
    modal: null | 'settings' | 'stats' | 'help',
    loading: boolean,
    error: null | string
  }
}
```

### Data Flow

```
User Input → Action → Reducer → State → Selectors → Components → DOM
     ↑                                                               ↓
     └─────────────────── Event ←───────────────────────────────────┘
```

## Performance Metrics

- **Initial Load**: < 1 second
- **Time to Interactive**: < 1.5 seconds
- **Bundle Size**: < 100KB gzipped
- **Runtime Performance**: 60fps animations
- **Memory Usage**: < 50MB after 1 hour of play

## Development Setup

```bash
# Clone and enter directory
git clone [repo-url]
cd jeopardish

# Install minimal dependencies
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build

# Run tests
npm test
```

### Environment Variables

```bash
# .env.local
VITE_GEMINI_API_KEY=your_api_key_here  # For AI Trebek
VITE_API_BASE_URL=https://jservice.io  # Question API
```

## Code Standards

### JavaScript
- ES6+ modules
- No classes for logic (functions only)
- Components can be classes or functions
- Explicit imports (no barrels)
- JSDoc for public APIs

### CSS
- CSS custom properties for theming
- BEM naming for components
- Mobile-first responsive design
- No CSS-in-JS (performance)

### Testing
- Unit tests for all game logic
- Integration tests for state management
- E2E tests for critical user paths
- No testing implementation details

## Why These Choices?

**No React/Vue/Angular**: For a game this size, they add complexity without proportional benefit. Vanilla JS with a simple state management pattern gives us full control and better performance.

**Custom State Management**: Redux is great, but we only need 10% of it. Our implementation is ~50 lines and does exactly what we need.

**Minimal Build Tools**: Vite gives us ES modules, hot reload, and optimized builds without configuration hell.

**Pure Functions**: Makes testing trivial, debugging straightforward, and reasoning about code simple.

## Contributing

Before contributing, ask yourself:
1. Does this make the game better for players?
2. Does this make the code simpler?
3. Is this the minimal solution?

If yes to all three, we want your contribution.

### Guidelines
- One feature per PR
- Tests for new logic
- No breaking changes without discussion
- Performance benchmarks for UI changes

## License

MIT - Use it, learn from it, make it better.

---

*"It's done when it's done, but it's only good when it's simple."*

*Built with focus, maintained with discipline, enjoyed by thousands.*
