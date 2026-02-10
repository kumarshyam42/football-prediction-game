// Player management
let currentPlayer = null;
let leaderboardData = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkPlayerName();
  loadData();

  // Set up event listeners
  document.getElementById('player-form').addEventListener('submit', handlePlayerSubmit);

  // Delegated click listener for player names in leaderboard
  document.getElementById('leaderboard-container').addEventListener('click', (e) => {
    const link = e.target.closest('.player-history-link');
    if (link) {
      showPlayerHistoryModal(link.dataset.playerId);
    }
  });

  // Close player history modal on backdrop click
  document.getElementById('player-history-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      hidePlayerHistoryModal();
    }
  });

  // Close player history modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hidePlayerHistoryModal();
    }
  });
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
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error saving player:', error);
    alert('Failed to save player name. Please try again.');
  }
}


// Load all data
async function loadData() {
  await Promise.all([
    loadLeaderboard(),
    loadGames()
  ]);
}

// Load leaderboard
async function loadLeaderboard() {
  const container = document.getElementById('leaderboard-container');

  try {
    const response = await fetch('/api/leaderboard');
    const data = await response.json();

    leaderboardData = data.leaderboard;

    if (data.leaderboard.length === 0) {
      container.innerHTML = `
        <div class="leaderboard-empty-podium">
          <div class="podium-placeholder">
            <div class="placeholder-spot"></div>
            <div class="placeholder-spot center"></div>
            <div class="placeholder-spot"></div>
          </div>
          <p>No completed games yet. Make predictions to climb the ranks!</p>
        </div>
      `;
      return;
    }

    // Separate top 3 and rest
    const top3 = data.leaderboard.slice(0, 3);
    const rest = data.leaderboard.slice(3);

    // Build podium HTML (reorder: 2nd, 1st, 3rd for visual layout)
    const podiumOrder = [];
    if (top3[1]) podiumOrder.push({ ...top3[1], position: 'second' });
    if (top3[0]) podiumOrder.push({ ...top3[0], position: 'first' });
    if (top3[2]) podiumOrder.push({ ...top3[2], position: 'third' });

    const podiumHtml = `
      <div class="leaderboard-podium">
        ${podiumOrder.map(player => `
          <div class="podium-spot ${player.position}">
            <div class="podium-player">
              <div class="podium-rank">${player.rank}</div>
              <button class="podium-name player-history-link" data-player-id="${player.player_id}" aria-label="View prediction history for ${escapeHtml(player.player_name)}">${escapeHtml(player.player_name)}</button>
              <div class="podium-points">${player.total_points} pts</div>
              <div class="podium-stats">${player.points_per_prediction.toFixed(2)} per game</div>
            </div>
            <div class="podium-pedestal"></div>
          </div>
        `).join('')}
      </div>
    `;

    // Build list HTML for remaining players
    const listHtml = rest.length > 0 ? `
      <div class="leaderboard-list">
        ${rest.map(player => `
          <div class="leaderboard-row">
            <span class="rank">${player.rank}</span>
            <button class="player-name player-history-link" data-player-id="${player.player_id}" aria-label="View prediction history for ${escapeHtml(player.player_name)}">${escapeHtml(player.player_name)}</button>
            <div class="player-stats">
              <div class="stat">
                <span class="stat-value points-value">${player.total_points}</span>
                <span class="stat-label">Points</span>
              </div>
              <div class="stat">
                <span class="stat-value">${player.games_predicted}</span>
                <span class="stat-label">Games</span>
              </div>
              <div class="stat">
                <span class="stat-value">${player.points_per_prediction.toFixed(2)}</span>
                <span class="stat-label">Avg</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

    container.innerHTML = podiumHtml + listHtml;
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    container.innerHTML = '<div class="error-message">Failed to load leaderboard</div>';
  }
}

// Load games
async function loadGames() {
  try {
    // Add cache-busting parameter to ensure fresh data
    const response = await fetch('/api/games?' + new Date().getTime());
    const data = await response.json();

    const now = new Date();
    const upcoming = [];
    const completed = [];

    data.games.forEach(game => {
      const kickoffTime = new Date(game.kickoff_datetime);

      if (game.final_home_score !== null && game.final_away_score !== null) {
        completed.push(game);
      } else if (kickoffTime > now) {
        upcoming.push(game);
      }
    });

    displayUpcomingGames(upcoming);
    displayCompletedGames(completed);

    // Start countdown timers
    startCountdowns();

  } catch (error) {
    console.error('Error loading games:', error);
    document.getElementById('upcoming-games-container').innerHTML =
      '<div class="error-message">Failed to load games</div>';
  }
}

// Display upcoming games
function displayUpcomingGames(games) {
  const container = document.getElementById('upcoming-games-container');

  if (games.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon empty-state-calendar"></div>
        <p class="empty-state-title">The pitch is quiet</p>
        <span class="empty-state-subtitle">Check back soon for upcoming fixtures</span>
      </div>
    `;
    return;
  }

  const html = `
    <div class="games-grid">
      ${games.map(game => {
        const countdown = getCountdown(game.kickoff_datetime);
        const isUrgent = isCountdownUrgent(game.kickoff_datetime);
        return `
        <div class="game-card" onclick="window.location.href='/game.html?id=${game.id}'">
          <div class="game-card-header">
            <span class="kickoff-time">${formatDateTime(game.kickoff_datetime)}</span>
            <span class="countdown${isUrgent ? ' urgent' : ''}" data-kickoff="${game.kickoff_datetime}">${countdown}</span>
          </div>
          <div class="game-card-body">
            <div class="match-teams">
              <div class="team home">
                <div class="team-name">${escapeHtml(game.home_team)}</div>
              </div>
              <div class="vs-badge">VS</div>
              <div class="team away">
                <div class="team-name">${escapeHtml(game.away_team)}</div>
              </div>
            </div>
          </div>
        </div>
      `}).join('')}
    </div>
  `;

  container.innerHTML = html;
}

// Display completed games
function displayCompletedGames(games) {
  const container = document.getElementById('completed-games-container');

  if (games.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon empty-state-whistle"></div>
        <p class="empty-state-title">No final whistles yet</p>
        <span class="empty-state-subtitle">Results will appear here after games finish</span>
      </div>
    `;
    return;
  }

  // Show only the 5 most recent
  const recent = games.slice(-5).reverse();

  const html = `
    <div class="games-grid">
      ${recent.map(game => `
        <div class="game-card" onclick="window.location.href='/game.html?id=${game.id}'">
          <div class="game-card-header">
            <span class="kickoff-time">${formatDateTime(game.kickoff_datetime)}</span>
            <span class="badge badge-success">Final</span>
          </div>
          <div class="game-card-body">
            <div class="match-teams">
              <div class="team home">
                <div class="team-name">${escapeHtml(game.home_team)}</div>
              </div>
              <div class="vs-badge">VS</div>
              <div class="team away">
                <div class="team-name">${escapeHtml(game.away_team)}</div>
              </div>
            </div>
            <div class="match-score final">
              <span class="score-number">${game.final_home_score}</span>
              <span class="score-divider">-</span>
              <span class="score-number">${game.final_away_score}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;
}

// Format date and time in user's timezone
function formatDateTime(datetime) {
  const date = new Date(datetime);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
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
    return 'LIVE';
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

// Check if countdown is urgent (under 1 hour)
function isCountdownUrgent(kickoffDatetime) {
  const now = new Date();
  const kickoff = new Date(kickoffDatetime);
  const diff = kickoff - now;
  const oneHour = 60 * 60 * 1000;
  return diff > 0 && diff < oneHour;
}

// Start countdown timers
function startCountdowns() {
  setInterval(() => {
    document.querySelectorAll('.countdown[data-kickoff]').forEach(el => {
      const kickoff = el.getAttribute('data-kickoff');
      if (kickoff) {
        el.textContent = getCountdown(kickoff);
        // Update urgent class
        if (isCountdownUrgent(kickoff)) {
          el.classList.add('urgent');
        } else {
          el.classList.remove('urgent');
        }
      }
    });
  }, 60000); // Update every minute
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Player History Modal
async function showPlayerHistoryModal(playerId) {
  const modal = document.getElementById('player-history-modal');
  const nameEl = document.getElementById('player-history-name');
  const summaryEl = document.getElementById('player-history-summary');
  const bodyEl = document.getElementById('player-history-body');

  // Find player summary from cached leaderboard data
  const summary = leaderboardData.find(p => p.player_id === parseInt(playerId));

  nameEl.textContent = summary ? summary.player_name : 'Player';
  summaryEl.innerHTML = '';
  bodyEl.innerHTML = `
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line"></div>
    <div class="skeleton skeleton-line"></div>
  `;

  modal.classList.add('active');

  try {
    const response = await fetch(`/api/player-predictions?playerId=${playerId}`);
    const data = await response.json();

    if (!response.ok) {
      bodyEl.innerHTML = '<div class="error-message">Failed to load prediction history</div>';
      return;
    }

    if (data.player_name) {
      nameEl.textContent = data.player_name;
    }

    // Render summary stats
    if (summary) {
      summaryEl.innerHTML = `
        <div class="player-history-stats">
          <div class="history-stat">
            <span class="history-stat-value">#${summary.rank}</span>
            <span class="history-stat-label">Rank</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-value history-stat-points">${summary.total_points}</span>
            <span class="history-stat-label">Points</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-value">${summary.games_predicted}</span>
            <span class="history-stat-label">Games</span>
          </div>
          <div class="history-stat">
            <span class="history-stat-value">${summary.points_per_prediction.toFixed(2)}</span>
            <span class="history-stat-label">Avg</span>
          </div>
        </div>
      `;
    }

    // Separate completed and upcoming
    const completed = data.predictions.filter(p => p.final_home_score !== null);
    const upcoming = data.predictions.filter(p => p.final_home_score === null);

    if (data.predictions.length === 0) {
      bodyEl.innerHTML = `
        <div class="empty-state" style="padding: 32px 0;">
          <p class="empty-state-title">No predictions yet</p>
        </div>
      `;
      return;
    }

    let html = '';

    if (completed.length > 0) {
      html += `
        <div class="history-section-label">Results</div>
        <div class="history-col-headers">
          <span class="history-col-match">Match</span>
          <span class="history-col-pred">Pred</span>
          <span class="history-col-divider"></span>
          <span class="history-col-actual">Actual</span>
          <span class="history-col-pts">Pts</span>
        </div>
        <div class="history-list">
          ${completed.map(p => {
            const ptsClass = p.points === 6 ? 'pts-6' : p.points === 3 ? 'pts-3' : 'pts-0';
            return `
              <div class="history-row">
                <div class="history-match">${escapeHtml(p.home_team)} vs ${escapeHtml(p.away_team)}</div>
                <div class="history-scores">
                  <span class="history-prediction">${p.predicted_home_score}-${p.predicted_away_score}</span>
                  <span class="history-vs">|</span>
                  <span class="history-final">${p.final_home_score}-${p.final_away_score}</span>
                </div>
                <div class="history-points ${ptsClass}">${p.points} pts</div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    if (upcoming.length > 0) {
      html += `
        <div class="history-section-label">Upcoming</div>
        <div class="history-list">
          ${upcoming.map(p => `
            <div class="history-row">
              <div class="history-match">${escapeHtml(p.home_team)} vs ${escapeHtml(p.away_team)}</div>
              <div class="history-scores">
                <span class="history-prediction">${p.predicted_home_score}-${p.predicted_away_score}</span>
                <span class="history-vs">|</span>
                <span class="history-final">--</span>
              </div>
              <div class="history-points pts-pending">--</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    bodyEl.innerHTML = html;

  } catch (error) {
    console.error('Error loading player history:', error);
    bodyEl.innerHTML = '<div class="error-message">Failed to load prediction history</div>';
  }
}

function hidePlayerHistoryModal() {
  document.getElementById('player-history-modal').classList.remove('active');
}
