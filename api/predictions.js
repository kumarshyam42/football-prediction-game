const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all predictions for a game
      const { gameId } = req.query;

      if (!gameId) {
        return res.status(400).json({ error: 'gameId is required' });
      }

      const { rows } = await sql`
        SELECT
          p.id,
          p.predicted_home_score,
          p.predicted_away_score,
          p.created_at,
          p.updated_at,
          pl.id as player_id,
          pl.name as player_name
        FROM predictions p
        JOIN players pl ON p.player_id = pl.id
        WHERE p.game_id = ${gameId}
        ORDER BY p.created_at ASC
      `;

      return res.status(200).json({ predictions: rows });

    } else if (req.method === 'POST') {
      // Create or update prediction
      const { player_id, game_id, predicted_home_score, predicted_away_score } = req.body;

      if (!player_id || !game_id || predicted_home_score === undefined || predicted_away_score === undefined) {
        return res.status(400).json({
          error: 'player_id, game_id, predicted_home_score, and predicted_away_score are required'
        });
      }

      if (predicted_home_score < 0 || predicted_away_score < 0) {
        return res.status(400).json({ error: 'Scores cannot be negative' });
      }

      // Check if game exists and get kickoff time
      const { rows: games } = await sql`
        SELECT kickoff_datetime
        FROM games
        WHERE id = ${game_id}
      `;

      if (games.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Check if kickoff has passed (lock predictions at kickoff time)
      const kickoffTime = new Date(games[0].kickoff_datetime);
      const now = new Date();

      if (now >= kickoffTime) {
        return res.status(403).json({
          error: 'Predictions are locked. Kickoff time has passed.'
        });
      }

      // Upsert prediction (insert or update if exists)
      const { rows: prediction } = await sql`
        INSERT INTO predictions (player_id, game_id, predicted_home_score, predicted_away_score)
        VALUES (${player_id}, ${game_id}, ${predicted_home_score}, ${predicted_away_score})
        ON CONFLICT (player_id, game_id)
        DO UPDATE SET
          predicted_home_score = ${predicted_home_score},
          predicted_away_score = ${predicted_away_score},
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, player_id, game_id, predicted_home_score, predicted_away_score, created_at, updated_at
      `;

      return res.status(200).json({ prediction: prediction[0] });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Predictions API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
