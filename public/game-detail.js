// Player and game state
let currentPlayer = null;
let currentGame = null;
let gameId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get game ID from URL
  const params = new URLSearchParams(window.location.search);
  gameId = params.get('id');

  if (!gameId) {
    window.location.href = '/';
    return;
  }

  checkPlayerName();
  loadGameData();

  // Set up event listeners
  document.getElementById('player-form').addEventListener('submit', handlePlayerSubmit);
  document.getElementById('prediction-form').addEventListener('submit', handlePredictionSubmit);
});

// Check if player name exists in localStorage
function checkPlayerName() {
  const savedPlayer = localStorage.getItem('footballPredictionPlayer');

  if (savedPlayer) {
    try {
      currentPlayer = JSON.parse(savedPlayer);
    } catch (e) {
      showPlayerModal();
    }
  } else {
    showPlayerModal();
  }
}

// Show player name modal
function showPlayerModal() {
  document.getElementById('player-modal').classList.add('active');
  document.getElementById('player-name').focus();
}

// Hide player name modal
function hidePlayerModal() {
  document.getElementById('player-modal').classList.remove('active');
}

// Handle player form submission
async function handlePlayerSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('player-name').value.trim();

  if (!name) return;

  try {
    const response = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (response.ok) {
      currentPlayer = data.player;
      localStorage.setItem('footballPredictionPlayer', JSON.stringify(currentPlayer));
      hidePlayerModal();
      loadGameData(); // Reload to show prediction form
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error saving player:', error);
    alert('Failed to save player name. Please try again.');
  }
}


// Load all game data
async function loadGameData() {
  await Promise.all([
    loadGame(),
    loadPredictions()
  ]);
}

// Load game details
async function loadGame() {
  const container = document.getElementById('game-info-container');

  try {
    // Add cache-busting parameter to ensure fresh data
    const response = await fetch('/api/games?' + new Date().getTime());
    const data = await response.json();

    currentGame = data.games.find(g => g.id == gameId);

    if (!currentGame) {
      container.innerHTML = '<div class="error-message">Game not found</div>';
      return;
    }

    const kickoffTime = new Date(currentGame.kickoff_datetime);
    const now = new Date();
    const isPastKickoff = now >= kickoffTime;
    const hasScore = currentGame.final_home_score !== null && currentGame.final_away_score !== null;

    let html = `
      <h2>⚽ ${escapeHtml(currentGame.home_team)} vs ${escapeHtml(currentGame.away_team)}</h2>
      <p style="color: var(--text-muted); margin-top: 8px;">
        📅 ${formatDateTime(currentGame.kickoff_datetime)}
      </p>
    `;

    if (hasScore) {
      html += `
        <div class="score-display" style="font-size: 56px; margin-top: 24px;">
          ${currentGame.final_home_score} - ${currentGame.final_away_score}
        </div>
        <div style="margin-top: 12px;">
          <span class="badge badge-success">✓ Final Score</span>
        </div>
      `;
    } else if (!isPastKickoff) {
      html += `
        <div style="margin-top: 16px;">
          <span class="badge badge-warning countdown-timer" data-kickoff="${currentGame.kickoff_datetime}">⏱️ Kickoff in ${getCountdown(currentGame.kickoff_datetime)}</span>
        </div>
      `;
      startCountdown();
    } else {
      html += `
        <div style="margin-top: 16px;">
          <span class="badge badge-danger">🔒 Predictions Locked</span>
        </div>
      `;
    }

    container.innerHTML = html;

    // Show prediction form if before kickoff and player is logged in
    if (!isPastKickoff && currentPlayer) {
      document.getElementById('prediction-form-card').style.display = 'block';
      document.getElementById('home-team-label').textContent = currentGame.home_team;
      document.getElementById('away-team-label').textContent = currentGame.away_team;
    } else if (isPastKickoff) {
      document.getElementById('locked-message').style.display = 'block';
    }

  } catch (error) {
    console.error('Error loading game:', error);
    container.innerHTML = '<div class="error-message">Failed to load game details</div>';
  }
}

// Load predictions
async function loadPredictions() {
  const container = document.getElementById('predictions-container');

  try {
    const response = await fetch(`/api/predictions?gameId=${gameId}`);
    const data = await response.json();

    if (data.predictions.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No predictions yet</p></div>';
      return;
    }

    // If game has final score, calculate points
    const hasScore = currentGame && currentGame.final_home_score !== null;

    let html = '<div class="predictions-list">';

    data.predictions.forEach(pred => {
      let points = null;

      if (hasScore) {
        points = calculatePoints(
          pred.predicted_home_score,
          pred.predicted_away_score,
          currentGame.final_home_score,
          currentGame.final_away_score
        );
      }

      const isCurrentPlayer = currentPlayer && pred.player_name === currentPlayer.name;
      html += `
        <div class="prediction-item" style="${isCurrentPlayer ? 'border: 2px solid var(--accent-primary);' : ''}">
          <div>
            <div class="player-name" style="display: flex; align-items: center; gap: 8px;">
              ${isCurrentPlayer ? '👤' : ''}
              ${escapeHtml(pred.player_name)}
              ${isCurrentPlayer ? '<span class="badge badge-success" style="font-size: 11px; padding: 2px 8px;">You</span>' : ''}
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div class="score" style="font-size: 20px; font-weight: 700;">${pred.predicted_home_score} - ${pred.predicted_away_score}</div>
            ${points !== null ? `<div class="points-display" style="font-size: 16px;">${points} pts</div>` : ''}
          </div>
        </div>
      `;

      // Pre-fill form if this is the current player's prediction
      if (currentPlayer && pred.player_id === currentPlayer.id) {
        document.getElementById('home-score').value = pred.predicted_home_score;
        document.getElementById('away-score').value = pred.predicted_away_score;
      }
    });

    html += '</div>';
    container.innerHTML = html;

  } catch (error) {
    console.error('Error loading predictions:', error);
    container.innerHTML = '<div class="error-message">Failed to load predictions</div>';
  }
}

// Handle prediction form submission
async function handlePredictionSubmit(e) {
  e.preventDefault();

  if (!currentPlayer) {
    showPlayerModal();
    return;
  }

  const homeScore = parseInt(document.getElementById('home-score').value);
  const awayScore = parseInt(document.getElementById('away-score').value);
  const messageEl = document.getElementById('form-message');

  try {
    const response = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: currentPlayer.id,
        game_id: gameId,
        predicted_home_score: homeScore,
        predicted_away_score: awayScore
      })
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.innerHTML = '<div class="success-message">Prediction saved!</div>';
      setTimeout(() => {
        messageEl.innerHTML = '';
      }, 3000);
      loadPredictions(); // Reload to show updated prediction
    } else {
      messageEl.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    console.error('Error saving prediction:', error);
    messageEl.innerHTML = '<div class="error-message">Failed to save prediction. Please try again.</div>';
  }
}

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

// Format date and time in user's timezone
function formatDateTime(datetime) {
  const date = new Date(datetime);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Get countdown string
function getCountdown(kickoffDatetime) {
  const now = new Date();
  const kickoff = new Date(kickoffDatetime);
  const diff = kickoff - now;

  if (diff <= 0) {
    return 'Kickoff!';
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

// Start countdown timer
function startCountdown() {
  setInterval(() => {
    if (currentGame) {
      const countdown = getCountdown(currentGame.kickoff_datetime);
      const badge = document.querySelector('.badge-warning');
      if (badge) {
        badge.textContent = `Kickoff in ${countdown}`;
      }
    }
  }, 60000); // Update every minute
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
