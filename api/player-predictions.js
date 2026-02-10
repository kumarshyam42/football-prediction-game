const { sql } = require('@vercel/postgres');

// Calculate points for a prediction (same logic as leaderboard.js)
function calculatePoints(predictedHome, predictedAway, finalHome, finalAway) {
  let points = 0;

  let actualResult;
  if (finalHome > finalAway) actualResult = 'home_win';
  else if (finalHome < finalAway) actualResult = 'away_win';
  else actualResult = 'draw';

  let predictedResult;
  if (predictedHome > predictedAway) predictedResult = 'home_win';
  else if (predictedHome < predictedAway) predictedResult = 'away_win';
  else predictedResult = 'draw';

  if (actualResult === predictedResult) {
    points += 3;
  }

  if (predictedHome === finalHome && predictedAway === finalAway) {
    points += 3;
  }

  return points;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { playerId } = req.query;

      if (!playerId) {
        return res.status(400).json({ error: 'playerId is required' });
      }

      const { rows } = await sql`
        SELECT
          p.predicted_home_score,
          p.predicted_away_score,
          g.id as game_id,
          g.home_team,
          g.away_team,
          g.kickoff_datetime,
          g.final_home_score,
          g.final_away_score,
          pl.name as player_name
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        JOIN players pl ON p.player_id = pl.id
        WHERE p.player_id = ${playerId}
        ORDER BY g.kickoff_datetime DESC
      `;

      const predictions = rows.map(row => {
        let points = null;
        if (row.final_home_score !== null && row.final_away_score !== null) {
          points = calculatePoints(
            row.predicted_home_score,
            row.predicted_away_score,
            row.final_home_score,
            row.final_away_score
          );
        }

        return {
          game_id: row.game_id,
          home_team: row.home_team,
          away_team: row.away_team,
          kickoff_datetime: row.kickoff_datetime,
          predicted_home_score: row.predicted_home_score,
          predicted_away_score: row.predicted_away_score,
          final_home_score: row.final_home_score,
          final_away_score: row.final_away_score,
          points
        };
      });

      const playerName = rows.length > 0 ? rows[0].player_name : null;

      return res.status(200).json({ player_name: playerName, predictions });

    } else {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Player predictions API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
