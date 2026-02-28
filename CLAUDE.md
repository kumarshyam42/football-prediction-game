# You Know Nothing FC

Detailed rules in `.claude/rules/` — database schema & scoring, security hardening, troubleshooting & testing.

## User Profile
- **Not a programmer** — uses natural language, doesn't type git commands
- Wants changes tested before going live to production

## Project-Specific Workflow
- After pushing a feature branch, tell the user: "Changes are on a test branch. Vercel will deploy a preview URL in about 30-60 seconds."
- Wait for user confirmation ("looks good", "push to production", "go live") before merging to main
- After merging, tell the user: "Pushed to production! Live at games.shyamkumar.com in about 30-60 seconds."
- If user finds issues on preview: stay on same feature branch, fix, push again, repeat until approved
- Exceptions for direct-to-main: documentation-only changes, very minor text fixes, or user explicitly says "just push it"

## Tech Stack
- Frontend: Vanilla HTML/CSS/JavaScript (not React)
- Backend: Vercel Serverless Functions (Node.js)
- Database: Vercel Postgres
- Deployment: Vercel (auto-deploy on push to main)
- Live URL: `games.shyamkumar.com`

## Project Structure
- `/api/` — Serverless function endpoints
- `/lib/` — Shared modules (must be outside `/api/` to avoid counting as serverless functions)
- `/public/` — Frontend files (HTML, CSS, JS)
- `/db/` — Database schema

## Key Files
- `public/index.html` — Home page
- `public/game.html` — Game detail page
- `public/app.js` — Home page JavaScript
- `public/game-detail.js` — Game detail JavaScript
- `public/styles.css` — All styles
- `api/predictions.js` — Prediction CRUD
- `api/games.js` — Game management
- `api/players.js` — Player management
- `api/leaderboard.js` — Leaderboard calculation
- `api/player-predictions.js` — Per-player prediction history with points
- `lib/auth.js` — Shared admin authentication

## Admin Endpoints
- `/admin.html` — Admin panel (login prompt)
- `/cleanup.html` — Database cleanup (login prompt)
- `/setup.html` — Database schema setup (login prompt)
- `/migrate.html` — Database migrations (login prompt)
- Admin key sent via `x-admin-key` header (never in URL), stored in sessionStorage

## Important Notes
- Player names stored in localStorage (no authentication)
- Predictions lock at exact kickoff time
- Points: 3 for correct result + 3 for exact score (max 6 per game)
- Leaderboard sorted by points per prediction, then total points
- Dark mode aesthetic, mobile-first responsive design

## Environment Variables
Required in Vercel dashboard:
- `POSTGRES_URL` — Vercel Postgres connection string (auto-set by Vercel)
- `ADMIN_SECRET` — Secret key for admin endpoints (set manually)

## Design Decisions
- **Switch Player button removed** — clicking it created a NEW player instead of editing. Removed entirely for simpler UX.
- **No staging environment** — Vercel preview deployments provide testing URLs, but share production database. Use previews for UI testing, be careful with database changes.
- **Player prediction history** — clicking any player name on leaderboard opens a modal with full history. Points color-coded: green (6 pts), gold (3 pts), muted (0 pts).
- **Database migrations via admin UI** — admin endpoints for schema changes instead of direct SQL console. Safer for non-programmers.

## Technical Debt
- No authentication system (relies on localStorage)
- No way to recover "lost" player identity
- Timezone handling could be more robust
- No automated tests
- Consider adding cache-busting for static assets
