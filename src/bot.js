import { calculateWinner, isBoardFull } from './game'

function minimax(board, isMaximizing, botSymbol, humanSymbol, depth = 0) {
  const result = calculateWinner(board)
  if (result) {
    return result.winner === botSymbol ? 10 - depth : depth - 10
  }
  if (isBoardFull(board)) {
    return 0
  }

  if (isMaximizing) {
    let bestScore = -Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = botSymbol
        const score = minimax(board, false, botSymbol, humanSymbol, depth + 1)
        board[i] = null
        bestScore = Math.max(score, bestScore)
      }
    }
    return bestScore
  } else {
    let bestScore = Infinity
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = humanSymbol
        const score = minimax(board, true, botSymbol, humanSymbol, depth + 1)
        board[i] = null
        bestScore = Math.min(score, bestScore)
      }
    }
    return bestScore
  }
}

export function getBotMove(squares, botSymbol = 'O', difficulty = 'hard') {
  const available = []
  for (let i = 0; i < 9; i++) {
    if (squares[i] === null) available.push(i)
  }
  if (available.length === 0) return -1

  const humanSymbol = botSymbol === 'X' ? 'O' : 'X'

  // Easy mode: mostly random
  if (difficulty === 'easy') {
    return available[Math.floor(Math.random() * available.length)]
  }

  // Medium mode: block or take immediate win, otherwise pick center/random
  if (difficulty === 'medium') {
    // 1. Can bot win now?
    for (const idx of available) {
      const copy = [...squares]
      copy[idx] = botSymbol
      if (calculateWinner(copy)) return idx
    }
    // 2. Can human win now? Block it
    for (const idx of available) {
      const copy = [...squares]
      copy[idx] = humanSymbol
      if (calculateWinner(copy)) return idx
    }
    // 3. Prefer center
    if (squares[4] === null && Math.random() < 0.7) return 4
    // 4. Otherwise random
    return available[Math.floor(Math.random() * available.length)]
  }

  // Hard / Unbeatable mode (Minimax)
  let bestScore = -Infinity
  let bestMoves = []
  for (const idx of available) {
    const copy = [...squares]
    copy[idx] = botSymbol
    const score = minimax(copy, false, botSymbol, humanSymbol, 0)
    if (score > bestScore) {
      bestScore = score
      bestMoves = [idx]
    } else if (score === bestScore) {
      bestMoves.push(idx)
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)]
}
