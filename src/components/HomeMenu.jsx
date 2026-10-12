import { useState } from 'react'

function HomeMenu({ onSelectMode, onQuit }) {
  const [botDifficulty, setBotDifficulty] = useState('medium')

  return (
    <div className="home-menu-container">
      <div className="home-menu-hero">
        <h1 className="home-title">
          <span className="glow-x">TIC</span> <span className="glow-amp">&</span> <span className="glow-o">TOE</span>
        </h1>
      </div>

      <div className="menu-grid">
        {/* Option 1: Solo game against bot */}
        <div className="menu-card menu-card--bot">
          <div className="menu-card-top">
            <div className="menu-icon-circle icon-circle--bot">
              <span role="img" aria-label="Robot">🤖</span>
            </div>
            <div className="menu-card-pill">SOLO</div>
          </div>
          <div className="menu-card-body">
            <h2 className="menu-card-title">Solo vs Bot</h2>
            <p className="menu-card-desc">
              Play against AI.
            </p>
            <div className="difficulty-selector" aria-label="Select AI Difficulty">
              <div className="diff-buttons">
                {['easy', 'medium', 'hard'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`diff-btn ${botDifficulty === lvl ? 'diff-btn--active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setBotDifficulty(lvl)
                    }}
                  >
                    {lvl === 'hard' ? 'Master' : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="menu-action-btn btn-glow--teal"
            onClick={() => onSelectMode('bot', { difficulty: botDifficulty })}
          >
            Play vs Bot →
          </button>
        </div>

        {/* Option 2: 1v1 Local */}
        <div className="menu-card menu-card--local">
          <div className="menu-card-top">
            <div className="menu-icon-circle icon-circle--local">
              <span role="img" aria-label="Two players">👥</span>
            </div>
            <div className="menu-card-pill">LOCAL</div>
          </div>
          <div className="menu-card-body">
            <h2 className="menu-card-title">1v1 Local Duel</h2>
            <p className="menu-card-desc">
              Pass & play on the same screen.
            </p>
          </div>
          <button
            type="button"
            className="menu-action-btn btn-glow--coral"
            onClick={() => onSelectMode('local')}
          >
            Start 1v1 Duel →
          </button>
        </div>

        {/* Option 3: Online against someone else */}
        <div className="menu-card menu-card--online">
          <div className="menu-card-top">
            <div className="menu-icon-circle icon-circle--online">
              <span role="img" aria-label="Globe">🌐</span>
            </div>
            <div className="menu-card-pill">ONLINE</div>
          </div>
          <div className="menu-card-body">
            <h2 className="menu-card-title">Online Multiplayer</h2>
            <p className="menu-card-desc">
              Play online via room code or invite link.
            </p>
          </div>
          <button
            type="button"
            className="menu-action-btn btn-glow--blue"
            onClick={() => onSelectMode('online')}
          >
            Join Online Arena →
          </button>
        </div>

        {/* Option 4: Quit / exit game */}
        <div className="menu-card menu-card--quit">
          <div className="menu-card-top">
            <div className="menu-icon-circle icon-circle--quit">
              <span role="img" aria-label="Exit">🚪</span>
            </div>
          </div>
          <div className="menu-card-body">
            <h2 className="menu-card-title">Quit / Exit Game</h2>
            <p className="menu-card-desc">
              Exit game session.
            </p>
          </div>
          <button
            type="button"
            className="menu-action-btn btn-ghost-quit"
            onClick={onQuit}
          >
            Exit Game ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomeMenu
