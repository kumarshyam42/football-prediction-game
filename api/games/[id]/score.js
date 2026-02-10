const { sql } = require('@vercel/postgres');
const { isAdmin } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'PUT') {
      // Update final score (admin only)
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Game ID is required' });
      }

      const { final_home_score, final_away_score } = req.body;

      if (final_home_score === undefined || final_away_score === undefined) {
        return res.status(400).json({
          error: 'final_home_score and final_away_score are required'
        });
      }

      const homeScore = parseInt(final_home_score, 10);
      const awayScore = parseInt(final_away_score, 10);

      if (isNaN(homeScore) || isNaN(awayScore) || homeScore !== Number(final_home_score) || awayScore !== Number(final_away_score)) {
        return res.status(400).json({ error: 'Scores must be whole numbers' });
      }

      if (homeScore < 0 || homeScore > 99 || awayScore < 0 || awayScore > 99) {
        return res.status(400).json({ error: 'Scores must be between 0 and 99' });
      }

      const { rows: updatedGame } = await sql`
        UPDATE games
        SET final_home_score = ${homeScore},
            final_away_score = ${awayScore}
        WHERE id = ${id}
        RETURNING id, home_team, away_team, kickoff_datetime,
                  final_home_score, final_away_score
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
    console.error('Update score API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
