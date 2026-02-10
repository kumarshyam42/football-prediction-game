const { sql } = require('@vercel/postgres');
const { isAdmin } = require('../../lib/auth');

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

    const { keepPlayers } = req.body || {};

    console.log('Starting database cleanup...');

    // Delete predictions first (foreign key constraint)
    const { rowCount: predictionsDeleted } = await sql`DELETE FROM predictions`;
    console.log(`Deleted ${predictionsDeleted} predictions`);

    // Delete games
    const { rowCount: gamesDeleted } = await sql`DELETE FROM games`;
    console.log(`Deleted ${gamesDeleted} games`);

    // Delete players (unless keepPlayers is true)
    let playersDeleted = 0;
    if (!keepPlayers) {
      const result = await sql`DELETE FROM players`;
      playersDeleted = result.rowCount;
      console.log(`Deleted ${playersDeleted} players`);
    }

    // Reset sequences to start IDs from 1
    await sql`ALTER SEQUENCE games_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE predictions_id_seq RESTART WITH 1`;
    if (!keepPlayers) {
      await sql`ALTER SEQUENCE players_id_seq RESTART WITH 1`;
    }
    console.log('ID sequences reset');

    return res.status(200).json({
      success: true,
      message: 'Database cleanup complete',
      deleted: {
        predictions: predictionsDeleted,
        games: gamesDeleted,
        players: keepPlayers ? 0 : playersDeleted
      }
    });

  } catch (error) {
    console.error('Cleanup API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
