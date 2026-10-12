function PlayerCard({
  side = 'left',
  title = 'You',
  subtitle = 'Player 1',
  symbol = 'X',
  score = 0,
  isTurn = false,
  isWinner = false,
  isGameOver = false,
  avatarType = 'user', // 'user' | 'bot' | 'opponent'
  details = null,
}) {
  const isX = symbol === 'X'
  const symbolClass = isX ? 'player--x' : 'player--o'

  return (
    <aside
      className={`player-panel player-panel--${side} ${symbolClass} ${isTurn ? 'player-panel--active' : ''} ${isWinner ? 'player-panel--winner' : ''}`}
      aria-label={`${title} (${symbol}) panel`}
    >
      <div className="player-card">
        {/* Top Header Badge */}
        <div className="player-badge">
          <span className="player-tag">{subtitle}</span>
          {isWinner && <span className="winner-pill">🏆 WINNER</span>}
        </div>

        {/* Avatar & Symbol */}
        <div className="player-avatar-wrapper">
          <div className="player-avatar">
            {avatarType === 'bot' ? (
              <span className="avatar-icon" role="img" aria-label="Bot">🤖</span>
            ) : avatarType === 'opponent' ? (
              <span className="avatar-icon" role="img" aria-label="Opponent">🎮</span>
            ) : (
              <span className="avatar-icon" role="img" aria-label="Player">👤</span>
            )}
            <div className={`player-symbol-bubble symbol--${symbol.toLowerCase()}`}>
              {symbol}
            </div>
          </div>
        </div>

        {/* Name and details */}
        <div className="player-identity">
          <h2 className="player-name">{title}</h2>
          {details && <p className="player-details">{details}</p>}
        </div>

        {/* Score Counter */}
        <div className="player-score-box">
          <span className="player-score-label">Victories</span>
          <span className="player-score-value">{score}</span>
        </div>

        {/* Dedicated "YOUR TURN" Switch at bottom */}
        <div className="player-turn-widget">
          <div className={`turn-switch ${isTurn && !isGameOver ? 'turn-switch--on' : 'turn-switch--off'}`}>
            <div className="turn-switch-track">
              <span className="turn-switch-thumb" />
            </div>
            <div className="turn-switch-info">
              <span className="turn-indicator-dot" />
              <span className="turn-label">
                {isGameOver
                  ? (isWinner ? 'WON ROUND' : 'ROUND OVER')
                  : (isTurn ? 'YOUR TURN' : 'WAITING...')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default PlayerCard
