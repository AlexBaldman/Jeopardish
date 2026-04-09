# American Handball Video Game Plan (NYC Style)

This plan is for building a realistic video game inspired by one-wall American handball culture in New York City and Long Island.

## Vision

Build a game that starts simple (retro top-down prototype) and grows into a realistic 3D competitive experience with:

- Authentic one-wall rules and ball physics
- Street and school-court atmosphere
- A progression from local courts to elite borough competition

## Core Experience Pillars

1. **Real handball feel**
   - Ball speed, bounce angle, spin, and wall interaction must feel believable.
2. **Court authenticity**
   - One-wall dimensions, line markings, and surface materials matter.
3. **Culture and progression**
   - Start at school/local runs and climb into borough-level tournaments.
4. **Accessible but deep controls**
   - Easy to pick up, with enough nuance for shot-making mastery.

## Suggested Development Phases

### Phase 0: Design + Research (1–3 weeks)

- Lock scope for the first playable build.
- Document baseline one-wall rules:
  - Serve, short line/fault behavior, legal returns, and scoring format.
- Collect references for:
  - Typical NYC court dimensions and textures
  - Gameplay pacing (reaction windows, rally length)
- Define a small glossary of shot types:
  - Straight, cross-court, kill shot, lob, and ceiling-style defensive shots (where applicable to level design)

### Phase 1: 2D Prototype (4–8 weeks)

Build a top-down or slightly angled pixel-art prototype to validate game feel before 3D investment.

**Features**

- Single court and single-player drills
- Basic AI return behavior
- Scorekeeping (11 or 21 target configurable)
- Shot timing meter (early/perfect/late)
- Ball physics v1: velocity, bounce, and simple spin scalar

**Success criteria**

- Rallies feel fun for 5+ minutes
- Players can intentionally hit at least three distinct shot types
- AI can sustain beginner/intermediate rallies

### Phase 2: Vertical Slice in 3D (6–12 weeks)

Create one high-quality court with third-person gameplay and polished mechanics.

**Features**

- Third-person camera with lock-on assist
- Full body animation set (ready stance, sprint, forehand/backhand palm strike)
- Directional aiming cone + power control
- Ball physics v2:
  - Spin affecting post-wall trajectory
  - Material-based bounce differences (asphalt/concrete variants)
- Local 1v1 multiplayer

**Success criteria**

- Competitive rallies feel readable and fair
- Input latency feels responsive on controller/keyboard
- Two players can complete full matches without major exploits

### Phase 3: Competitive Loop + Worldbuilding (8–16 weeks)

Expand content and progression.

**Features**

- Multiple courts inspired by:
  - High school grounds
  - Neighborhood park walls
  - Borough championship venue
- Career mode ladder:
  - Park runs → neighborhood bracket → borough finals
- Opponent archetypes:
  - Power hitter, placement specialist, defensive retriever
- Player growth system:
  - Stamina, footwork, control, and power (balanced so skill still dominates)

### Phase 4: Online + Live Meta (optional)

- Ranked/quickplay matchmaking
- Seasonal leaderboards by borough
- Replay and ghost system for shot analysis
- Anti-cheat and rollback netcode tuning

## Gameplay Systems to Prioritize Early

- **Contact timing and spacing:** reward proper position and punish late reaches.
- **Shot intent model:** direction + power + spin from one unified control scheme.
- **Readable defense:** players should anticipate return options from opponent body setup.
- **Stamina pressure:** long rallies should create tactical openings without feeling arcade-random.

## Technical Recommendations

- **Engine:** Unity or Unreal.
  - Unity for faster iteration and indie tooling ecosystem.
  - Unreal if animation fidelity and advanced physics/visuals are top priority.
- **Physics approach:** custom ball controller layered on engine physics for determinism and tunable feel.
- **Animation:** start with a minimal set and expand once timing windows are stable.
- **Networking (if online):** design for rollback early if high-level competitive play is a target.

## Control Scheme (Starting Point)

- Left Stick / WASD: movement
- Right Stick / Mouse: shot direction bias
- Strike button: hit ball
- Modifier 1: finesse/placement mode
- Modifier 2: power mode

Combine button timing + directional input + modifier to generate shot variety without overwhelming players.

## Milestone Checklist

1. First playable rally loop
2. Playable match with serving + scoring
3. AI opponent that can adapt to repeated patterns
4. Third-person 3D court vertical slice
5. Career mode with at least 3 locations
6. Local multiplayer release candidate
7. Online beta (optional)

## Practical Next Step (This Week)

If you want to start immediately, build a **2D rally prototype** with only:

- One court
- One player + one AI
- Serve, return, score
- Three shot outcomes (flat, lob, kill)

Then run short playtests and tune only ball feel and movement before adding content.
