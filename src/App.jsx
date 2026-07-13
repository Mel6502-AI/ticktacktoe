import { useState } from 'react'
import { calculateWinner, isBoardFull, EMPTY_BOARD } from './game'
import './App.css'

function Square({ value, onClick, isWinning, disabled }) {
  return (
    <button
      type="button"
      className={`square${value ? ` square--${value.toLowerCase()}` : ''}${isWinning ? ' square--winning' : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Cell marked ${value}` : 'Empty cell'}
    >
      {value && <span className="mark">{value}</span>}
    </button>
  )
}

function App() {
  const [squares, setSquares] = useState(EMPTY_BOARD)
  const [xIsNext, setXIsNext] = useState(true)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })

  const result = calculateWinner(squares)
  const winner = result?.winner ?? null
  const winningLine = result?.line ?? []
  const isDraw = !winner && isBoardFull(squares)
  const gameOver = Boolean(winner || isDraw)

  const currentPlayer = xIsNext ? 'X' : 'O'

  function handleClick(index) {
    if (squares[index] || gameOver) return

    const next = squares.slice()
    next[index] = currentPlayer

    const newResult = calculateWinner(next)
    const newDraw = !newResult && isBoardFull(next)

    if (newResult) {
      setScores((s) => ({ ...s, [newResult.winner]: s[newResult.winner] + 1 }))
    } else if (newDraw) {
      setScores((s) => ({ ...s, draws: s.draws + 1 }))
    }

    setSquares(next)
    setXIsNext(!xIsNext)
  }

  function handleNewGame() {
    setSquares(EMPTY_BOARD)
    setXIsNext(true)
  }

  function handleResetScores() {
    setScores({ X: 0, O: 0, draws: 0 })
    handleNewGame()
  }

  let status
  if (winner) {
    status = `${winner} wins!`
  } else if (isDraw) {
    status = "It's a draw"
  } else {
    status = `${currentPlayer}'s turn`
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="title">Tic Tac Toe</h1>
        <p className="subtitle">Classic two-player game</p>
      </header>

      <div className="scoreboard">
        <div className="score score--x">
          <span className="score-label">X</span>
          <span className="score-value">{scores.X}</span>
        </div>
        <div className="score score--draw">
          <span className="score-label">Draws</span>
          <span className="score-value">{scores.draws}</span>
        </div>
        <div className="score score--o">
          <span className="score-label">O</span>
          <span className="score-value">{scores.O}</span>
        </div>
      </div>

      <div
        className={`status${gameOver ? ' status--over' : ''}${winner ? ` status--${winner.toLowerCase()}` : ''}`}
        role="status"
        aria-live="polite"
      >
        {status}
      </div>

      <div className="board" role="grid" aria-label="Tic tac toe board">
        {squares.map((value, index) => (
          <Square
            key={index}
            value={value}
            onClick={() => handleClick(index)}
            isWinning={winningLine.includes(index)}
            disabled={Boolean(value) || gameOver}
          />
        ))}
      </div>

      <div className="actions">
        {gameOver ? (
          <button type="button" className="btn btn--primary" onClick={handleNewGame}>
            Play again
          </button>
        ) : (
          <button type="button" className="btn" onClick={handleNewGame}>
            Reset board
          </button>
        )}
        <button type="button" className="btn btn--ghost" onClick={handleResetScores}>
          Reset scores
        </button>
      </div>
    </div>
  )
}

export default App
