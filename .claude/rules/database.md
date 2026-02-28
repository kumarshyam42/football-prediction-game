# Database Schema & Scoring

## Tables

### players
```sql
id SERIAL PRIMARY KEY
name TEXT NOT NULL UNIQUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### games
```sql
id SERIAL PRIMARY KEY
home_team TEXT NOT NULL
away_team TEXT NOT NULL
kickoff_datetime TIMESTAMP NOT NULL
final_home_score INTEGER (nullable)
final_away_score INTEGER (nullable)
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### predictions
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

## Key Constraints
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
1. Primary sort: Points per prediction (DESC) — `total_points / games_predicted` — rewards consistency over volume
2. Secondary sort: Total points (DESC) — tie-breaker when points per prediction is equal

### Edge Cases
- Players with 0 predictions don't appear on leaderboard
- Only completed games (with final scores) count toward points
- Predictions can be updated multiple times before kickoff
- After kickoff, predictions are locked (cannot create or modify)

## Note
`calculatePoints` function is duplicated in `api/leaderboard.js`, `api/player-predictions.js`, and `public/game-detail.js`.
