# Feature Wishlist

**Created:** 2025-01-04  
**Updated:** 2025-01-04  
**Author:** The Architect (AI)  
**Status:** Active  

## Summary

This document contains feature ideas and enhancements for the Jeopardish project, organized by category.

## 🎯 Priority Features

### 1. Scoreboard Enhancements

#### Flip Clock Style Scoreboard
- **Description**: Transform the scoreboard into an old-school flip clock design
- **Details**: 
  - Animated flipping panels like vintage alarm clocks
  - Satisfying animation when numbers change
  - Retro aesthetic matching game theme
- **Priority**: High
- **Complexity**: Medium

#### Score Change Animations
- **Description**: Add alternate animations for score changes
- **Details**:
  - Multiple animation styles to choose from
  - Smooth transitions for digit changes
  - Visual feedback for score increases/decreases
- **Priority**: Medium
- **Complexity**: Low

### 2. Event Ticker System

#### Comedy Ticker
- **Description**: Scrolling ticker with humorous commentary
- **Details**:
  - Stock ticker style animation at bottom of screen
  - Comedic messages based on game events:
    - Negative events: "Wow, this guy is garbage", "Do you have a brain injury?"
    - Positive events: "He's heating up!" (NBA Jam style)
    - Random humor: Norm MacDonald-esque one-liners and puns
  - JSON file with categorized messages
  - Triggered by game events or randomly
- **Priority**: High
- **Complexity**: Medium

## 🎨 UI/UX Enhancements

### 3. Host Animations

#### Smoke Animation
- **Description**: Animate smoke from Trebek's joint
- **Details**:
  - CSS/JS animation at random intervals
  - Subtle particle effect
  - Adds personality to the host
- **Priority**: Low
- **Complexity**: Medium

#### Dynamic Host Movements
- **Description**: Various host animations
- **Details**:
  - Sidle off edge of screen
  - Hide below screen, pop up with "Boo!" or "Surprise!"
  - Other silly phrases and movements
- **Priority**: Medium
- **Complexity**: Medium

### 4. Host Interactivity

#### Cycle Through Host Images
- **Description**: Click to change host appearance
- **Details**:
  - Click right side of title image to cycle forward
  - Click left side to cycle backward
  - Automatically scan `images/trebek/` folder
  - Include all images directly in folder (not subfolders)
  - Currently multiple versions are commented out in code
- **Priority**: High
- **Complexity**: Low

### 5. Responsive Design Fixes

#### Speech Bubble Triangle
- **Description**: Fix speech bubble triangle on mobile
- **Details**:
  - Currently disappears at 770px width and below
  - Should move to center of bubble instead
  - Prevents clash with Trebek image
- **Priority**: High
- **Complexity**: Low

## 🤖 AI Integration

### 6. Enhanced AI Responses
- **Description**: Expand AI-generated responses
- **Details**:
  - System prompt defining Trebek's personality
  - Various response types for different game events
  - Maintain character consistency
- **Priority**: Medium
- **Complexity**: High

## 📋 Implementation Notes

### File Organization Issues
- **Note**: Many files/folders in project directory are unused
- **Action Required**:
  - Remove or archive unused files
  - Add clear documentation about active files
  - Check index.html for actual imports
  - Note that individual CSS files are not currently used (all in styles.css)
  - Plan to refactor into separate concerns when ready

### Easter Eggs
- Host cycling could remain as a fun easter egg in final version
- Hidden animations and responses for specific triggers

## 🚀 Future Considerations

1. **Modular CSS Architecture**
   - Split styles.css into component files
   - Only after main functionality is stable

2. **Animation Library**
   - Consider using animation library for complex effects
   - Maintain performance on mobile devices

3. **Event System**
   - Centralized event system for triggering animations
   - Makes ticker and animations easier to coordinate

## 📊 Feature Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Host Image Cycling | High | Low | P1 |
| Comedy Ticker | High | Medium | P1 |
| Speech Bubble Fix | Medium | Low | P1 |
| Flip Clock Scoreboard | High | Medium | P2 |
| Host Animations | Medium | Medium | P3 |
| Smoke Effect | Low | Medium | P4 |

---

*This wishlist is actively maintained. Add new ideas as they arise and update priorities based on user feedback and development progress.*
