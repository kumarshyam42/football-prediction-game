const { sql } = require('@vercel/postgres');

// Helper function to check admin authentication
function isAdmin(req) {
  const adminSecret = process.env.ADMIN_SECRET;
  const providedKey = req.headers['x-admin-key'] || req.query.key;
  return adminSecret && providedKey === adminSecret;
}

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

    console.log('Starting database migration...');

    // Add updated_at column to predictions table if it doesn't exist
    try {
      await sql`
        ALTER TABLE predictions
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `;
      console.log('Added updated_at column to predictions table');
    } catch (error) {
      console.log('updated_at column might already exist:', error.message);
    }

    // Ensure all existing rows have updated_at set
    await sql`
      UPDATE predictions
      SET updated_at = created_at
      WHERE updated_at IS NULL
    `;
    console.log('Updated existing predictions with updated_at values');

    return res.status(200).json({
      success: true,
      message: 'Database migration complete'
    });

  } catch (error) {
    console.error('Migration API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
};
