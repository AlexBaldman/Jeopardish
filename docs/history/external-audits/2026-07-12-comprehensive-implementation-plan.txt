# JeoPARODY Comprehensive Implementation Plan

**Document Version:** 1.0  
**Created:** 2026-07-26  
**Status:** Ready for Agent Review and Implementation  
**Estimated Timeline:** 6-8 weeks for full implementation  

---

## Overview

This document provides a comprehensive, step-by-step implementation plan for addressing all identified issues across architecture, CSS/styling, UI/UX, and the host animation system. Each section includes specific actionable steps, verification criteria, and dependencies.

**Implementation Principles:**
- Follow Carmack's principles: simple solutions, direct DOM manipulation, no complex abstractions
- Maintain backward compatibility where possible
- Add tests alongside implementation
- Commit frequently with clear, atomic changes
- Verify each step before proceeding to the next

---

## Phase 1: Critical Architecture Fixes (Week 1-2)

### 1.1 Resolve Dual Initialization Problem

**Issue:** Both `GameEngine.js` and UI code handle question loading, creating race conditions.

**Steps:**

1. **Audit current question loading paths**
   - File: `src/core/GameEngine.js`
   - File: `src/init/ui.js`
   - File: `src/core/controller.js`
   - Action: Search for all instances of question loading logic
   - Output: Document all current question loading entry points

2. **Establish single question flow owner**
   - File: `src/core/GameEngine.js`
   - Action: Make GameEngine the sole owner of question selection
   - Changes:
     - Remove question loading from UI components
     - Add `selectQuestion()` method to GameEngine
     - Emit `question:selected` event after selection
   - Verification: Only one question loading path exists

3. **Update UI to emit intent only**
   - File: `src/components/QuestionDisplay.js`
   - File: `src/init/ui.js`
   - Action: Change UI to emit `question:request-new` event only
   - Changes:
     - Remove direct question fetching from UI
     - Add event emission for user intent
   - Verification: UI components no longer fetch questions directly

4. **Add integration tests**
   - File: `tests/integration/question-flow.test.js`
   - Action: Create tests for single question flow
   - Tests:
     - One click triggers one question selection
     - Question loading emits correct events
     - No duplicate question loading
   - Verification: All integration tests pass

**Verification Criteria:**
- [ ] Only one question loading path exists in codebase
- [ ] UI components emit events only, don't fetch
- [ ] Integration tests pass
- [ ] Manual testing: single click loads one question

**Dependencies:** None

**Estimated Time:** 2-3 days

---

### 1.2 Fix State Synchronization

**Issue:** GameEngine maintains separate state from store, causing divergence.

**Steps:**

1. **Audit state ownership**
   - File: `src/core/GameEngine.js`
   - File: `src/state/index.js`
   - Action: Document which state is owned by Engine vs Store
   - Output: State ownership matrix

2. **Establish single source of truth**
   - File: `src/core/GameEngine.js`
   - Action: Make GameEngine the source of truth for game state
   - Changes:
     - Remove duplicate state from Store
     - Make Store derive state from Engine
     - Add state synchronization method
   - Verification: State changes flow through Engine only

3. **Add state validation**
   - File: `src/core/GameEngine.js`
   - Action: Add state machine with legal transitions
   - Changes:
     - Define legal state transitions
     - Add validation before state changes
     - Throw errors for illegal transitions
   - Verification: Illegal transitions are prevented

4. **Add state validation tests**
   - File: `tests/unit/state-machine.test.js`
   - Action: Create tests for state machine
   - Tests:
     - Legal transitions succeed
     - Illegal transitions throw errors
     - State machine prevents invalid states
   - Verification: All state machine tests pass

**Verification Criteria:**
- [ ] State ownership documented
- [ ] GameEngine is single source of truth
- [ ] State machine validates transitions
- [ ] State machine tests pass
- [ ] No state divergence in manual testing

**Dependencies:** 1.1 (Single question flow)

**Estimated Time:** 2-3 days

---

### 1.3 Implement Dependency Injection

**Issue:** Services are tightly coupled through direct imports, reducing testability.

**Steps:**

1. **Create service container**
   - File: `src/core/ServiceContainer.js`
   - Action: Implement dependency injection container
   - Changes:
     - Create ServiceContainer class
     - Add register() and get() methods
     - Implement singleton pattern
   - Verification: Container can register and retrieve services

2. **Refactor services to use container**
   - Files: All service files
   - Action: Update services to use DI container
   - Changes:
     - Remove direct imports
     - Add service registration
     - Update consumers to use container
   - Verification: Services use container for dependencies

3. **Add service interface definitions**
   - File: `src/core/interfaces/ServiceInterface.js`
   - Action: Define contracts for services
   - Changes:
     - Create interfaces for major services
     - Add type checking where possible
     - Document service contracts
   - Verification: All services implement defined interfaces

4. **Add DI tests**
   - File: `tests/unit/service-container.test.js`
   - Action: Create tests for DI container
   - Tests:
     - Service registration works
     - Service retrieval works
     - Singleton pattern enforced
     - Interface validation works
   - Verification: All DI tests pass

**Verification Criteria:**
- [ ] ServiceContainer implemented
- [ ] All services use DI container
- [ ] Service interfaces defined
- [ ] DI tests pass
- [ ] Services can be swapped in tests

**Dependencies:** 1.2 (State synchronization)

**Estimated Time:** 2-3 days

---

## Phase 2: CSS & Styling System Refactor (Week 2-3)

### 2.1 Consolidate CSS Files

**Issue:** `app-fixes.css` is 2740 lines with overlapping styles.

**Steps:**

1. **Audit CSS file contents**
   - Files: All CSS files
   - Action: Document what each file contains
   - Output: CSS content matrix showing overlaps

2. **Break down app-fixes.css**
   - File: `src/styles/app-fixes.css`
   - Action: Split into logical modules
   - New files:
     - `src/styles/modules/host.css` - Host-related styles
     - `src/styles/modules/scoreboard.css` - Scoreboard styles
     - `src/styles/modules/header.css` - Header styles
     - `src/styles/modules/footer.css` - Footer styles
     - `src/styles/modules/modals.css` - Modal styles
     - `src/styles/modules/animations.css` - Animation styles
   - Verification: Each module has single responsibility

3. **Update imports in app.css**
   - File: `src/styles/app.css`
   - Action: Add imports for new modules
   - Changes:
     - Remove app-fixes.css import
     - Add module imports
     - Maintain layer order
   - Verification: Styles render correctly after refactor

4. **Remove duplicate styles**
   - Files: All CSS files
   - Action: Remove overlapping styles
   - Changes:
     - Keep styles in most appropriate file
     - Remove duplicates
     - Update references if needed
   - Verification: No duplicate styles exist

5. **Add CSS linting**
   - File: `.stylelintrc.json`
   - Action: Configure Stylelint
   - Changes:
     - Add Stylelint config
     - Add npm script for CSS linting
     - Add to CI pipeline
   - Verification: CSS linting passes

**Verification Criteria:**
- [ ] CSS content matrix created
- [ ] app-fixes.css split into modules
- [ ] app.css updated with new imports
- [ ] Duplicate styles removed
- [ ] Stylelint configured
- [ ] Visual regression tests pass
- [ ] All pages render correctly

**Dependencies:** None

**Estimated Time:** 3-4 days

---

### 2.2 Standardize Naming Conventions

**Issue:** Inconsistent naming (camelCase vs kebab-case) across CSS.

**Steps:**

1. **Audit naming conventions**
   - Files: All CSS files
   - Action: Document current naming patterns
   - Output: Naming convention audit report

2. **Choose naming standard**
   - Decision: Use BEM (Block Element Modifier)
   - Rationale: BEM provides clear hierarchy and scoping
   - Documentation: Add to CSS guidelines

3. **Rename CSS classes**
   - Files: All CSS files
   - Action: Convert to BEM naming
   - Changes:
     - Rename classes to BEM format
     - Update JavaScript references
     - Update HTML class names
   - Verification: All classes follow BEM convention

4. **Add naming linting**
   - File: `.stylelintrc.json`
   - Action: Add naming convention rules
   - Changes:
     - Add selector-class-pattern rule
     - Configure to enforce BEM
   - Verification: Naming linting passes

**Verification Criteria:**
- [ ] Naming audit completed
- [ ] BEM standard chosen and documented
- [ ] All classes renamed to BEM
- [ ] JavaScript references updated
- [ ] HTML class names updated
- [ ] Naming linting configured
- [ ] All naming linting passes

**Dependencies:** 2.1 (CSS file consolidation)

**Estimated Time:** 2-3 days

---

### 2.3 Create Animation Library

**Issue:** Mixed animation timing and easing functions, no centralization.

**Steps:**

1. **Audit current animations**
   - Files: All CSS files
   - Action: Document all animations
   - Output: Animation inventory with timing/easing

2. **Create animation constants**
   - File: `src/styles/tokens/animations.css`
   - Action: Define animation tokens
   - Changes:
     - Define duration tokens (fast, normal, slow)
     - Define easing tokens (ease-in, ease-out, bounce, etc.)
     - Define animation presets
   - Verification: Animation tokens defined

3. **Standardize animation usage**
   - Files: All CSS files
   - Action: Replace hardcoded animations with tokens
   - Changes:
     - Replace duration values with tokens
     - Replace easing values with tokens
     - Use animation presets where applicable
   - Verification: All animations use tokens

4. **Create JavaScript animation constants**
   - File: `src/utils/animationConstants.js`
   - Action: Mirror CSS tokens in JS
   - Changes:
     - Export animation constants
     - Match CSS token values
     - Add JSDoc documentation
   - Verification: JS constants match CSS tokens

5. **Add animation documentation**
   - File: `docs/ANIMATION_GUIDELINES.md`
   - Action: Document animation usage
   - Content:
     - When to use each duration
     - When to use each easing
     - Animation best practices
   - Verification: Documentation complete

**Verification Criteria:**
- [ ] Animation inventory created
- [ ] Animation tokens defined
- [ ] All animations use tokens
- [ ] JS constants created
- [ ] Animation guidelines documented
- [ ] All animations render correctly

**Dependencies:** 2.2 (Naming conventions)

**Estimated Time:** 2 days

---

### 2.4 Add CSS Purging

**Issue:** Large CSS bundle with unused styles.

**Steps:**

1. **Audit CSS usage**
   - Tool: PurgeCSS
   - Action: Scan HTML/JS for CSS usage
   - Output: Unused CSS report

2. **Configure PurgeCSS**
   - File: `vite.config.js`
   - Action: Add PurgeCSS plugin
   - Changes:
     - Install @fullhuman/postcss-purgecss
     - Configure PostCSS
     - Add safelist for dynamic classes
   - Verification: PurgeCSS configured

3. **Test purged CSS**
   - Action: Build with PurgeCSS
   - Verification:
     - Build succeeds
     - All styles render correctly
     - No missing styles
   - Output: Bundle size comparison

4. **Add to CI pipeline**
   - File: `.github/workflows/ci.yml`
   - Action: Add CSS size check
   - Changes:
     - Add CSS bundle size limit
     - Fail build if size increases
   - Verification: CI checks CSS size

**Verification Criteria:**
- [ ] Unused CSS identified
- [ ] PurgeCSS configured
- [ ] Build with PurgeCSS succeeds
- [ ] All styles render correctly
- [ ] Bundle size reduced
- [ ] CI CSS size check added

**Dependencies:** 2.3 (Animation library)

**Estimated Time:** 1-2 days

---

## Phase 3: UI/UX Improvements (Week 3-4)

### 3.1 Implement Error Boundaries

**Issue:** No error boundaries for component failures.

**Steps:**

1. **Create ErrorBoundary component**
   - File: `src/components/ErrorBoundary.js`
   - Action: Implement error boundary
   - Changes:
     - Create ErrorBoundary class
     - Add error catching
     - Add fallback UI
     - Add error logging
   - Verification: ErrorBoundary catches errors

2. **Wrap major components**
   - Files: `src/components/App.js`, etc.
   - Action: Add ErrorBoundary wrappers
   - Changes:
     - Wrap App component
     - Wrap QuestionDisplay
     - Wrap ScoreBoard
     - Wrap other major components
   - Verification: Components have error boundaries

3. **Add error boundary tests**
   - File: `tests/unit/ErrorBoundary.test.js`
   - Action: Test error boundary
   - Tests:
     - Catches child errors
     - Displays fallback UI
     - Logs errors
     - Can recover
   - Verification: All error boundary tests pass

4. **Add error reporting**
   - File: `src/utils/errorReporting.js`
   - Action: Implement error reporting
   - Changes:
     - Add error logging service
     - Add error aggregation
     - Add user-friendly error messages
   - Verification: Errors are reported properly

**Verification Criteria:**
- [ ] ErrorBoundary component created
- [ ] Major components wrapped
- [ ] Error boundary tests pass
- [ ] Error reporting implemented
- [ ] Errors caught gracefully in manual testing

**Dependencies:** 1.3 (Dependency injection)

**Estimated Time:** 2-3 days

---

### 3.2 Standardize Animation Timing

**Issue:** Different animation patterns across components.

**Steps:**

1. **Create animation utility**
   - File: `src/utils/animation.js`
   - Action: Create shared animation functions
   - Functions:
     - `animate(element, keyframes, options)`
     - `fadeIn(element, duration)`
     - `fadeOut(element, duration)`
     - `slideIn(element, direction, duration)`
     - `scale(element, scale, duration)`
   - Verification: Animation utility works

2. **Update components to use utility**
   - Files: `src/components/QuestionDisplay.js`, etc.
   - Action: Replace inline animations with utility
   - Changes:
     - Remove inline animation code
     - Use animation utility functions
     - Pass animation constants
   - Verification: Components use animation utility

3. **Add animation utility tests**
   - File: `tests/unit/animation.test.js`
   - Action: Test animation utility
   - Tests:
     - All animation functions work
     - Timing is correct
     - Easing is correct
     - Cleanup happens properly
   - Verification: All animation tests pass

4. **Add performance monitoring**
   - File: `src/utils/animation.js`
   - Action: Add animation performance tracking
   - Changes:
     - Track animation duration
     - Track animation FPS
     - Log slow animations
   - Verification: Performance tracking works

**Verification Criteria:**
- [ ] Animation utility created
- [ ] Components use animation utility
- [ ] Animation tests pass
- [ ] Performance tracking added
- [ ] Animations perform well in manual testing

**Dependencies:** 2.3 (Animation library)

**Estimated Time:** 2 days

---

### 3.3 Improve Mobile Experience

**Issue:** Some components not fully responsive.

**Steps:**

1. **Audit mobile responsiveness**
   - Files: All component files
   - Action: Test on mobile viewport
   - Output: Mobile responsiveness audit report

2. **Standardize breakpoints**
   - File: `src/styles/tokens/breakpoints.css`
   - Action: Define consistent breakpoints
   - Breakpoints:
     - `--bp-sm: 640px`
     - `--bp-md: 768px`
     - `--bp-lg: 1024px`
     - `--bp-xl: 1280px`
   - Verification: Breakpoints defined

3. **Update components for mobile**
   - Files: All component files
   - Action: Make components mobile-friendly
   - Changes:
     - Use responsive units (vw, vh, clamp)
     - Add mobile-specific styles
     - Improve touch targets (min 44px)
     - Optimize for mobile performance
   - Verification: Components work on mobile

4. **Add mobile testing**
   - File: `tests/e2e/mobile.test.js`
   - Action: Create mobile E2E tests
   - Tests:
     - All features work on mobile
     - Touch targets are adequate
     - Performance is acceptable
   - Verification: Mobile tests pass

5. **Add responsive images**
   - Files: Image components
   - Action: Implement responsive images
   - Changes:
     - Use srcset for images
     - Use picture element for art direction
     - Lazy load images
   - Verification: Images are responsive

**Verification Criteria:**
- [ ] Mobile audit completed
- [ ] Breakpoints standardized
- [ ] Components mobile-friendly
- [ ] Mobile tests pass
- [ ] Images responsive
- [ ] Manual mobile testing passes

**Dependencies:** 2.2 (Naming conventions)

**Estimated Time:** 3-4 days

---

### 3.4 Add Loading Skeletons

**Issue:** Generic loading spinners instead of skeleton screens.

**Steps:**

1. **Create Skeleton component**
   - File: `src/components/Skeleton.js`
   - Action: Implement skeleton loader
   - Changes:
     - Create Skeleton component
     - Add shimmer animation
     - Support different shapes
     - Support different sizes
   - Verification: Skeleton component works

2. **Replace spinners with skeletons**
   - Files: All components with loading states
   - Action: Replace loading spinners
   - Changes:
     - Remove loading spinners
     - Add skeleton screens
     - Match content structure
   - Verification: Skeletons match content structure

3. **Add skeleton tests**
   - File: `tests/unit/Skeleton.test.js`
   - Action: Test skeleton component
   - Tests:
     - Renders correctly
     - Animation plays
     - Different shapes work
     - Accessibility is good
   - Verification: Skeleton tests pass

4. **Add skeleton documentation**
   - File: `docs/SKELETON_GUIDELINES.md`
   - Action: Document skeleton usage
   - Content:
     - When to use skeletons
     - How to structure skeletons
     - Skeleton best practices
   - Verification: Documentation complete

**Verification Criteria:**
- [ ] Skeleton component created
- [ ] Spinners replaced with skeletons
- [ ] Skeleton tests pass
- [ ] Skeleton guidelines documented
- [ ] Skeletons render correctly

**Dependencies:** 3.2 (Animation timing)

**Estimated Time:** 2 days

---

## Phase 4: Modular Host Animation System (Week 4-6)

### 4.1 Implement Animation Registry

**Issue:** No centralized animation management.

**Steps:**

1. **Create AnimationRegistry class**
   - File: `src/services/host/animation/AnimationRegistry.js`
   - Action: Implement animation registry
   - Changes:
     - Create AnimationRegistry class
     - Add registerAnimation() method
     - Add registerPreset() method
     - Add getAnimation() method
     - Add getPreset() method
   - Verification: Registry can register and retrieve animations

2. **Define animation schema**
   - File: `src/services/host/animation/AnimationSchema.js`
   - Action: Define animation configuration schema
   - Schema:
     ```javascript
     {
       id: string,
       duration: number,
       easing: string,
       keyframes: array,
       sound: string | null,
       mood: string,
       iterations: string | number
     }
     ```
   - Verification: Schema defined and validated

3. **Add registry tests**
   - File: `tests/unit/AnimationRegistry.test.js`
   - Action: Test animation registry
   - Tests:
     - Registration works
     - Retrieval works
     - Schema validation works
     - Duplicate handling works
   - Verification: Registry tests pass

4. **Integrate with HostSystem**
   - File: `src/services/HostSystem.js`
   - Action: Integrate AnimationRegistry
   - Changes:
     - Import AnimationRegistry
     - Initialize registry on startup
     - Replace hardcoded animations with registry
   - Verification: HostSystem uses registry

**Verification Criteria:**
- [ ] AnimationRegistry created
- [ ] Animation schema defined
- [ ] Registry tests pass
- [ ] HostSystem integrated
- [ ] Animations load from registry

**Dependencies:** 1.3 (Dependency injection)

**Estimated Time:** 2-3 days

---

### 4.2 Create Primitive Animation Library

**Issue:** No reusable animation primitives.

**Steps:**

1. **Create primitive animations**
   - File: `src/services/host/animation/primitives/Fade.js`
   - Action: Implement fade primitives
   - Animations:
     - `fade:in`
     - `fade:out`
     - `fade:in-out`
   - Verification: Fade primitives work

2. **Create slide primitives**
   - File: `src/services/host/animation/primitives/Slide.js`
   - Action: Implement slide primitives
   - Animations:
     - `slide:up`
     - `slide:down`
     - `slide:left`
     - `slide:right`
   - Verification: Slide primitives work

3. **Create scale primitives**
   - File: `src/services/host/animation/primitives/Scale.js`
   - Action: Implement scale primitives
   - Animations:
     - `scale:up`
     - `scale:down`
     - `scale:pulse`
   - Verification: Scale primitives work

4. **Create rotate primitives**
   - File: `src/services/host/animation/primitives/Rotate.js`
   - Action: Implement rotate primitives
   - Animations:
     - `rotate:clockwise`
     - `rotate:counter-clockwise`
     - `rotate:flip`
   - Verification: Rotate primitives work

5. **Create shake primitives**
   - File: `src/services/host/animation/primitives/Shake.js`
   - Action: Implement shake primitives
   - Animations:
     - `shake:horizontal`
     - `shake:vertical`
     - `shake:radial`
   - Verification: Shake primitives work

6. **Register all primitives**
   - File: `src/services/host/animation/primitives/index.js`
   - Action: Export and register all primitives
   - Changes:
     - Export all primitives
     - Auto-register with AnimationRegistry
   - Verification: All primitives registered

7. **Add primitive tests**
   - File: `tests/unit/primitives.test.js`
   - Action: Test all primitives
   - Tests:
     - Each primitive renders correctly
     - Timing is correct
     - Easing is correct
     - Cleanup works
   - Verification: All primitive tests pass

**Verification Criteria:**
- [ ] All primitive animations created
- [ ] Primitives registered
- [ ] Primitive tests pass
- [ ] Primitives render correctly
- [ ] Primitives can be composed

**Dependencies:** 4.1 (Animation Registry)

**Estimated Time:** 3-4 days

---

### 4.3 Implement Animation Composer

**Issue:** No way to compose animations into sequences.

**Steps:**

1. **Create AnimationComposer class**
   - File: `src/services/host/animation/AnimationComposer.js`
   - Action: Implement animation composer
   - Methods:
     - `compose(sequence)` - Create sequence
     - `parallel(...animations)` - Play in parallel
     - `sequential(...animations)` - Play sequentially
     - `withDelay(animation, delay)` - Add delay
   - Verification: Composer can compose animations

2. **Create AnimationSequence class**
   - File: `src/services/host/animation/AnimationSequence.js`
   - Action: Implement animation sequence
   - Methods:
     - `playParallel()` - Execute in parallel
     - `playSequential()` - Execute sequentially
     - `cancel()` - Cancel sequence
   - Verification: Sequence can execute animations

3. **Add composer tests**
   - File: `tests/unit/AnimationComposer.test.js`
   - Action: Test animation composer
   - Tests:
     - Parallel execution works
     - Sequential execution works
     - Delay works
     - Cancellation works
   - Verification: Composer tests pass

4. **Integrate with HostSystem**
   - File: `src/services/HostSystem.js`
   - Action: Integrate AnimationComposer
   - Changes:
     - Import AnimationComposer
     - Add composition methods
     - Update triggerAnimation to use composer
   - Verification: HostSystem can compose animations

**Verification Criteria:**
- [ ] AnimationComposer created
- [ ] AnimationSequence created
- [ ] Composer tests pass
- [ ] HostSystem integrated
- [ ] Animation composition works

**Dependencies:** 4.2 (Primitive animations)

**Estimated Time:** 2-3 days

---

### 4.4 Create Animation Presets

**Issue:** No high-level animation presets for common actions.

**Steps:**

1. **Create celebration presets**
   - File: `src/services/host/animation/presets/Celebrate.js`
   - Action: Implement celebration animations
   - Presets:
     - `celebrate:bounce`
     - `celebrate:confetti`
     - `celebrate:spin`
     - `celebrate:excited`
   - Verification: Celebration presets work

2. **Create thinking presets**
   - File: `src/services/host/animation/presets/Think.js`
   - Action: Implement thinking animations
   - Presets:
     - `think:pulse`
     - `think:contemplate`
     - `think:process`
   - Verification: Thinking presets work

3. **Create surprise presets**
   - File: `src/services/host/animation/presets/Surprise.js`
   - Action: Implement surprise animations
   - Presets:
     - `surprise:jump`
     - `surprise:shake`
     - `surprise:reveal`
   - Verification: Surprise presets work

4. **Create idle presets**
   - File: `src/services/host/animation/presets/Idle.js`
   - Action: Implement idle animations
   - Presets:
     - `idle:subtle`
     - `idle:nod`
     - `idle:breathe`
   - Verification: Idle presets work

5. **Register all presets**
   - File: `src/services/host/animation/presets/index.js`
   - Action: Export and register all presets
   - Changes:
     - Export all presets
     - Auto-register with AnimationRegistry
   - Verification: All presets registered

6. **Add preset tests**
   - File: `tests/unit/presets.test.js`
   - Action: Test all presets
   - Tests:
     - Each preset renders correctly
     - Presets use correct primitives
     - Preset timing is correct
   - Verification: All preset tests pass

**Verification Criteria:**
- [ ] All preset animations created
- [ ] Presets registered
- [ ] Preset tests pass
- [ ] Presets render correctly
- [ ] Presets trigger correctly

**Dependencies:** 4.3 (Animation Composer)

**Estimated Time:** 3-4 days

---

### 4.5 Enhance Personality System

**Issue:** Personality system lacks animation preferences.

**Steps:**

1. **Create personality structure**
   - File: `src/services/host/personality/PersonalitySchema.js`
   - Action: Define personality schema
   - Schema:
     ```javascript
     {
       id: string,
       name: string,
       description: string,
       animationPreferences: {
         [mood]: {
           idle: array,
           correct: array,
           incorrect: array,
           streak: array
         }
       },
       voice: {
         pitch: number,
         rate: number,
         volume: number,
         accent: string
       }
     }
     ```
   - Verification: Personality schema defined

2. **Refactor Trebek personality**
   - File: `src/services/host/personality/Trebek.js`
   - Action: Enhance Trebek personality
   - Changes:
     - Add animation preferences
     - Add voice configuration
     - Add personality-specific quirks
   - Verification: Trebek personality enhanced

3. **Refactor Watson personality**
   - File: `src/services/host/personality/Watson.js`
   - Action: Enhance Watson personality
   - Changes:
     - Add animation preferences
     - Add voice configuration
     - Add personality-specific quirks
   - Verification: Watson personality enhanced

4. **Create custom personality template**
   - File: `src/services/host/personality/Custom.js`
   - Action: Create custom personality template
   - Changes:
     - Create template for custom personalities
     - Add documentation for creating personalities
     - Add validation for personality configs
   - Verification: Custom template works

5. **Integrate with HostSystem**
   - File: `src/services/HostSystem.js`
   - Action: Integrate enhanced personalities
   - Changes:
     - Load animation preferences from personality
     - Select animations based on mood
     - Apply voice configuration
   - Verification: HostSystem uses enhanced personalities

6. **Add personality tests**
   - File: `tests/unit/personalities.test.js`
   - Action: Test personality system
   - Tests:
     - Personality schema validation
     - Animation preferences work
     - Voice configuration works
     - Personality switching works
   - Verification: Personality tests pass

**Verification Criteria:**
- [ ] Personality schema defined
- [ ] Trebek personality enhanced
- [ ] Watson personality enhanced
- [ ] Custom template created
- [ ] HostSystem integrated
- [ ] Personality tests pass
- [ ] Personalities work correctly

**Dependencies:** 4.4 (Animation presets)

**Estimated Time:** 3-4 days

---

### 4.6 Implement Rendering Engine

**Issue:** No unified rendering system for animations.

**Steps:**

1. **Create HostRenderer interface**
   - File: `src/services/host/rendering/HostRenderer.js`
   - Action: Define renderer interface
   - Methods:
     - `render(animation, element)` - Render animation
     - `cancel(animation)` - Cancel animation
     - `cleanup(animation)` - Cleanup resources
   - Verification: Renderer interface defined

2. **Implement CSSAnimator**
   - File: `src/services/host/rendering/CSSAnimator.js`
   - Action: Implement CSS-based animation
   - Changes:
     - Use CSS animations
     - Support Web Animations API
     - Add fallback for older browsers
   - Verification: CSSAnimator works

3. **Implement SpriteAnimator**
   - File: `src/services/host/rendering/SpriteAnimator.js`
   - Action: Implement sprite-based animation
   - Changes:
     - Support sprite sheets
     - Implement frame timing
     - Add sprite caching
   - Verification: SpriteAnimator works

4. **Create renderer factory**
   - File: `src/services/host/rendering/RendererFactory.js`
   - Action: Create renderer selection logic
   - Logic:
     - Select CSSAnimator for CSS animations
     - Select SpriteAnimator for sprite animations
     - Add capability detection
   - Verification: Factory selects correct renderer

5. **Integrate with HostSystem**
   - File: `src/services/HostSystem.js`
   - Action: Integrate rendering engine
   - Changes:
     - Use renderer factory
     - Pass animations to renderer
     - Handle renderer lifecycle
   - Verification: HostSystem uses rendering engine

6. **Add renderer tests**
   - File: `tests/unit/renderers.test.js`
   - Action: Test rendering engine
   - Tests:
     - CSSAnimator works
     - SpriteAnimator works
     - Factory selects correctly
     - Cleanup works
   - Verification: Renderer tests pass

**Verification Criteria:**
- [ ] Renderer interface defined
- [ ] CSSAnimator implemented
- [ ] SpriteAnimator implemented
- [ ] Renderer factory created
- [ ] HostSystem integrated
- [ ] Renderer tests pass
- [ ] Animations render correctly

**Dependencies:** 4.5 (Personality system)

**Estimated Time:** 3-4 days

---

### 4.7 Add Performance Monitoring

**Issue:** No animation performance tracking.

**Steps:**

1. **Create performance monitor**
   - File: `src/services/host/animation/PerformanceMonitor.js`
   - Action: Implement performance tracking
   - Metrics:
     - Animation duration
     - Animation FPS
     - Animation memory usage
     - Animation errors
   - Verification: Performance monitor works

2. **Integrate with rendering engine**
   - Files: Renderer files
   - Action: Add performance tracking
   - Changes:
     - Track animation start/end
     - Calculate FPS
     - Log performance issues
   - Verification: Performance tracked

3. **Add performance thresholds**
   - File: `src/services/host/animation/PerformanceMonitor.js`
   - Action: Define performance thresholds
   - Thresholds:
     - Max animation duration
     - Min FPS
     - Max memory usage
   - Verification: Thresholds defined

4. **Add performance warnings**
   - File: `src/services/host/animation/PerformanceMonitor.js`
   - Action: Add warning system
   - Changes:
     - Warn when thresholds exceeded
     - Log warnings to console
     - Suggest optimizations
   - Verification: Warnings work

5. **Add performance tests**
   - File: `tests/unit/performance.test.js`
   - Action: Test performance monitoring
   - Tests:
     - Performance tracking works
     - Thresholds work
     - Warnings work
   - Verification: Performance tests pass

**Verification Criteria:**
- [ ] Performance monitor created
- [ ] Rendering engine integrated
- [ ] Performance thresholds defined
- [ ] Performance warnings work
- [ ] Performance tests pass
- [ ] Performance data collected

**Dependencies:** 4.6 (Rendering engine)

**Estimated Time:** 2 days

---

## Phase 5: Testing & Documentation (Week 6-7)

### 5.1 Create Component Storybook

**Issue:** No component documentation or visual testing.

**Steps:**

1. **Set up Storybook**
   - Action: Install and configure Storybook
   - Changes:
     - Install Storybook
     - Configure for vanilla JS
     - Add to package.json scripts
   - Verification: Storybook runs

2. **Create component stories**
   - Files: Story files for each component
   - Action: Create stories for all components
   - Components:
     - QuestionDisplay
     - ScoreBoard
     - Modal
     - HostContainer
     - All other components
   - Verification: All components have stories

3. **Add interaction tests**
   - Files: Story files
   - Action: Add interaction tests to stories
   - Tests:
     - User interactions
     - State changes
     - Event emissions
   - Verification: Interaction tests work

4. **Add accessibility tests**
   - Files: Story files
   - Action: Add a11y tests to stories
   - Tests:
     - ARIA labels
     - Keyboard navigation
     - Screen reader compatibility
   - Verification: A11y tests pass

5. **Add to CI pipeline**
   - File: `.github/workflows/ci.yml`
   - Action: Add Storybook build to CI
   - Changes:
     - Build Storybook
     - Deploy to GitHub Pages
     - Add visual regression tests
   - Verification: Storybook in CI

**Verification Criteria:**
- [ ] Storybook configured
- [ ] All components have stories
- [ ] Interaction tests work
- [ ] A11y tests pass
- [ ] Storybook in CI
- [ ] Storybook deployed

**Dependencies:** All previous phases

**Estimated Time:** 3-4 days

---

### 5.2 Implement A/B Testing Framework

**Issue:** No UI experimentation capability.

**Steps:**

1. **Create A/B testing system**
   - File: `src/utils/abTesting.js`
   - Action: Implement A/B testing
   - Features:
     - Feature flags
     - User segmentation
     - Variant assignment
     - Metrics collection
   - Verification: A/B system works

2. **Create feature flag UI**
   - File: `src/components/FeatureFlags.js`
   - Action: Create feature flag component
   - Changes:
     - Create UI for toggling flags
     - Add to dev menu
     - Persist flag state
   - Verification: Feature flags work

3. **Add A/B tests**
   - File: `tests/unit/abTesting.test.js`
   - Action: Test A/B system
   - Tests:
     - Feature flags work
     - Variant assignment works
     - Metrics collection works
   - Verification: A/B tests pass

4. **Document A/B testing**
   - File: `docs/AB_TESTING_GUIDE.md`
   - Action: Document A/B testing usage
   - Content:
     - How to create experiments
     - How to analyze results
     - Best practices
   - Verification: Documentation complete

**Verification Criteria:**
- [ ] A/B system created
- [ ] Feature flag UI created
- [ ] A/B tests pass
- [ ] A/B documentation complete
- [ ] A/B system works

**Dependencies:** 5.1 (Storybook)

**Estimated Time:** 2-3 days

---

### 5.3 Update Documentation

**Issue:** Documentation needs updates for all changes.

**Steps:**

1. **Update ARCHITECTURE.md**
   - File: `ARCHITECTURE.md`
   - Action: Update architecture documentation
   - Changes:
     - Document new architecture
     - Update component diagrams
     - Add service layer documentation
   - Verification: Architecture docs updated

2. **Update CONTRIBUTING.md**
   - File: `CONTRIBUTING.md`
   - Action: Update contribution guidelines
   - Changes:
     - Add coding standards
     - Add testing guidelines
     - Add PR process
   - Verification: Contributing docs updated

3. **Create CSS_GUIDELINES.md**
   - File: `docs/CSS_GUIDELINES.md`
   - Action: Create CSS guidelines
   - Content:
     - Naming conventions
     - File organization
     - Animation usage
     - Performance guidelines
   - Verification: CSS guidelines created

4. **Create ANIMATION_GUIDELINES.md**
   - File: `docs/ANIMATION_GUIDELINES.md`
   - Action: Create animation guidelines
   - Content:
     - When to animate
     - Animation timing
     - Performance considerations
     - Accessibility
   - Verification: Animation guidelines created

5. **Create HOST_SYSTEM_GUIDE.md**
   - File: `docs/HOST_SYSTEM_GUIDE.md`
   - Action: Create host system guide
   - Content:
     - How to create personalities
     - How to create animations
     - How to use animation system
   - Verification: Host system guide created

6. **Update README.md**
   - File: `README.md`
   - Action: Update main README
   - Changes:
     - Add new features
     - Update setup instructions
     - Add links to new docs
   - Verification: README updated

**Verification Criteria:**
- [ ] ARCHITECTURE.md updated
- [ ] CONTRIBUTING.md updated
- [ ] CSS guidelines created
- [ ] Animation guidelines created
- [ ] Host system guide created
- [ ] README updated
- [ ] All documentation accurate

**Dependencies:** All previous phases

**Estimated Time:** 2-3 days

---

## Phase 6: Final Integration & Testing (Week 7-8)

### 6.1 Integration Testing

**Issue:** Need comprehensive integration tests.

**Steps:**

1. **Create integration test suite**
   - File: `tests/integration/`
   - Action: Create integration tests
   - Tests:
     - Full game flow
     - Host animation flow
     - State synchronization
     - Service integration
   - Verification: Integration tests pass

2. **Add E2E tests**
   - File: `tests/e2e/`
   - Action: Create E2E tests
   - Tests:
     - User journeys
     - Cross-browser testing
     - Mobile testing
   - Verification: E2E tests pass

3. **Add performance tests**
   - File: `tests/performance/`
   - Action: Create performance tests
   - Tests:
     - Animation performance
     - Bundle size
     - Load time
   - Verification: Performance tests pass

4. **Add accessibility tests**
   - File: `tests/a11y/`
   - Action: Create accessibility tests
   - Tests:
     - Screen reader compatibility
     - Keyboard navigation
     - Color contrast
   - Verification: A11y tests pass

**Verification Criteria:**
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] A11y tests pass
- [ ] All tests in CI

**Dependencies:** All previous phases

**Estimated Time:** 3-4 days

---

### 6.2 Code Review & Refinement

**Issue:** Final code review and cleanup.

**Steps:**

1. **Conduct code review**
   - Action: Review all changes
   - Focus:
     - Code quality
     - Performance
     - Security
     - Best practices
   - Output: Code review report

2. **Address review findings**
   - Action: Fix issues from review
   - Changes:
     - Fix bugs
     - Improve performance
     - Enhance security
     - Refactor code
   - Verification: All findings addressed

3. **Run final linting**
   - Action: Run all linters
   - Tools:
     - ESLint
     - Stylelint
     - Prettier
   - Verification: All linting passes

4. **Run final tests**
   - Action: Run all tests
   - Tests:
     - Unit tests
     - Integration tests
     - E2E tests
   - Verification: All tests pass

**Verification Criteria:**
- [ ] Code review completed
- [ ] Review findings addressed
- [ ] All linting passes
- [ ] All tests pass
- [ ] Code quality high

**Dependencies:** 6.1 (Integration testing)

**Estimated Time:** 2-3 days

---

### 6.3 Deployment Preparation

**Issue:** Prepare for deployment.

**Steps:**

1. **Update build configuration**
   - File: `vite.config.js`
   - Action: Optimize build
   - Changes:
     - Enable code splitting
     - Optimize assets
     - Configure caching
   - Verification: Build optimized

2. **Test production build**
   - Action: Build and test production
   - Tests:
     - Build succeeds
     - Production bundle works
     - Performance acceptable
   - Verification: Production build works

3. **Update deployment scripts**
   - File: `.github/workflows/deploy.yml`
   - Action: Update deployment
   - Changes:
     - Add build steps
     - Add test steps
     - Add deployment steps
   - Verification: Deployment scripts work

4. **Create deployment checklist**
   - File: `docs/DEPLOYMENT_CHECKLIST.md`
   - Action: Create deployment checklist
   - Content:
     - Pre-deployment checks
     - Deployment steps
     - Post-deployment verification
   - Verification: Checklist complete

**Verification Criteria:**
- [ ] Build configuration updated
- [ ] Production build tested
- [ ] Deployment scripts updated
- [ ] Deployment checklist created
- [ ] Ready for deployment

**Dependencies:** 6.2 (Code review)

**Estimated Time:** 2 days

---

## Summary Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Critical Architecture Fixes | Week 1-2 | None |
| Phase 2: CSS & Styling Refactor | Week 2-3 | None |
| Phase 3: UI/UX Improvements | Week 3-4 | Phase 1, 2 |
| Phase 4: Host Animation System | Week 4-6 | Phase 1, 2, 3 |
| Phase 5: Testing & Documentation | Week 6-7 | All previous |
| Phase 6: Final Integration | Week 7-8 | All previous |

**Total Estimated Time:** 6-8 weeks

---

## Success Criteria

**Architecture:**
- [ ] Single source of truth for state
- [ ] No race conditions in question flow
- [ ] Dependency injection implemented
- [ ] All architecture tests pass

**CSS & Styling:**
- [ ] CSS files consolidated and organized
- [ ] Consistent naming conventions
- [ ] Centralized animation library
- [ ] CSS bundle size reduced
- [ ] All CSS linting passes

**UI/UX:**
- [ ] Error boundaries implemented
- [ ] Consistent animation timing
- [ ] Mobile experience optimized
- [ ] Loading skeletons implemented
- [ ] All UI tests pass

**Host Animation System:**
- [ ] Animation registry implemented
- [ ] Primitive animations created
- [ ] Animation composer working
- [ ] Animation presets created
- [ ] Personality system enhanced
- [ ] Rendering engine implemented
- [ ] Performance monitoring added
- [ ] All animation tests pass

**Testing & Documentation:**
- [ ] Component Storybook created
- [ ] A/B testing framework implemented
- [ ] All documentation updated
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] A11y tests pass

**Deployment:**
- [ ] Build optimized
- [ ] Production build tested
- [ ] Deployment scripts updated
- [ ] Deployment checklist complete

---

## Risk Mitigation

**Technical Risks:**
- **Risk:** Breaking existing functionality during refactoring
- **Mitigation:** Comprehensive testing, incremental changes, feature flags

**Timeline Risks:**
- **Risk:** Timeline overrun due to complexity
- **Mitigation:** Regular checkpoints, scope flexibility, priority-based implementation

**Resource Risks:**
- **Risk:** Insufficient testing resources
- **Mitigation:** Automated testing, CI integration, early testing focus

**Integration Risks:**
- **Risk:** Integration issues between phases
- **Mitigation:** Clear interfaces, integration tests, regular integration points

---

## Next Steps

1. **Review this plan** with the main agent for second opinion
2. **Adjust plan** based on feedback
3. **Begin Phase 1** with critical architecture fixes
4. **Track progress** using this document
5. **Update plan** as needed based on discoveries

---

**Document Status:** Ready for Review  
**Last Updated:** 2026-07-26  
**Next Review:** After agent feedback
