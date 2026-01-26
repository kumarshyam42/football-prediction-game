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
