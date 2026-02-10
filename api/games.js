const { sql } = require('@vercel/postgres');
const { isAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // List all games
      const { rows } = await sql`
        SELECT
          id,
          home_team,
          away_team,
          kickoff_datetime,
          final_home_score,
          final_away_score,
          created_at
        FROM games
        ORDER BY kickoff_datetime ASC
      `;

      return res.status(200).json({ games: rows });

    } else if (req.method === 'POST') {
      // Create new game (admin only)
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { home_team, away_team, kickoff_datetime } = req.body;

      if (!home_team || !away_team || !kickoff_datetime) {
        return res.status(400).json({
          error: 'home_team, away_team, and kickoff_datetime are required'
        });
      }

      if (home_team.trim().length > 100 || away_team.trim().length > 100) {
        return res.status(400).json({ error: 'Team names are too long (max 100 characters)' });
      }

      // Validate that kickoff time is in the future
      const kickoffDate = new Date(kickoff_datetime);
      const now = new Date();

      if (kickoffDate <= now) {
        return res.status(400).json({
          error: 'Kickoff time must be in the future'
        });
      }

      const { rows: newGame } = await sql`
        INSERT INTO games (home_team, away_team, kickoff_datetime)
        VALUES (${home_team.trim()}, ${away_team.trim()}, ${kickoff_datetime})
        RETURNING id, home_team, away_team, kickoff_datetime, created_at
      `;

      return res.status(201).json({ game: newGame[0] });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Games API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
