const { sql } = require('@vercel/postgres');
const { isAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // List all players
      const { rows } = await sql`
        SELECT id, name, created_at
        FROM players
        ORDER BY name ASC
      `;

      return res.status(200).json({ players: rows });

    } else if (req.method === 'POST') {
      // Create or get player by name
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Player name is required' });
      }

      const trimmedName = name.trim();

      if (trimmedName.length > 100) {
        return res.status(400).json({ error: 'Player name is too long (max 100 characters)' });
      }

      // Try to get existing player first
      const { rows: existing } = await sql`
        SELECT id, name, created_at
        FROM players
        WHERE name = ${trimmedName}
      `;

      if (existing.length > 0) {
        return res.status(200).json({ player: existing[0], created: false });
      }

      // Create new player
      const { rows: newPlayer } = await sql`
        INSERT INTO players (name)
        VALUES (${trimmedName})
        RETURNING id, name, created_at
      `;

      return res.status(201).json({ player: newPlayer[0], created: true });

    } else if (req.method === 'DELETE') {
      // Admin-only: delete a player by ID
      if (!isAdmin(req)) {
        return res.status(403).json({ error: 'Unauthorized - admin key required' });
      }

      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Player id is required' });
      }

      const playerId = parseInt(id, 10);
      if (isNaN(playerId)) {
        return res.status(400).json({ error: 'Invalid player id' });
      }

      // CASCADE will handle deleting their predictions too
      const { rowCount } = await sql`
        DELETE FROM players WHERE id = ${playerId}
      `;

      if (rowCount === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      return res.status(200).json({ success: true, deleted: playerId });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Players API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
