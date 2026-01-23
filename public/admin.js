// Admin key
let adminKey = null;
let currentScoreGame = null;
let currentEditGame = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Get admin key from URL
  const params = new URLSearchParams(window.location.search);
  adminKey = params.get('key');

  if (!adminKey) {
    showAuthError();
    return;
  }

  document.getElementById('admin-content').style.display = 'block';

  // Load games
  loadGames();

  // Set up event listeners
  document.getElementById('create-game-form').addEventListener('submit', handleCreateGame);
  document.getElementById('score-form').addEventListener('submit', handleSaveScore);
  document.getElementById('cancel-score-btn').addEventListener('click', hideScoreModal);
  document.getElementById('edit-form').addEventListener('submit', handleUpdateGame);
  document.getElementById('cancel-edit-btn').addEventListener('click', hideEditModal);
});

// Show auth error
function showAuthError() {
  document.getElementById('auth-error').style.display = 'block';
}

// Load all games
async function loadGames() {
  const container = document.getElementById('games-list-container');

  try {
    // Add cache-busting parameter to ensure fresh data
    const response = await fetch('/api/games?' + new Date().getTime());
    const data = await response.json();

    if (data.games.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No games created yet</p></div>';
      return;
    }

    // Sort by kickoff date
    data.games.sort((a, b) => new Date(b.kickoff_datetime) - new Date(a.kickoff_datetime));

    let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';

    data.games.forEach(game => {
      const hasScore = game.final_home_score !== null && game.final_away_score !== null;
      const kickoffTime = new Date(game.kickoff_datetime);
      const now = new Date();
      const isPastKickoff = now >= kickoffTime;

      html += `
        <div style="background: var(--bg-tertiary); padding: 20px; border-radius: var(--radius-sm);">
          <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 16px;">
            <div style="flex: 1; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0;">${escapeHtml(game.home_team)} vs ${escapeHtml(game.away_team)}</h3>
              <p style="color: var(--text-muted); font-size: 14px; margin: 0;">
                ${formatDateTime(game.kickoff_datetime)}
              </p>
              ${hasScore ? `
                <div style="font-size: 28px; font-weight: 700; color: var(--success); margin-top: 12px; font-variant-numeric: tabular-nums;">
                  ${game.final_home_score} - ${game.final_away_score}
                </div>
              ` : ''}
              ${isPastKickoff && !hasScore ? `
                <span class="badge badge-warning" style="margin-top: 8px;">Awaiting score</span>
              ` : ''}
              ${!isPastKickoff ? `
                <span class="badge badge-success" style="margin-top: 8px;">Upcoming</span>
              ` : ''}
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button
                class="btn-secondary"
                style="min-width: auto; padding: 8px 16px;"
                onclick="showEditModal(${game.id}, '${escapeHtml(game.home_team)}', '${escapeHtml(game.away_team)}', '${game.kickoff_datetime}')"
              >
                Edit
              </button>
              ${!hasScore ? `
                <button
                  class="btn-secondary"
                  style="min-width: auto; padding: 8px 16px;"
                  onclick="showScoreModal(${game.id}, '${escapeHtml(game.home_team)}', '${escapeHtml(game.away_team)}')"
                >
                  Enter Score
                </button>
              ` : ''}
              <button
                class="btn-danger"
                style="min-width: auto; padding: 8px 16px;"
                onclick="deleteGame(${game.id}, '${escapeHtml(game.home_team)} vs ${escapeHtml(game.away_team)}')"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;

  } catch (error) {
    console.error('Error loading games:', error);
    container.innerHTML = '<div class="error-message">Failed to load games</div>';
  }
}

// Handle create game form submission
async function handleCreateGame(e) {
  e.preventDefault();

  const homeTeam = document.getElementById('home-team').value.trim();
  const awayTeam = document.getElementById('away-team').value.trim();
  const kickoffDatetime = document.getElementById('kickoff-datetime').value;
  const messageEl = document.getElementById('create-message');

  try {
    const response = await fetch('/api/games?key=' + adminKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_team: homeTeam,
        away_team: awayTeam,
        kickoff_datetime: kickoffDatetime
      })
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.innerHTML = '<div class="success-message">Game created successfully!</div>';
      document.getElementById('create-game-form').reset();
      setTimeout(() => {
        messageEl.innerHTML = '';
      }, 3000);
      loadGames(); // Reload games list
    } else {
      messageEl.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    console.error('Error creating game:', error);
    messageEl.innerHTML = '<div class="error-message">Failed to create game. Please try again.</div>';
  }
}

// Show score modal
function showScoreModal(gameId, homeTeam, awayTeam) {
  currentScoreGame = gameId;
  document.getElementById('score-modal-teams').textContent = `${homeTeam} vs ${awayTeam}`;
  document.getElementById('score-home-label').textContent = homeTeam;
  document.getElementById('score-away-label').textContent = awayTeam;
  document.getElementById('score-modal').classList.add('active');
  document.getElementById('score-home').focus();
}

// Hide score modal
function hideScoreModal() {
  document.getElementById('score-modal').classList.remove('active');
  document.getElementById('score-form').reset();
  document.getElementById('score-message').innerHTML = '';
  currentScoreGame = null;
}

// Handle save score
async function handleSaveScore(e) {
  e.preventDefault();

  if (!currentScoreGame) return;

  const homeScore = parseInt(document.getElementById('score-home').value);
  const awayScore = parseInt(document.getElementById('score-away').value);
  const messageEl = document.getElementById('score-message');

  try {
    const response = await fetch(`/api/games/${currentScoreGame}/score?key=${adminKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        final_home_score: homeScore,
        final_away_score: awayScore
      })
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.innerHTML = '<div class="success-message">Score saved successfully!</div>';
      setTimeout(() => {
        hideScoreModal();
        loadGames(); // Reload games list
      }, 1500);
    } else {
      messageEl.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    console.error('Error saving score:', error);
    messageEl.innerHTML = '<div class="error-message">Failed to save score. Please try again.</div>';
  }
}

// Delete game
async function deleteGame(gameId, gameName) {
  if (!confirm(`Are you sure you want to delete "${gameName}"? This will also delete all predictions for this game.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/games/${gameId}?key=${adminKey}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (response.ok) {
      loadGames(); // Reload games list
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    alert('Failed to delete game. Please try again.');
  }
}

// Format date and time in user's timezone
function formatDateTime(datetime) {
  const date = new Date(datetime);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show edit modal
function showEditModal(gameId, homeTeam, awayTeam, kickoffDatetime) {
  currentEditGame = gameId;

  // Format datetime for input (needs YYYY-MM-DDTHH:MM format)
  const date = new Date(kickoffDatetime);
  const formatted = date.toISOString().slice(0, 16);

  document.getElementById('edit-home-team').value = homeTeam;
  document.getElementById('edit-away-team').value = awayTeam;
  document.getElementById('edit-kickoff-datetime').value = formatted;
  document.getElementById('edit-modal').classList.add('active');
}

// Hide edit modal
function hideEditModal() {
  document.getElementById('edit-modal').classList.remove('active');
  document.getElementById('edit-form').reset();
  document.getElementById('edit-message').innerHTML = '';
  currentEditGame = null;
}

// Handle update game
async function handleUpdateGame(e) {
  e.preventDefault();

  if (!currentEditGame) return;

  const homeTeam = document.getElementById('edit-home-team').value.trim();
  const awayTeam = document.getElementById('edit-away-team').value.trim();
  const kickoffDatetime = document.getElementById('edit-kickoff-datetime').value;
  const messageEl = document.getElementById('edit-message');

  try {
    const response = await fetch(`/api/games/${currentEditGame}/update?key=${adminKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        home_team: homeTeam,
        away_team: awayTeam,
        kickoff_datetime: kickoffDatetime
      })
    });

    const data = await response.json();

    if (response.ok) {
      messageEl.innerHTML = '<div class="success-message">Game updated successfully!</div>';
      setTimeout(() => {
        hideEditModal();
        loadGames(); // Reload games list
      }, 1500);
    } else {
      messageEl.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    console.error('Error updating game:', error);
    messageEl.innerHTML = '<div class="error-message">Failed to update game. Please try again.</div>';
  }
}

// Make functions globally available
window.showScoreModal = showScoreModal;
window.showEditModal = showEditModal;
window.deleteGame = deleteGame;
