const { sql } = require('@vercel/postgres');

// Helper function to check admin authentication
function isAdmin(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = req.headers['x-admin-key'] || req.query.key;
  return adminSecret && providedKey === adminSecret;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    // Admin authentication required
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized - admin key required' });
    }

    console.log('Starting database setup/verification...');

    // Create players table
    await sql`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Players table verified');

    // Create games table
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        kickoff_datetime TIMESTAMP NOT NULL,
        final_home_score INTEGER,
        final_away_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Games table verified');

    // Create predictions table
    await sql`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
        game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
        predicted_home_score INTEGER NOT NULL,
        predicted_away_score INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(player_id, game_id)
      )
    `;
    console.log('Predictions table verified');

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_games_kickoff ON games(kickoff_datetime)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_predictions_player ON predictions(player_id)`;
    console.log('Indexes verified');

    return res.status(200).json({
      success: true,
      message: 'Database schema verified and ready'
    });

  } catch (error) {
    console.error('Setup API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
