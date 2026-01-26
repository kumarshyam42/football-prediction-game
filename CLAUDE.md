# Claude Instructions for You Know Nothing FC

## User Profile
- **Not a programmer** - uses natural language, doesn't type git commands
- Wants changes tested before going live to production

## Git Workflow - IMPORTANT

**ALWAYS use feature branches for any changes. Never push directly to main unless explicitly told "push to production" or "looks good".**

### Standard Workflow for ALL Changes:

1. **Create a feature branch** automatically (use descriptive names like `feature/add-share-button` or `fix/prediction-error`)
   ```bash
   git checkout -b feature/description
   ```

2. **Make changes** and commit to the feature branch
   ```bash
   git add .
   git commit -m "Description"
   git push origin feature/description
   ```

3. **Tell the user**: "I've made the changes on a test branch. Vercel will deploy it to a preview URL in about 30-60 seconds. Once deployed, you can test it at the preview URL shown in your Vercel dashboard, or I can check the deployment status for you."

4. **Wait for user confirmation**:
   - User tests the preview URL
   - User says "looks good", "push to production", or "go live"

5. **Merge to main** and clean up:
   ```bash
   git checkout main
   git pull origin main
   git merge feature/description
   git push origin main
   git branch -d feature/description
   git push origin --delete feature/description
   ```

6. **Tell the user**: "Pushed to production! Live at games.shyamkumar.com in about 30-60 seconds."

### Exceptions - When to Push Directly to Main:

- Documentation-only changes (README.md, CLAUDE.md)
- Very minor text fixes that don't affect functionality
- User explicitly says "just push it" or "no need to test"

### If User Finds Issues on Preview:

- Stay on the same feature branch
- Make fixes
- Push again to update the preview
- Repeat until user approves

## Project Context

### Tech Stack
- Frontend: Vanilla HTML/CSS/JavaScript
- Backend: Vercel Serverless Functions (Node.js)
- Database: Vercel Postgres
- Deployment: Vercel (auto-deploy on push to main)

### Project Structure
- `/api/` - Serverless function endpoints
- `/public/` - Frontend files (HTML, CSS, JS)
- `/db/` - Database schema

### Key Files
- `public/index.html` - Home page
- `public/game.html` - Game detail page
- `public/app.js` - Home page JavaScript
- `public/game-detail.js` - Game detail JavaScript
- `public/styles.css` - All styles
- `api/predictions.js` - Prediction CRUD
- `api/games.js` - Game management
- `api/players.js` - Player management
- `api/leaderboard.js` - Leaderboard calculation

### Admin Endpoints
- `/admin.html?key=SECRET` - Admin panel
- `/cleanup.html?key=SECRET` - Database cleanup
- `/setup.html?key=SECRET` - Database schema setup
- `/migrate.html?key=SECRET` - Database migrations

### Important Notes
- Player names stored in localStorage (no authentication)
- Predictions lock at exact kickoff time
- Points: 3 for correct result + 3 for exact score (max 6 per game)
- Leaderboard sorted by points per prediction, then total points

### Design Principles
- Clean, modern dark mode aesthetic
- Mobile-first responsive design
- No emojis unless user requests
- Follow UI quality standards from /Users/sk/CLAUDE.md
- Keep it simple - avoid over-engineering

## Common Tasks

### Adding a new API endpoint
1. Create feature branch
2. Add file in `/api/` directory
3. Test locally with `vercel dev` if database-modifying
4. Push to feature branch, get preview URL
5. Wait for user approval before merging

### Modifying UI
1. Create feature branch
2. Update HTML/CSS/JS in `/public/`
3. Push to feature branch, user tests preview
4. Merge when approved

### Database changes
1. Create migration endpoint in `/api/admin/`
2. Test very carefully (preview uses production database!)
3. Consider testing locally first with `vercel dev`

## Database Schema

### Tables

**players**
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL UNIQUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**games**
```sql
id SERIAL PRIMARY KEY
home_team TEXT NOT NULL
away_team TEXT NOT NULL
kickoff_datetime TIMESTAMP NOT NULL
final_home_score INTEGER (nullable)
final_away_score INTEGER (nullable)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

**predictions**
```sql
id SERIAL PRIMARY KEY
player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE
game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE
predicted_home_score INTEGER NOT NULL
predicted_away_score INTEGER NOT NULL
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
UNIQUE(player_id, game_id)
```

### Key Constraints
- Players have unique names
- Each player can only have ONE prediction per game (enforced by UNIQUE constraint)
- Deleting a player cascades to delete their predictions
- Deleting a game cascades to delete all predictions for that game

## Scoring Logic

### Points Calculation
For each prediction compared to final score:
1. **Correct Result** = 3 points
   - Home win: final_home_score > final_away_score
   - Draw: final_home_score = final_away_score
   - Away win: final_away_score > final_home_score
2. **Exact Score** = 3 points
   - Both predicted_home_score and predicted_away_score match exactly
3. **Maximum** = 6 points per game (3 + 3)

### Leaderboard Ranking
1. Primary sort: Points per prediction (DESC)
   - `total_points / games_predicted`
   - Rewards consistency over volume
2. Secondary sort: Total points (DESC)
   - Tie-breaker when points per prediction is equal

### Edge Cases
- Players with 0 predictions don't appear on leaderboard
- Only completed games (with final scores) count toward points
- Predictions can be updated multiple times before kickoff
- After kickoff, predictions are locked (cannot create or modify)

## Known Issues & Gotchas

### Browser Caching
- **Problem**: Browsers aggressively cache JavaScript/CSS files
- **Symptom**: Users see old version even after deployment
- **Solution**: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) or incognito mode
- **Prevention**: Consider adding cache-busting query params in future

### Preview Deployments Share Production Database
- **Warning**: Feature branches use the SAME database as production
- **Impact**: Testing database changes can affect live data
- **Mitigation**: Be very careful with migrations, test locally first
- **Safe to test**: UI changes, read-only operations

### LocalStorage Limitations
- Player identity stored in browser localStorage
- Clearing browser data = losing player association
- No way to "transfer" identity to another device
- No password/authentication = anyone can predict as anyone

### Timezone Handling
- All times stored in database without timezone
- Kickoff times displayed in user's local timezone
- Potential confusion if game creator and player are in different timezones

## Environment Variables

Required in Vercel dashboard:
- `POSTGRES_URL` - Vercel Postgres connection string (auto-set by Vercel)
- `ADMIN_SECRET` - Secret key for admin endpoints (set manually)

## Troubleshooting Guide

### "Internal Server Error" on Prediction Submission
**Likely causes:**
1. Database column missing (check schema with `/api/admin/diagnose?key=SECRET`)
2. Player doesn't exist (localStorage corrupted)
3. Game doesn't exist
4. Kickoff time has passed

**Debug steps:**
1. Check Vercel function logs
2. Verify database schema with diagnose endpoint
3. Try clearing localStorage and re-entering name

### Players Not Appearing on Leaderboard
**Likely causes:**
1. Player has no predictions
2. No games have final scores yet
3. Database query error

**Debug steps:**
1. Check if player exists in database
2. Check if they have predictions
3. Verify at least one game has final score

### Predictions Not Locking at Kickoff
**Check:**
1. Kickoff time in database is correct
2. Server time vs. local time (use Date.now() to compare)
3. Prediction API logic for time comparison

## Testing Checklist

Before approving changes to production:

### Critical User Flows
- [ ] New user can enter name and see home page
- [ ] User can submit prediction before kickoff
- [ ] User can update prediction before kickoff
- [ ] Prediction is locked after kickoff
- [ ] All predictions visible on game detail page
- [ ] Leaderboard displays correctly after final scores entered
- [ ] Admin can create games
- [ ] Admin can enter final scores

### UI Testing
- [ ] Test on mobile viewport
- [ ] Test on desktop viewport
- [ ] Check all links work
- [ ] Verify no console errors
- [ ] Confirm no visual glitches

### Cross-browser (if time permits)
- [ ] Chrome/Edge
- [ ] Safari (if on Mac)
- [ ] Firefox

## Session History & Important Decisions

### Why "Switch Player" Button Was Removed
- Originally had a button to change player name
- **Problem**: Clicking it created a NEW player, didn't edit the existing one
- **Confusion**: Users expected to edit their name, not create new identity
- **Decision**: Removed button entirely - users set name once and stick with it
- **Rationale**: Simpler UX, prevents accidental identity changes

### Why No Staging Environment (Yet)
- Vercel preview deployments provide testing URLs automatically
- Downside: They share production database
- Decision: Use preview URLs for UI testing, be careful with database changes
- Future: Could set up full staging with separate database if needed

### Database Migration Approach
- Created admin endpoints for schema changes (`/migrate.html`, `/setup.html`)
- Allows running migrations via UI instead of SQL console
- Safer than direct database access for non-programmers

## Future Considerations

### Potential Features to Add
- Email notifications when games are about to lock
- Share prediction functionality (social media)
- Historical stats (season-long tracking)
- Player profiles with stats
- Multiple leagues/competitions

### Technical Debt
- No authentication system (relies on localStorage)
- No way to recover "lost" player identity
- Timezone handling could be more robust
- No automated tests
- Consider adding cache-busting for static assets

### Scalability Notes
- Current setup fine for ~100 concurrent users
- Database indexes in place for common queries
- Vercel serverless functions scale automatically
- Consider connection pooling if database connections become an issue
