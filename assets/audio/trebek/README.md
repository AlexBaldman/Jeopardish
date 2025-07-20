# Alex Trebek Audio Assets

This directory contains 262 audio files of Alex Trebek from Jeopardy (Wii version). These files were downloaded from 101soundboards.com on July 12, 2025.

## Audio Categories

The audio files are organized by type based on their filename patterns:

### Game Flow
- **Welcome**: `alex-welcome.mp3` - Game introduction
- **Intro**: `alx-intro-*.mp3` - Various introductions
- **Round Intros**: `alx-rnd-1-intro-*.mp3`, `alx-rnd-2-intro-*.mp3`
- **Round Outros**: `alx-rnd-1-outro-*.mp3`, `alx-rnd-2-outro-*.mp3`
- **Commercial Breaks**: `alx-comm-break-*.mp3`

### Player Interactions
- **Correct Responses**: `alx-player-correct-*.mp3`, `alx-correct-response-*.mp3`
- **Incorrect Responses**: `alx-player-incorrect-*.mp3`
- **Player Selection**: `alx-player-select-*.mp3`
- **Player Start**: `alx-player-start-*.mp3`
- **Back to Player**: `alx-back-to-player-*.mp3`

### Categories & Clues
- **Category Intros**: `alx-cat-intro-*.mp3`
- **Clue Instructions**: `alx-clue-instr-*.mp3`
- **Clue Crew**: `alx-clue-crew-*.mp3`

### Values
- **$200**: `alx-200-*.mp3`
- **$400**: `alx-400-*.mp3`
- **$600**: `alx-600-*.mp3`
- **$800**: `alx-800-*.mp3`
- **$1000**: `alx-1000-*.mp3`

### Daily Double
- **Daily Double**: `alx-dailyd-*.mp3`
- **DD Correct**: `alx-dailyd-cor-*.mp3`
- **DD Incorrect**: `alx-dailyd-incorrect-*.mp3`
- **DD Wagers**: `alx-dailyd-score-*.mp3`

### Final Jeopardy
- **Category**: `alx-final-cat-*.mp3`
- **Clue**: `alx-final-clue-*.mp3`
- **Wagers**: `alx-final-wager-*.mp3`, `alx-player-wager-*.mp3`
- **Responses**: `alx-final-player-resp-*.mp3`
- **Results**: `alx-final-correct-wager-*.mp3`, `alx-final-incorrect-wager-*.mp3`
- **Winner**: `alx-final-winner-*.mp3`
- **Thanks**: `alx-final-thanks-*.mp3`

### Wii Speak Features
- **Voice Commands**: `alx-wii-speak-*.mp3`
- **Can't Hear**: `alx-wii-speak-cant-hear-*.mp3`
- **Responses**: `alx-wii-speak-resp-*.mp3`

### Other
- **Scores**: `alx-score-ahead-*.mp3`, `alx-score-behind-*.mp3`
- **Wagers**: `alx-wager-max-*.mp3`, `alx-wager-min-*.mp3`
- **Control**: `alx-control-*.mp3`
- **Stats**: `alx-final-stats-*.mp3`

## Usage Ideas

1. **In-Game Sound Effects**
   - Use appropriate clips when players answer correctly/incorrectly
   - Play category introductions
   - Use value announcements ($200, $400, etc.)

2. **AI Voice Training**
   - Use these clips to train a voice synthesis model
   - Create a Trebek-style voice for dynamic responses

3. **Game Atmosphere**
   - Use intro/outro clips for authentic Jeopardy feel
   - Commercial break announcements for pauses

4. **Response Variations**
   - Multiple versions of correct/incorrect responses for variety
   - Different player selection prompts

## Implementation Example

```javascript
// Example usage in game
const audioAssets = {
  welcome: 'assets/audio/trebek/3019303-alex-welcome.mp3',
  correct: [
    'assets/audio/trebek/3018265-alx-player-correct.mp3',
    'assets/audio/trebek/3018370-alx-player-correct.mp3',
    'assets/audio/trebek/3019178-alx-player-correct.mp3'
  ],
  incorrect: [
    'assets/audio/trebek/3018774-alx-player-incorrect.mp3',
    'assets/audio/trebek/3018725-alx-player-incorrect.mp3'
  ],
  // ... more categories
};

// Play random correct response
function playCorrectSound() {
  const randomIndex = Math.floor(Math.random() * audioAssets.correct.length);
  const audio = new Audio(audioAssets.correct[randomIndex]);
  audio.play();
}
```

## Legal Notice

These audio files are property of their respective copyright holders. They are intended for educational and personal use only. Please respect copyright laws when using these assets.
