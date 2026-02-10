const { sql } = require('@vercel/postgres');

// Calculate points for a prediction
function calculatePoints(predictedHome, predictedAway, finalHome, finalAway) {
  let points = 0;

  // Determine actual result
  let actualResult;
  if (finalHome > finalAway) actualResult = 'home_win';
  else if (finalHome < finalAway) actualResult = 'away_win';
  else actualResult = 'draw';

  // Determine predicted result
  let predictedResult;
  if (predictedHome > predictedAway) predictedResult = 'home_win';
  else if (predictedHome < predictedAway) predictedResult = 'away_win';
  else predictedResult = 'draw';

  // 3 points for correct result
  if (actualResult === predictedResult) {
    points += 3;
  }

  // 3 points for exact scoreline
  if (predictedHome === finalHome && predictedAway === finalAway) {
    points += 3;
  }

  return points;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Get all completed games with final scores
      const { rows: completedGames } = await sql`
        SELECT id, final_home_score, final_away_score
        FROM games
        WHERE final_home_score IS NOT NULL
          AND final_away_score IS NOT NULL
      `;

      // Get all predictions for completed games
      const { rows: allPredictions } = await sql`
        SELECT
          p.player_id,
          p.game_id,
          p.predicted_home_score,
          p.predicted_away_score,
          g.final_home_score,
          g.final_away_score,
          pl.name as player_name
        FROM predictions p
        JOIN games g ON p.game_id = g.id
        JOIN players pl ON p.player_id = pl.id
        WHERE g.final_home_score IS NOT NULL
          AND g.final_away_score IS NOT NULL
      `;

      // Calculate points for each player
      const playerStats = {};

      allPredictions.forEach(pred => {
        const points = calculatePoints(
          pred.predicted_home_score,
          pred.predicted_away_score,
          pred.final_home_score,
          pred.final_away_score
        );

        if (!playerStats[pred.player_id]) {
          playerStats[pred.player_id] = {
            player_id: pred.player_id,
            player_name: pred.player_name,
            total_points: 0,
            games_predicted: 0
          };
        }

        playerStats[pred.player_id].total_points += points;
        playerStats[pred.player_id].games_predicted += 1;
      });

      // Convert to array and calculate points per prediction
      const leaderboard = Object.values(playerStats).map(player => ({
        ...player,
        points_per_prediction: player.games_predicted > 0
          ? parseFloat((player.total_points / player.games_predicted).toFixed(2))
          : 0
      }));

      // Sort by points per prediction (desc), then total points (desc)
      leaderboard.sort((a, b) => {
        if (b.points_per_prediction !== a.points_per_prediction) {
          return b.points_per_prediction - a.points_per_prediction;
        }
        return b.total_points - a.total_points;
      });

      // Add rank
      leaderboard.forEach((player, index) => {
        player.rank = index + 1;
      });

      return res.status(200).json({ leaderboard });

    } else {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }

  } catch (error) {
    console.error('Leaderboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
