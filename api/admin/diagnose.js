const { sql } = require('@vercel/postgres');
const { isAdmin } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

    // Admin authentication required
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Unauthorized - admin key required' });
    }

    // Check predictions table columns
    const { rows: columns } = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'predictions'
      ORDER BY ordinal_position
    `;

    // Count rows in each table
    const { rows: playerCount } = await sql`SELECT COUNT(*) as count FROM players`;
    const { rows: gameCount } = await sql`SELECT COUNT(*) as count FROM games`;
    const { rows: predictionCount } = await sql`SELECT COUNT(*) as count FROM predictions`;

    return res.status(200).json({
      success: true,
      predictions_columns: columns,
      row_counts: {
        players: playerCount[0].count,
        games: gameCount[0].count,
        predictions: predictionCount[0].count
      }
    });

  } catch (error) {
    console.error('Diagnose API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
