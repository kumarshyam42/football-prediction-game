# UI Polish Plan: games.shyamkumar.com

## Context

A design critique (Interface Craft methodology) identified 5 high-impact opportunities plus animation enhancements for the "You Know Nothing FC" football prediction league app. The app is vanilla HTML/CSS/JS deployed on Vercel — no framework, no build step. All changes touch 3 files.

**Branch strategy**: Create `feature/ui-polish` from `main` (per project CLAUDE.md).

---

## Files to Modify

| File | Path | Lines |
|------|------|-------|
| **styles.css** | `public/styles.css` | ~1,980 |
| **app.js** | `public/app.js` | ~514 |
| **index.html** | `public/index.html` | ~91 |

---

## Phase 1: Status Badge Differentiation

**Goal**: Green should mean "active/live" — not "completed." Change "Final" badges from green to neutral gray.

### styles.css
- Add `.badge-neutral` class after line 416 (alongside existing `.badge-success`, `.badge-warning`, `.badge-danger`):
  - `background: rgba(168, 162, 158, 0.12)`
  - `color: var(--text-muted)`
  - `border: 1px solid rgba(168, 162, 158, 0.25)`

### app.js
- Line 287: Change `badge badge-success` to `badge badge-neutral` in `displayCompletedGames()`

---

## Phase 2: Podium Pedestal Enhancement

**Goal**: Make the #1/#2/#3 pedestals visible and celebratory instead of ghostly rectangles.

### styles.css (lines 1027-1069)
- Replace the generic `--bg-tertiary → --bg-secondary` gradient on `.podium-pedestal` with medal-colored fills:
  - **1st**: Gold-tinted gradient (`rgba(212, 175, 55, 0.2)` → `0.05`), gold border, gold glow shadow
  - **2nd**: Silver-tinted gradient (`rgba(192, 192, 192, 0.15)` → `0.03`), silver border
  - **3rd**: Bronze-tinted gradient (`rgba(205, 127, 50, 0.15)` → `0.03`), bronze border
- Increase `::before` top stripe from `height: 3px` to `height: 4px` (line 1044)
- Add mobile override at `@media (max-width: 768px)` to reduce glow intensity

---

## Phase 3: Leaderboard Unification & Rank Celebration

**Goal**: Bridge the podium-to-list gap; make rankings feel competitive.

### app.js — `loadLeaderboard()` (lines 126-177)

**3A. Add divider between podium and list** (after line 149):
- Insert a `<div class="leaderboard-divider">` with subtle line + "Standings" label between podiumHtml and listHtml

**3B. Compute point gaps** (line 127):
- After `const rest = data.leaderboard.slice(3)`, compute each player's gap from the player above:
  ```js
  const gap = playerAbove.total_points - player.total_points;
  ```
- Display as `<span class="point-gap">${gap} pts behind</span>` (hidden on mobile via CSS)

**3C. Elevate average stat** (lines 158-170):
- Reorder `.player-stats` to show Avg first (with gold accent color, slightly larger), then Total, then Games
- Rename labels: "Per Game" (primary), "Total" (secondary), "Games"

### styles.css
- Add `.leaderboard-divider` styles (flex row, subtle gradient line, muted uppercase label)
- Add `.point-gap` styles (10px italic muted text, `display: none` on mobile)
- Add `.stat-avg .stat-value` override (color: `--accent-secondary`, font-size: 18px)

---

## Phase 4: Prediction Status on Upcoming Games

**Goal**: Answer "Have I predicted this match?" directly on the homepage.

### app.js

**4A. Add prediction fetch** (after line 99):
- New `playerPredictions = {}` variable (keyed by game_id)
- New `loadPlayerPredictions()` function: fetches `/api/player-predictions?playerId=${currentPlayer.id}`, stores results
- Call after `loadGames()` completes in `loadData()`, only if `currentPlayer` exists
- New `updateUpcomingPredictionStatus()` function: DOM-updates each card's footer

**4B. Modify upcoming game card template** (lines 239-255):
- Add `data-game-id="${game.id}"` to `.game-card`
- Add footer: `<div class="game-card-footer prediction-status">` with loading placeholder ("...")
- After `loadPlayerPredictions()` resolves, populate with:
  - Predicted: `"You predicted: 2-1"` (green text)
  - Not predicted: `"No prediction yet"` (gold text)
- Skip entirely if no player is logged in (no footer shown)

### styles.css
- Add `.prediction-indicator` styles (12px, flex, gap 6px)
- `.predicted` → green, `.not-predicted` → gold
- Reuse existing `.game-card-footer` (lines 612-625) — already has padding, bg, border-top

---

## Phase 5: Entrance Animations (Storyboard Principles)

**Goal**: Choreographed page-load sequence using Interface Craft's storyboard pattern — adapted for vanilla JS.

### Animation Storyboard

```
   0ms   Page loads, skeletons visible
 ~300ms  API data arrives, content renders
 300ms   Podium: 3rd place pedestal grows up
 500ms   Podium: 2nd place pedestal grows up
 700ms   Podium: 1st place pedestal grows up (climax)
 900ms   Podium: Player info fades in (all 3 together)
1000ms   Leaderboard rows stagger in (60ms apart)
1200ms   Game cards stagger in (60ms apart)
```

### app.js — top of file (after line 3)

Add timing constants:
```js
const ANIM = {
  STAGGER: 60,        // ms between staggered items
  ENTRANCE: 350,      // entrance animation duration
  PEDESTAL: 400,      // podium bar grow-up duration
  PEDESTAL_GAP: 200,  // delay between each podium reveal
  SCORE_COUNTUP: 600, // score count-up duration
};
```

### app.js — new functions

**`animateLeaderboard()`** — called at end of `loadLeaderboard()`:
- Check `prefers-reduced-motion` first; skip if reduced
- Set `.podium-pedestal`, `.podium-player`, `.leaderboard-row` to hidden state
- Reveal pedestals in order: 3rd → 2nd → 1st (grow from `scaleY(0)` with `transform-origin: bottom`)
- Reveal player info after pedestals settle
- Stagger list rows with 60ms gaps

**`animateGameCards(containerSelector)`** — called at end of `displayUpcomingGames()` and `displayCompletedGames()`:
- Stagger `.game-card` fade-in-up with 60ms gaps

**`animateScoreCountUp()`** — called at end of `displayCompletedGames()`:
- Animate `.score-number` from 0 → final value using `requestAnimationFrame`
- Ease-out cubic curve over 600ms

### styles.css — new keyframes (after line 1942)

```css
@keyframes pedestalGrow {
  from { transform: scaleY(0); opacity: 0; }
  to   { transform: scaleY(1); opacity: 1; }
}

@keyframes podiumReveal {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes rowSlideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes scoreReveal {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1); }
}
```

### styles.css — animation utility classes

```css
.anim-ready-pedestal  { transform: scaleY(0); transform-origin: bottom center; opacity: 0; }
.anim-ready-fade      { opacity: 0; transform: translateY(10px); }
.anim-ready-slide     { opacity: 0; transform: translateX(-12px); }
.anim-ready-card      { opacity: 0; transform: translateY(16px); }
```

### index.html (lines 21, 31, 40)
- Add `anim-orchestrated` class to the three `.card` divs
- Modify the existing `fadeInUp` rule (line 1928-1942) to exclude `.card.anim-orchestrated`

### Performance & accessibility
- All animations use only `transform` + `opacity` (GPU-accelerated)
- All JS animation functions check `window.matchMedia('(prefers-reduced-motion: reduce)')` and skip
- Existing `prefers-reduced-motion` CSS rule (line 868) provides fallback

---

## Phase 6: Mobile Responsive Tweaks

**Goal**: Ensure all new elements work at `max-width: 768px`.

### styles.css — within existing mobile breakpoints
- `.point-gap { display: none }` — too crowded on mobile
- `.prediction-indicator { font-size: 11px }` — slightly smaller
- `.podium-spot.first .podium-pedestal { box-shadow: 0 0 12px rgba(212,175,55,0.1) }` — reduce glow
- `.leaderboard-divider { margin: 12px 0 8px }` — tighter

---

## Implementation Order

| # | Phase | Depends On | Complexity |
|---|-------|-----------|------------|
| 1 | Badge differentiation | — | Small |
| 2 | Podium pedestals | — | Small |
| 3 | Leaderboard unification | Phase 1 vars | Medium |
| 4 | Prediction status | — | Medium-Large |
| 5 | Entrance animations | Phases 1-4 stable | Large |
| 6 | Mobile responsive | Phases 1-5 | Small |

Phases 1 and 2 can be done in parallel. Phase 5 should come last (animates the final DOM structure).

---

## Verification

1. `git checkout main && git pull && git checkout -b feature/ui-polish`
2. After each phase, push to branch and test Vercel preview URL
3. **Visual checks**:
   - Leaderboard: podium bars visibly glow with medal colors; divider bridges to list
   - "Final" badges are gray, countdown badges remain green
   - List rows show point gaps and prominent avg stat
   - Upcoming games show prediction status footer
   - Page load: podium grows up 3rd→2nd→1st, rows stagger in, cards stagger in
   - Scores count up from 0 in Recent Results
4. **Accessibility**: Enable "Reduce motion" in OS settings → all animations should be skipped
5. **Mobile**: Test at 375px width — point gaps hidden, prediction text readable, pedestals still glow
6. **Edge case**: No logged-in player → upcoming cards have no prediction footer
7. **Edge case**: Empty leaderboard → empty state unchanged, no animation errors
