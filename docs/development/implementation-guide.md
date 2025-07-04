# Jeopardish - Implementation Guide

## Quick Start Guide

This guide provides practical steps to begin implementing the improvements outlined in the architecture analysis and development roadmap.

## Priority 1: Immediate Refactoring (Week 1)

### Step 1: Create Project Structure

```bash
# Create the new directory structure
mkdir -p src/{components,services,store,utils,assets,styles,ai,auth}
mkdir -p src/assets/{images,fonts,sounds}
mkdir -p src/components/{game,ui,modals}
mkdir -p src/services/{api,database,auth}
```

### Step 2: Set Up Build System

Create a `vite.config.js` file:

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@store': resolve(__dirname, './src/store'),
      '@utils': resolve(__dirname, './src/utils'),
    },
  },
});
```

Install dependencies:
```bash
npm install --save-dev vite
npm install --save-dev @vitejs/plugin-legacy
```

### Step 3: Modularize Existing Code

Start by breaking down `app.js` into modules:

1. **Game State Module** (`src/store/gameState.js`):
```javascript
// Game state management
export const gameState = {
  currentScore: 0,
  currentStreak: 0,
  bestScore: 0,
  bestStreak: 0,
  currentQuestion: null,
  answerWasRevealed: false,
  showingMessage: false,
};

export function updateScore(points) {
  gameState.currentScore += points;
  if (gameState.currentScore > gameState.bestScore) {
    gameState.bestScore = gameState.currentScore;
  }
}

export function updateStreak(correct) {
  if (correct) {
    gameState.currentStreak++;
    if (gameState.currentStreak > gameState.bestStreak) {
      gameState.bestStreak = gameState.currentStreak;
    }
  } else {
    gameState.currentStreak = 0;
  }
}
```

2. **Question Service** (`src/services/api/questionService.js`):
```javascript
// Question fetching and management
const API_URL = 'https://cluebase.lukelav.in/clues/random';

export async function fetchQuestionFromAPI() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

export async function loadLocalQuestions() {
  // Implementation for loading local questions
}
```

3. **UI Components** (`src/components/ui/ScoreBoard.js`):
```javascript
// Scoreboard component
export class ScoreBoard {
  constructor(elementId) {
    this.element = document.getElementById(elementId);
    this.init();
  }

  init() {
    // Initialize scoreboard
  }

  update(score, streak, bestScore, bestStreak) {
    // Update scoreboard display
  }
}
```

## Priority 2: Testing Infrastructure (Week 2)

### Step 1: Set Up Jest

Install testing dependencies:
```bash
npm install --save-dev jest @testing-library/jest-dom
npm install --save-dev @babel/preset-env babel-jest
```

Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
  ],
};
```

### Step 2: Write Initial Tests

Example test for game state (`src/store/__tests__/gameState.test.js`):
```javascript
import { gameState, updateScore, updateStreak } from '../gameState';

describe('Game State', () => {
  beforeEach(() => {
    // Reset state before each test
    gameState.currentScore = 0;
    gameState.currentStreak = 0;
  });

  test('updateScore should increase score', () => {
    updateScore(200);
    expect(gameState.currentScore).toBe(200);
  });

  test('updateStreak should reset on incorrect answer', () => {
    updateStreak(true);
    updateStreak(true);
    expect(gameState.currentStreak).toBe(2);
    
    updateStreak(false);
    expect(gameState.currentStreak).toBe(0);
  });
});
```

## Priority 3: AI Enhancement (Week 3)

### Step 1: Create AI Configuration

Create `src/ai/config.js`:
```javascript
export const AI_CONFIG = {
  apiKey: process.env.GOOGLE_AI_API_KEY,
  model: 'gemini-1.5-pro',
  personality: {
    tone: 'professional yet warm',
    humor: 'dry wit',
    encouragement: 'high',
  },
  responseTypes: {
    greeting: {
      temperature: 0.7,
      maxTokens: 100,
    },
    correct: {
      temperature: 0.8,
      maxTokens: 80,
    },
    incorrect: {
      temperature: 0.7,
      maxTokens: 120,
    },
  },
};
```

### Step 2: Enhance AI Personality

Create `src/ai/personalityManager.js`:
```javascript
export class PersonalityManager {
  constructor(config) {
    this.config = config;
    this.context = [];
  }

  addContext(interaction) {
    this.context.push(interaction);
    // Keep only last 10 interactions
    if (this.context.length > 10) {
      this.context.shift();
    }
  }

  generatePrompt(type, data) {
    // Generate contextual prompts based on personality and history
    const basePrompt = this.getBasePrompt(type);
    const contextPrompt = this.getContextPrompt();
    return `${basePrompt}\n\n${contextPrompt}\n\n${JSON.stringify(data)}`;
  }
}
```

## Priority 4: Performance Optimization (Week 4)

### Step 1: Implement Code Splitting

Update `vite.config.js` for code splitting:
```javascript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        'ai': ['@genkit-ai/googleai'],
      },
    },
  },
},
```

### Step 2: Implement Lazy Loading

Example of lazy loading AI module:
```javascript
// Lazy load AI features
let aiTrebek = null;

async function initializeAI() {
  if (!aiTrebek) {
    const { GeminiTrebek } = await import('./ai/geminiTrebek.js');
    aiTrebek = new GeminiTrebek();
  }
  return aiTrebek;
}
```

## Working with Sub-Agents

### Example Workflow

1. **Starting a new feature with The Architect**:
```bash
# In Warp terminal
"I want you to act as The Architect for the Jeopardish project. I need to design a new multiplayer feature. The current architecture is client-side only. How should I structure this new feature?"
```

2. **Implementing UI with The Frontend Wizard**:
```bash
# In Warp terminal
"I want you to act as The Frontend Wizard for the Jeopardish project. I need to create a responsive game lobby UI for the multiplayer feature. Here's the current UI structure: [provide context]"
```

3. **Optimizing with The Performance Optimizer**:
```bash
# In Warp terminal
"I want you to act as The Performance Optimizer for the Jeopardish project. The initial bundle size is 700KB. Help me identify and fix performance bottlenecks."
```

## CI/CD Setup

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build
      run: npm run build
      
    - name: Run linter
      run: npm run lint
```

## Monitoring and Analytics

### Set Up Analytics

Create `src/services/analytics.js`:
```javascript
export class Analytics {
  constructor() {
    this.events = [];
  }

  track(event, properties) {
    const analyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
      userId: this.getUserId(),
    };
    
    this.events.push(analyticsEvent);
    this.sendToAnalytics(analyticsEvent);
  }

  sendToAnalytics(event) {
    // Send to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
  }
}
```

## Best Practices

1. **Code Reviews**: Every PR should be reviewed by at least one team member
2. **Testing**: Maintain at least 80% code coverage
3. **Documentation**: Update documentation with every feature
4. **Performance**: Run performance audits before major releases
5. **Security**: Regular security audits and dependency updates

## Getting Help

When stuck, use the appropriate sub-agent:
- Architecture questions → The Architect
- UI implementation → The Frontend Wizard
- Performance issues → The Performance Optimizer
- Testing strategy → The Testing Guru

Remember to provide context about your current implementation and specific challenges when consulting with sub-agents.
