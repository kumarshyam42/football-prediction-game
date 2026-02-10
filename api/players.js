const { sql } = require('@vercel/postgres');

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

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Players API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
