// Player management
let currentPlayer = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkPlayerName();
  loadData();

  // Set up event listeners
  document.getElementById('player-form').addEventListener('submit', handlePlayerSubmit);
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

    if (data.leaderboard.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No completed games yet</p></div>';
      return;
    }

    const table = `
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Points</th>
            <th>Games</th>
            <th>Pts/Game</th>
          </tr>
        </thead>
        <tbody>
          ${data.leaderboard.map(player => {
            const rankClass = player.rank <= 3 ? `rank-${player.rank}` : 'rank-other';
            const rankEmoji = player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : '';
            return `
            <tr>
              <td><span class="rank-badge ${rankClass}">${rankEmoji || player.rank}</span></td>
              <td style="font-weight: 600;">${escapeHtml(player.player_name)}</td>
              <td><span class="points-display">${player.total_points} pts</span></td>
              <td>${player.games_predicted}</td>
              <td><strong>${player.points_per_prediction.toFixed(2)}</strong></td>
            </tr>
          `;
          }).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = table;
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
    container.innerHTML = '<div class="empty-state"><p>No upcoming games</p></div>';
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
    container.innerHTML = '<div class="empty-state"><p>No completed games yet</p></div>';
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
