# Jeopardish Architecture Overview

## Table of Contents
1. [Introduction](#introduction)
2. [Core Principles](#core-principles)
3. [Architecture Overview](#architecture-overview)
4. [Directory Structure](#directory-structure)
5. [State Management](#state-management)
6. [Event System](#event-system)
7. [Component Architecture](#component-architecture)
8. [Data Flow](#data-flow)
9. [Performance Considerations](#performance-considerations)
10. [Development Guidelines](#development-guidelines)

## Introduction

Jeopardish is a Jeopardy-style trivia game built with vanilla JavaScript, following John Carmack's principles of clean, functional programming. The architecture emphasizes immutability, pure functions, and strict separation of concerns.

## Core Principles

Based on Carmack's methodology, the architecture follows these principles:

1. **Functional Programming**: Pure functions, immutable state, no side effects
2. **Separation of Concerns**: Clear boundaries between state, UI, and business logic
3. **Predictability**: Deterministic state updates, time-travel debugging capability
4. **Performance**: Memoization, efficient re-renders, minimal DOM manipulation
5. **Simplicity**: No external frameworks, minimal abstractions, clear data flow

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                          Browser                             │
├─────────────────────────────────────────────────────────────┤
│                      index.html                              │
│                          │                                   │
│                      main.js                                 │
│                          │                                   │
├──────────────┬───────────┴───────────┬──────────────────────┤
│              │                       │                       │
│         State Store             Event Bus              Components │
│              │                       │                       │
│   ┌──────────────────┐    ┌─────────────────┐    ┌─────────────┐
│   │ State Management │    │ Event Dispatcher │    │     App     │
│   │   - getState()   │◄───┤   - dispatch()   │    │      │      │
│   │   - subscribe()  │    │   - subscribe()  │    │ ScoreBoard  │
│   │   - dispatch()   │    └─────────────────┘    │      │      │
│   └──────────────────┘                           │ QuestionDisplay│
│              │                                    │      │      │
│   ┌──────────────────┐                           │ GameControls│
│   │    Selectors     │                           └─────────────┘
│   │  - memoized      │                                   │
│   │  - computed      │                                   │
│   └──────────────────┘                                   │
│              │                                           │
│   ┌──────────────────┐                                   │
│   │    Reducers      │◄──────────────────────────────────┘
│   │  - pure          │
│   │  - immutable     │
│   └──────────────────┘
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
jeopardish/
├── index.html              # Entry point HTML
├── main.js                 # Application bootstrap
├── style.css               # Global styles
├── components/             # UI Components
│   ├── App.js              # Root component
│   ├── ScoreBoard.js       # Score display
│   ├── QuestionDisplay.js  # Question/answer display
│   └── GameControls.js     # User interaction controls
├── utils/                  # Core utilities
│   ├── store.js            # State management
│   ├── events.js           # Event system
│   └── selectors.js        # Memoized state selectors
├── state/                  # State management
│   ├── actions.js          # Action creators
│   └── reducers.js         # State reducers
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md     # This file
│   └── API.md              # API documentation
└── tests/                  # Test files
```

## State Management

### Store Architecture

The store follows Redux-like patterns without the framework overhead:

```javascript
// State Shape
{
  game: {
    score: number,
    currentQuestion: {
      question: string,
      answer: string,
      value: number,
      category: string
    } | null,
    isLoading: boolean,
    showAnswer: boolean,
    userAnswer: string,
    lastResult: 'correct' | 'incorrect' | null
  }
}
```

### Key Features

1. **Immutable Updates**: All state changes create new objects
2. **Time-Travel Debugging**: State history maintained for debugging
3. **Predictable Updates**: Pure reducer functions
4. **Subscription System**: Components subscribe to specific state slices

### Actions

Actions are plain objects with a type and optional payload:

```javascript
{
  type: 'SET_SCORE',
  payload: { score: 200 }
}
```

## Event System

The event bus provides decoupled communication between components:

### Features

1. **Type-Safe Events**: Predefined event types
2. **Loose Coupling**: Components don't need direct references
3. **Debugging**: Event logging and history
4. **Performance**: Efficient listener management

### Event Flow

```
User Action → Component → Event Bus → Store → State Update → Component Re-render
```

## Component Architecture

### Component Principles

1. **Pure Functions**: Components are pure functions of props
2. **No Internal State**: All state managed by store
3. **Event-Driven**: User interactions dispatch events
4. **Focused Responsibility**: Each component has one job

### Component Hierarchy

```
App
├── ScoreBoard
│   └── (displays score, subscribes to score changes)
├── QuestionDisplay
│   └── (shows question/answer, subscribes to question state)
└── GameControls
    └── (handles user input, dispatches actions)
```

### Component Lifecycle

1. **Mount**: Subscribe to store, render initial state
2. **Update**: Re-render on state changes
3. **Unmount**: Unsubscribe from store

## Data Flow

### Unidirectional Data Flow

```
Action → Reducer → Store → Selectors → Components → Events → Actions
```

### Example: Answering a Question

1. User types answer in GameControls
2. GameControls dispatches UPDATE_USER_ANSWER action
3. Reducer updates state.game.userAnswer
4. Store notifies subscribers
5. Components re-render with new state
6. User submits answer
7. GameControls dispatches SUBMIT_ANSWER action
8. Reducer evaluates answer, updates score
9. Components reflect new score/result

## Performance Considerations

### Memoization

- Selectors use WeakMap-based memoization
- Prevents unnecessary recalculations
- Components only re-render on relevant state changes

### DOM Optimization

- Minimal DOM manipulation
- Efficient event delegation
- RequestAnimationFrame for animations

### Memory Management

- Proper cleanup of event listeners
- WeakMap for memoization (automatic GC)
- Bounded state history for time-travel

## Development Guidelines

### Code Style

1. **Pure Functions**: Prefer pure functions everywhere
2. **Immutability**: Never mutate state directly
3. **Type Safety**: Use JSDoc comments for type hints
4. **Error Handling**: Fail gracefully, log errors
5. **Testing**: Write testable, isolated functions

### Adding New Features

1. Define state shape changes
2. Create new actions/action creators
3. Update reducers (pure functions)
4. Create/update selectors if needed
5. Build/update components
6. Add tests

### Debugging

1. Use Redux DevTools Extension support
2. Check event bus logs
3. Inspect state history
4. Use performance profiler for bottlenecks

### Best Practices

1. **Single Responsibility**: Each module does one thing
2. **Composition over Inheritance**: Use function composition
3. **Explicit over Implicit**: Clear data flow
4. **Performance**: Measure before optimizing
5. **Documentation**: Update docs with code changes

## Future Considerations

### Planned Enhancements

1. **WebSocket Support**: Real-time multiplayer
2. **Service Worker**: Offline capability
3. **IndexedDB**: Persistent state
4. **Web Components**: Encapsulated components
5. **Module Federation**: Micro-frontend support

### Scalability

The architecture supports:
- Multiple game modes
- Plugin system for extensions
- Theming and customization
- Internationalization
- Analytics integration

## Conclusion

The Jeopardish architecture provides a solid foundation for a maintainable, performant, and extensible application. By following Carmack's principles and maintaining strict architectural boundaries, the codebase remains clean, testable, and easy to understand.
