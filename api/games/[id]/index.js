const { sql } = require('@vercel/postgres');

// Helper function to check admin authentication
function isAdmin(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = req.headers['x-admin-key'] || req.query.key;
  return adminSecret && providedKey === adminSecret;
}

module.exports = async function handler(req, res) {
  try {
    const { id } = req.query;

    if (req.method === 'DELETE') {
      // Delete game (admin only)
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Game ID is required' });
      }

      const { rowCount } = await sql`
        DELETE FROM games
        WHERE id = ${id}
      `;

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Game not found' });
      }

      return res.status(200).json({ message: 'Game deleted successfully' });

    } else {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Delete game API error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
