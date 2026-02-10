# You Know Nothing FC ⚽

A snarky football prediction game where players prove they know nothing about football by predicting match scores and competing on a leaderboard.

## Features

- 🎯 Predict scores for upcoming football matches
- 🏆 Leaderboard with points per prediction ranking
- 📱 Mobile-friendly dark mode interface
- ⚡ Real-time countdown to kickoff
- 👥 See all player predictions immediately
- 🔒 Predictions lock at kickoff time

## Scoring System

- **3 points** for correct result (win/draw/loss)
- **3 points** for exact scoreline
- **Maximum 6 points** per game

Leaderboard ranks by points per prediction, then total points.

## Tech Stack

- Frontend: Vanilla HTML/CSS/JavaScript
- Backend: Vercel Serverless Functions (Node.js)
- Database: Vercel Postgres
- Hosting: Vercel

## Local Development

### Prerequisites

- Node.js 18+ installed
- Vercel CLI installed: `npm install -g vercel`
- Vercel account

### Setup

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Create Vercel Postgres database:**
   - Go to your Vercel project dashboard
   - Navigate to Storage → Create Database → Postgres
   - Copy the connection string

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add:
   - `POSTGRES_URL` - your Vercel Postgres connection string
   - `ADMIN_SECRET` - a secure random string for admin access

4. **Initialize the database:**

   Connect to your Vercel Postgres database and run the schema:
   ```bash
   # Using Vercel dashboard SQL editor or psql
   psql $POSTGRES_URL < db/schema.sql
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Development URLs

- **Home:** `http://localhost:3000`
- **Game Detail:** `http://localhost:3000/game.html?id={gameId}`
- **Admin:** `http://localhost:3000/admin.html` (enter admin key when prompted)

## Deployment

1. **Link to Vercel:**
   ```bash
   vercel link
   ```

2. **Set environment variables in Vercel:**
   ```bash
   vercel env add POSTGRES_URL
   vercel env add ADMIN_SECRET
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

## Admin Usage

Access the admin panel at `/admin.html` and enter your admin key when prompted. From there you can:

- Create new games (set teams and kickoff time)
- Enter final scores for completed games
- Edit or delete games

The admin key is sent via HTTP header (`x-admin-key`), never in the URL.

## Project Structure

```
/
├── api/                    # Vercel serverless functions
│   ├── players.js         # Player CRUD endpoints
│   ├── games.js           # Games list and create
│   ├── games/
│   │   └── [id]/
│   │       ├── index.js   # Delete game
│   │       ├── score.js   # Update final score
│   │       └── update.js  # Edit game details
│   ├── predictions.js     # Prediction CRUD endpoints
│   ├── leaderboard.js     # Leaderboard calculation
│   ├── player-predictions.js  # Per-player prediction history
│   └── admin/             # Admin-only endpoints
│       ├── setup.js       # Database schema init
│       ├── migrate.js     # Schema migrations
│       ├── cleanup.js     # Database cleanup
│       └── diagnose.js    # Database diagnostics
├── lib/                   # Shared modules (outside /api/ to avoid function limit)
│   └── auth.js            # Admin authentication (timing-safe)
├── public/                # Static frontend files
│   ├── index.html         # Home page
│   ├── game.html          # Game detail page
│   ├── admin.html         # Admin panel
│   ├── setup.html         # Database setup UI
│   ├── migrate.html       # Database migration UI
│   ├── cleanup.html       # Database cleanup UI
│   ├── styles.css         # Dark mode styles
│   ├── app.js             # Home page JavaScript
│   ├── game-detail.js     # Game detail JavaScript
│   └── admin.js           # Admin panel JavaScript
├── db/
│   └── schema.sql         # Database schema
├── package.json
├── vercel.json            # Routing, security headers, CORS
└── README.md
```

## Database Schema

### tables

**games**
- `id` (serial primary key)
- `home_team` (text)
- `away_team` (text)
- `kickoff_datetime` (timestamp)
- `final_home_score` (integer, nullable)
- `final_away_score` (integer, nullable)

**players**
- `id` (serial primary key)
- `name` (text, unique)

**predictions**
- `id` (serial primary key)
- `player_id` (integer, foreign key → players.id)
- `game_id` (integer, foreign key → games.id)
- `predicted_home_score` (integer)
- `predicted_away_score` (integer)
- Unique constraint on `(player_id, game_id)`

## License

MIT
