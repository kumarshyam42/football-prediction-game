# Design Critique: games.shyamkumar.com

*Performed using Interface Craft's Design Critique methodology (Josh Puckett)*
*Date: February 2026*

---

## Context

This is a **fantasy football prediction league dashboard** for a friend group called "You Know Nothing FC." It shows a leaderboard, upcoming fixtures, and recent results. The target users are a small group of friends checking scores casually — likely on mobile during match days. The emotional context is **social, competitive, and fun** — this should feel like friendly banter, not a Bloomberg terminal.

---

## First Impressions

The dark mode is bold and sports-appropriate — it immediately signals "match day." The podium visualization for the top 3 is a strong concept; it communicates hierarchy without the user needing to read numbers. But my eye doesn't land anywhere confidently. The leaderboard podium, the rows below it, upcoming games, and recent results all sit at roughly the same visual weight, creating a flat reading experience. The green-on-dark color scheme works but is applied inconsistently — green means "points" in the leaderboard, "score" in results, and "countdown" in upcoming games, diluting its meaning. The overall impression is a solid MVP with good bones that needs a tighter visual system.

---

## Visual Design

**Inconsistent green usage** — Green (#22c55e) is used for at least four different purposes: leaderboard points (12 pts), score numbers (3 - 0), the "FINAL" badge, and the countdown badge (1d 15h). When one color means everything, it means nothing. The points and scores could stay green (they're the primary data), but the badges should use a neutral or secondary color to create separation.

**The podium bars lack definition** — The three podium columns at positions 1-3 are a slightly lighter shade of the background with no border or shadow. They nearly disappear into the dark surface behind them. The podium is the hero moment of the leaderboard — the visual payoff for being in the top 3 — and right now it reads as three ghostly rectangles. A subtle border, a gradient fill, or even a slight glow on the #1 bar would make this feel earned.

**Orange numbers on positions 4-6 are unexplained** — The point values for Vikas (9), Yash (6), and Nikhil (3) appear in orange, while the top 3 use green. There's no legend or visible logic for why the color shifts. If orange means "below average" or "lower tier," that intent isn't communicated. The two-color system (green vs. orange) implies a threshold that doesn't exist in the data — Viggy at #3 has 9 pts in green, while Vikas at #4 also has 9 pts but in orange.

**Typographic scale is narrow** — Section headers (LEADERBOARD, UPCOMING GAMES, RECENT RESULTS) are uppercase and bold, which is good. But the hierarchy below them flattens quickly. Player names, point labels ("POINTS," "GAMES," "AVG"), dates, and team names all sit in a similar size range. The most important data — the scores in Recent Results (3-0, 2-0, 3-2) — are appropriately large, which is the one place the hierarchy lands correctly.

**"vs" badges lack consistency** — The "vs" indicator in Upcoming Games uses a dark pill, while the same element in Recent Results uses an identical-looking pill. This is fine for consistency, but the pill's visual weight competes with the team names around it. A lighter-touch separator (a simple dash or smaller text) would let the team names breathe.

**Spacing between sections is generous but uniform** — The gap between Leaderboard and Upcoming Games and between Upcoming Games and Recent Results appears identical. The leaderboard is the largest and most data-dense section; it deserves more breathing room from the next section. Uniform spacing makes every section feel equally important, which works against the natural hierarchy of "who's winning" > "what's next" > "what happened."

---

## Interface Design

**We're missing a focusing mechanism.** The page loads and all three sections compete equally. The leaderboard is clearly the primary content (it's the whole point of a prediction league), but it doesn't command the viewport. A stronger visual treatment for the podium area — larger text, more contrast, or a subtle background card — would make the hierarchy undeniable.

**We're missing an opportunity to reward the leader.** Shyam is #1 with a small crown emoji above the number. That's the entire celebration. In a friend group league, being #1 should feel like a moment. A gold accent color on the name, a slightly larger type treatment, or a more prominent crown would make the top spot feel worth competing for. Right now, #1 and #2 look nearly identical at a glance.

**The leaderboard splits into two incompatible layouts.** Positions 1-3 use a podium visualization (vertical, centered, visual). Positions 4-6 use a table-row layout (horizontal, left-aligned, data-dense). These are two completely different design languages for the same data. The transition is jarring — you go from "infographic" to "spreadsheet" with no bridging. Either extend the podium concept to all 6 players, or use a unified list where the top 3 get subtle visual enhancements (gold/silver/bronze accents, slightly larger rows).

**The "per game" average is buried.** In the podium section, "2.40 per game" sits in small gray text below the points. In the table rows, it's labeled "AVG" in a column. This is actually the most meaningful stat in a prediction league (it normalizes for games played), but it's treated as secondary everywhere. If six friends are comparing performance, average points per game is the fairest measure — it deserves more prominence.

**Upcoming Games shows a single match with no user action.** The section displays Brentford vs Arsenal with a countdown. But there's no indication of what the user should *do*. Can they make a prediction? Have they already predicted? Is this just informational? The lack of a call-to-action makes this section passive. If predictions are submitted elsewhere, a status indicator ("You predicted: Arsenal 2-1") would make this section useful rather than decorative.

---

## Consistency & Conventions

**The three Recent Results cards have inconsistent text wrapping.** "ARSENAL vs SUNDERLAND" fits on one line per team, but "MANCHESTER UNITED vs TOTTENHAM HOTSPUR" wraps to two lines, creating uneven card heights. The cards should either accommodate the longest team names gracefully (shorter team name text, or abbreviations like "Man Utd") or use a fixed height with truncation.

**Date formatting shifts subtly.** Upcoming Games shows "Fri, Feb 13, 4:00 AM" while Recent Results shows "Sat, Feb 7, 11:00 PM" and "Sun, Feb 1, 10:00 PM." The format is consistent, but the inclusion of the day-of-week varies in usefulness — for upcoming games it helps planning, but for past results it's noise. Past results could simplify to just "Feb 7" since the day of week no longer matters.

**Section headers use emoji + uppercase text** (🏆 LEADERBOARD, 📅 UPCOMING GAMES, ✅ RECENT RESULTS). The emojis add personality appropriate for a friend group app, but they render differently across platforms. On some devices the calendar emoji (📅) shows "17" while on others it's blank. Consider pairing with (or replacing with) consistent icon components for cross-platform reliability.

**The "FINAL" badge and "1d 15h" badge use the same green pill style** for opposite meanings — one means "this is over" and the other means "this hasn't started." Status badges should visually distinguish between completed and pending states. A muted gray or white for "FINAL" would separate it from the active green countdown.

---

## User Context

The user is likely a friend checking the league during a break or after a match. They want to answer three questions fast: **"Where do I stand?" → "What's coming up?" → "What just happened?"** The current layout answers all three, which is good structural design.

But the emotional tone is flat. This is a *friend group league* — the most fun part is the social competition. The interface treats everyone's data identically, like a corporate dashboard. There's no personality in the rankings. Being dead last should feel different from being #1. The current design is informational when it should be *expressive*.

**Uncommon care would look like:** showing the point gap between you and the person above you ("2 pts behind Yuri"), animating position changes after a match week ("Vikas ↑2"), or giving the last-place player a playful commiseration message. These small touches would make the app feel like it was built by someone in the group, not generated.

---

## Top Opportunities

1. **Unify the leaderboard layout** — The podium-to-table split creates two visual languages for one dataset. Either extend the podium or enrich the list; don't do both.

2. **Differentiate status badges** — "FINAL" (completed) and "1d 15h" (countdown) use the same green pill. Give completed states a neutral/muted treatment so green consistently means "active/live."

3. **Make the podium bars visible** — The #1/#2/#3 columns nearly vanish into the background. These are the reward for winning — give them contrast, a fill gradient, or a border.

4. **Add a call-to-action to Upcoming Games** — Show the user's prediction status or a "Predict" button. Without an action, this section is a passive calendar entry.

5. **Celebrate rank differences** — Use gold/silver/bronze accents, show point gaps between positions, or add movement indicators. Make the leaderboard feel competitive, not just informational.
