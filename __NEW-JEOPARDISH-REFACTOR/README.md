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

## Architecture

### Core Principles

1. **Functional Programming**: Pure functions, immutable state, no side effects.
2. **Separation of Concerns**: Defined boundaries between state, UI, and business logic.
3. **Performance Optimization**: Efficient rendering, memoization, minimal DOM manipulation.
4. **Simplicity and Elegance**: Minimal abstractions for clear, understandable data flow.

### Directory Structure

```
jeopardish/
├── index.html              # Entry point HTML
├── main.js                 # Application bootstrap
├── components/             # UI Components
│   ├── App.js              # Root component
│   ├── ScoreBoard.js       # Score display
│   ├── QuestionDisplay.js  # Question/answer display
│   └── GameControls.js     # User interaction controls
├── core/                   # Core game logic
│   ├── game.js
│   ├── scoring.js
├── state/                  # State management
│   ├── store.js
│   ├── actions.js
│   └── reducers.js
├── utils/                  # Utilities
│   ├── selectors.js
│   ├── constants.js
├── services/               # Business logic
├── styles/                 # Styling
├── docs/                   # Documentation
└── tests/                  # Testing
```

### Key Components

- **State Management**: Custom Redux-like pattern with time-travel debugging.
- **Event System**: Decoupled communication through a central event bus.
- **Component Architecture**: Pure, stateless components driven by immutable data.

### Development Guidelines

- **Code Style**: Adhere to principles of purity, immutability, and explicitness.
- **Testing**: Comprehensive tests for all critical paths and edge cases.
- **Documentation**: Keep all records up-to-date and aligned with changes.

## Setup Instructions

1. **Clone the repository**.
2. **Install dependencies**: Run `npm install`.
3. **Configure the environment**: Create a `.env.local` file and add your API keys.
4. **Run Development Server**: Use `npm start`.
5. **Build for Production**: Execute `npm run build`.

## Contribution Guidelines

Contributions are welcome! Please follow the existing coding standards, provide clear commit messages, and ensure all tests pass before submitting a pull request.

---

*This README reflects a passion project aimed at delivering an engaging, high-quality trivia experience. By following these guidelines, we can build a robust platform that brings joy to trivia enthusiasts worldwide.*

