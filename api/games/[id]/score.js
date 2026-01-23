import { sql } from '@vercel/postgres';

// Helper function to check admin authentication
function isAdmin(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = req.headers['x-admin-key'] || req.query.key;
  return adminSecret && providedKey === adminSecret;
}

export default async function handler(req, res) {
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

      if (final_home_score < 0 || final_away_score < 0) {
        return res.status(400).json({ error: 'Scores cannot be negative' });
      }

      const { rows: updatedGame } = await sql`
        UPDATE games
        SET final_home_score = ${final_home_score},
            final_away_score = ${final_away_score}
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
}
