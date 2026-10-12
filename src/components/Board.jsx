function Square({ value, onClick, isWinning, disabled, index }) {
  const isX = value === 'X'
  const isO = value === 'O'

  return (
    <button
      type="button"
      className={`square ${value ? `square--filled square--${value.toLowerCase()}` : 'square--empty'} ${isWinning ? 'square--winning' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Cell ${index + 1} marked ${value}` : `Empty cell ${index + 1}`}
    >
      {value && (
        <span className={`mark mark--${value.toLowerCase()}`}>
          {isX ? (
            <svg viewBox="0 0 48 48" className="mark-svg mark-svg--x" aria-hidden="true">
              <line x1="10" y1="10" x2="38" y2="38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              <line x1="38" y1="10" x2="10" y2="38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </svg>
          ) : isO ? (
            <svg viewBox="0 0 48 48" className="mark-svg mark-svg--o" aria-hidden="true">
              <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
          ) : null}
        </span>
      )}
    </button>
  )
}

function Board({ squares, onSquareClick, winningLine = [], disabled = false }) {
  return (
    <div className="board-wrapper">
      <div className="board" role="grid" aria-label="Tic Tac Toe 3x3 Grid">
        {squares.map((val, idx) => (
          <Square
            key={idx}
            index={idx}
            value={val}
            onClick={() => onSquareClick(idx)}
            isWinning={winningLine.includes(idx)}
            disabled={disabled || Boolean(val)}
          />
        ))}
      </div>
    </div>
  )
}

export default Board
