const { sql } = require('@vercel/postgres');
const { isAdmin } = require('../../../lib/auth');

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'PUT') {
      // Update game (admin only)
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Game ID is required' });
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

      const { rows: updatedGame } = await sql`
        UPDATE games
        SET home_team = ${home_team.trim()},
            away_team = ${away_team.trim()},
            kickoff_datetime = ${kickoff_datetime}
        WHERE id = ${id}
        RETURNING id, home_team, away_team, kickoff_datetime, final_home_score, final_away_score
      `;

      if (updatedGame.length === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({ game: updatedGame[0] });

    } else {
      res.setHeader('Allow', ['PUT']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Update game API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
