import { useState, useEffect, useCallback, useRef } from 'react'
import { calculateWinner, isBoardFull, EMPTY_BOARD } from './game'
import { getBotMove } from './bot'
import { sounds } from './sound'
import { TrueOnlineManager } from './online'
import { PresenceManager } from './presence'

import HomeMenu from './components/HomeMenu'
import PlayerCard from './components/PlayerCard'
import Board from './components/Board'
import OnlineLobby from './components/OnlineLobby'
import QuitModal from './components/QuitModal'

import './App.css'

function App() {
  // Navigation / screen state: 'menu' | 'game' | 'online_lobby'
  const [screen, setScreen] = useState('menu')
  const [gameMode, setGameMode] = useState('local') // 'bot' | 'local' | 'online'
  const [botDifficulty, setBotDifficulty] = useState('medium')
  const [onlineConfig, setOnlineConfig] = useState(null) // { isHost, roomCode }
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Real-time connected presence count
  const [onlineCount, setOnlineCount] = useState(1)

  // Starter tracking: alternates or randomized so player doesn't always start
  const [starter, setStarter] = useState('X') // 'X' | 'O'

  // Gameplay state
  const [squares, setSquares] = useState(EMPTY_BOARD)
  const [xIsNext, setXIsNext] = useState(true)
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 })
  const [isThinking, setIsThinking] = useState(false)

  // Manager references
  const onlineManagerRef = useRef(null)
  const presenceManagerRef = useRef(null)

  // Calculate winner & draw
  const result = calculateWinner(squares)
  const winner = result?.winner ?? null
  const winningLine = result?.line ?? []
  const isDraw = !winner && isBoardFull(squares)
  const gameOver = Boolean(winner || isDraw)

  const currentPlayer = xIsNext ? 'X' : 'O'

  // Handle move logic
  const handlePlayMove = useCallback(
    (index, player, broadcast = true) => {
      if (squares[index] || calculateWinner(squares) || isBoardFull(squares)) {
        return
      }

      const next = [...squares]
      next[index] = player

      const newResult = calculateWinner(next)
      const newDraw = !newResult && isBoardFull(next)

      setSquares(next)
      sounds.playMove(player)

      if (newResult) {
        setScores((s) => ({ ...s, [newResult.winner]: s[newResult.winner] + 1 }))
        sounds.playWin()
      } else if (newDraw) {
        setScores((s) => ({ ...s, draws: s.draws + 1 }))
        sounds.playDraw()
      } else {
        setXIsNext((prev) => !prev)
      }

      // True WebRTC online message broadcast
      if (broadcast && gameMode === 'online' && onlineManagerRef.current) {
        onlineManagerRef.current.send({
          type: 'MOVE',
          index,
          player,
        })
      }
    },
    [squares, gameMode]
  )

  // Reference to handlePlayMove to avoid stale closures in WebRTC callbacks
  const handlePlayMoveRef = useRef(handlePlayMove)
  useEffect(() => {
    handlePlayMoveRef.current = handlePlayMove
  }, [handlePlayMove])

  // Play next round (alternates who starts so player doesn't always go first)
  const handleNewRound = useCallback(
    (broadcast = true) => {
      sounds.playClick()
      const nextStarter = starter === 'X' ? 'O' : 'X'
      setStarter(nextStarter)
      setSquares(EMPTY_BOARD)
      setXIsNext(nextStarter === 'X')
      setIsThinking(false)

      if (broadcast && gameMode === 'online' && onlineManagerRef.current) {
        onlineManagerRef.current.send({
          type: 'NEXT_ROUND',
          starter: nextStarter,
        })
      }
    },
    [starter, gameMode]
  )

  const handleNewRoundRef = useRef(handleNewRound)
  useEffect(() => {
    handleNewRoundRef.current = handleNewRound
  }, [handleNewRound])

  // Setup WebRTC manager for True Online mode
  const setupOnlineManager = useCallback(() => {
    if (onlineManagerRef.current) {
      onlineManagerRef.current.close()
    }

    onlineManagerRef.current = new TrueOnlineManager({
      onConnected: ({ isHost, roomCode }) => {
        sounds.playClick()
        setOnlineConfig({ isHost, roomCode })
        setGameMode('online')
        setScores({ X: 0, O: 0, draws: 0 })
        setSquares(EMPTY_BOARD)
        const initialStarter = 'X'
        setStarter(initialStarter)
        setXIsNext(true)
        setIsThinking(false)
        setScreen('game')
      },
      onMessage: (msg) => {
        if (msg.type === 'MOVE') {
          handlePlayMoveRef.current(msg.index, msg.player, false)
        } else if (msg.type === 'NEXT_ROUND') {
          sounds.playClick()
          setStarter(msg.starter || 'X')
          setSquares(EMPTY_BOARD)
          setXIsNext((msg.starter || 'X') === 'X')
          setIsThinking(false)
        }
      },
      onDisconnected: () => {
        alert('Opponent disconnected from P2P match.')
      },
      onError: (err) => {
        console.error('Online P2P error:', err)
      },
    })
  }, [])

  // Auto Matchmaking & Real-time Presence Listener
  useEffect(() => {
    const presence = new PresenceManager({
      onPresenceChange: (count) => {
        setOnlineCount(count)
      },
      onMatchFound: ({ roomCode, isHost }) => {
        sounds.playClick()
        setupOnlineManager()
        if (isHost) {
          onlineManagerRef.current.hostRoom(roomCode)
        } else {
          onlineManagerRef.current.joinRoom(roomCode)
        }
      },
    })
    presenceManagerRef.current = presence

    return () => {
      presence.destroy()
    }
  }, [setupOnlineManager])

  // Handle Bot turn (triggers when it's bot's turn, including if bot starts the game!)
  useEffect(() => {
    if (gameMode !== 'bot' || gameOver || xIsNext) return

    setIsThinking(true)
    const timer = setTimeout(() => {
      const bestMove = getBotMove(squares, 'O', botDifficulty)
      if (bestMove !== -1) {
        handlePlayMove(bestMove, 'O', false)
      }
      setIsThinking(false)
    }, 480)

    return () => clearTimeout(timer)
  }, [gameMode, gameOver, xIsNext, squares, botDifficulty, handlePlayMove])

  // Square click by user
  function handleSquareClick(index) {
    if (squares[index] || gameOver || isThinking) return

    // In Bot mode: human is always 'X'
    if (gameMode === 'bot') {
      if (!xIsNext) return
      handlePlayMove(index, 'X')
      return
    }

    // In Online mode: host is 'X', guest is 'O'
    if (gameMode === 'online') {
      const mySymbol = onlineConfig?.isHost ? 'X' : 'O'
      if (currentPlayer !== mySymbol) return
      handlePlayMove(index, mySymbol, true)
      return
    }

    // In Local mode: current player makes move
    handlePlayMove(index, currentPlayer)
  }

  function handleStartMode(mode, options = {}) {
    sounds.playClick()
    setGameMode(mode)
    if (options.difficulty) {
      setBotDifficulty(options.difficulty)
    }

    // Don't always make the user start: randomly choose starter (50% X, 50% O)
    const initialStarter = Math.random() < 0.5 ? 'X' : 'O'
    setStarter(initialStarter)
    setScores({ X: 0, O: 0, draws: 0 })
    setSquares(EMPTY_BOARD)
    setXIsNext(initialStarter === 'X')
    setIsThinking(false)

    if (mode === 'online') {
      setupOnlineManager()
      setScreen('online_lobby')
    } else {
      setScreen('game')
    }
  }

  function handleReturnToMenu() {
    sounds.playClick()
    if (onlineManagerRef.current) {
      onlineManagerRef.current.close()
      onlineManagerRef.current = null
    }
    setScreen('menu')
  }

  function handleToggleSound() {
    const muted = sounds.toggleMute()
    setIsMuted(muted)
  }

  // Auto-detect room parameter from URL on initial page load
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const roomParam = params.get('room')
      if (roomParam) {
        handleStartMode('online')
      }
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Determine user and opponent symbols & titles
  const isOnlineGuest = gameMode === 'online' && onlineConfig && !onlineConfig.isHost
  const userSymbol = isOnlineGuest ? 'O' : 'X'
  const opponentSymbol = isOnlineGuest ? 'X' : 'O'

  let leftPlayerTitle = 'You'
  let leftPlayerSubtitle = `Player ${userSymbol}`

  if (gameMode === 'local') {
    leftPlayerTitle = 'Player 1'
    leftPlayerSubtitle = 'Player X'
  }

  let rightPlayerTitle = 'Player 2'
  let rightPlayerSubtitle = 'Local Opponent'
  let rightPlayerAvatar = 'user'
  let rightPlayerDetails = 'Pass & Play'

  if (gameMode === 'bot') {
    rightPlayerTitle = 'AI Bot'
    const diffLabel = botDifficulty === 'hard' ? 'Master' : botDifficulty.charAt(0).toUpperCase() + botDifficulty.slice(1)
    rightPlayerSubtitle = `${diffLabel} AI`
    rightPlayerAvatar = 'bot'
    rightPlayerDetails = isThinking ? 'Analyzing move...' : 'Ready'
  } else if (gameMode === 'online') {
    rightPlayerTitle = isOnlineGuest ? 'Host Opponent' : 'Guest Opponent'
    rightPlayerSubtitle = `Room: ${onlineConfig?.roomCode?.toUpperCase() || ''}`
    rightPlayerAvatar = 'opponent'
    rightPlayerDetails = 'Live WebRTC P2P'
  }

  // Turn status banner text
  const movesPlayed = squares.filter(Boolean).length
  let statusBannerText
  if (winner) {
    statusBannerText = winner === userSymbol ? 'You won the round! 🏆' : `${rightPlayerTitle} wins the round!`
  } else if (isDraw) {
    statusBannerText = "It's a tie round! Both played equally well."
  } else if (isThinking) {
    statusBannerText = movesPlayed === 0 ? `${rightPlayerTitle} starts this round! Opening move...` : `${rightPlayerTitle} is analyzing moves...`
  } else if (movesPlayed === 0) {
    statusBannerText = currentPlayer === userSymbol
      ? `${leftPlayerTitle} starts this round! Make your move.`
      : `${rightPlayerTitle} starts this round!`
  } else {
    statusBannerText = currentPlayer === userSymbol ? 'Your turn to play' : `${rightPlayerTitle}'s turn`
  }

  return (
    <div className="app-container">
      {/* Top Universal Header */}
      <header className="app-header">
        <div className="header-left">
          {screen !== 'menu' && (
            <button
              type="button"
              className="btn-nav"
              onClick={handleReturnToMenu}
              aria-label="Return to Main Menu"
            >
              ← Home Menu
            </button>
          )}
        </div>

        <div className="header-center">
          <h1 className="header-brand">
            <span className="brand-x">TIC</span> TAC <span className="brand-o">TOE</span>
          </h1>
          {screen === 'game' && (
            <div className="header-mode-badge">
              {gameMode === 'bot' && `🤖 Solo vs Bot (${botDifficulty === 'hard' ? 'Master' : botDifficulty})`}
              {gameMode === 'local' && '👥 1v1 Local Duel'}
              {gameMode === 'online' && `🌐 WebRTC Room: ${onlineConfig?.roomCode?.toUpperCase()}`}
            </div>
          )}
        </div>

        <div className="header-right">
          {/* Real-time online connected persons counter */}
          <div className="header-presence-badge" title="Active people connected in real time">
            <span className="live-pulse-dot" />
            <span className="presence-text">{onlineCount} online</span>
          </div>

          <button
            type="button"
            className="btn-icon-sound"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            title={isMuted ? 'Unmute sound' : 'Mute sound'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-main">
        {screen === 'menu' && (
          <HomeMenu
            onSelectMode={handleStartMode}
            onQuit={() => setIsQuitModalOpen(true)}
          />
        )}

        {screen === 'online_lobby' && (
          <OnlineLobby
            onBack={() => setScreen('menu')}
            onlineManagerRef={onlineManagerRef}
            presenceManagerRef={presenceManagerRef}
            onlineCount={onlineCount}
          />
        )}

        {screen === 'game' && (
          <div className="game-arena">
            {/* LEFT SIDE: OURS / PLAYER 1 */}
            <PlayerCard
              side="left"
              title={leftPlayerTitle}
              subtitle={leftPlayerSubtitle}
              symbol={userSymbol}
              score={scores[userSymbol]}
              isTurn={currentPlayer === userSymbol}
              isWinner={winner === userSymbol}
              isGameOver={gameOver}
              avatarType="user"
              details={gameMode === 'local' ? 'Local Player' : (starter === userSymbol ? 'Started this round' : 'Second move')}
            />

            {/* CENTER: GAME BOARD & CONTROLS */}
            <section className="game-center" aria-label="Game board and controls">
              {/* Turn Banner */}
              <div
                className={`turn-banner ${gameOver ? 'turn-banner--gameover' : ''} ${winner ? `turn-banner--${winner.toLowerCase()}` : ''}`}
                role="status"
                aria-live="polite"
              >
                <span className="banner-icon">
                  {winner ? '👑' : isDraw ? '⚖️' : isThinking ? '⏳' : '⚡'}
                </span>
                <span className="banner-text">{statusBannerText}</span>
              </div>

              {/* Draws & Match Counter */}
              <div className="match-stats-bar">
                <span className="stat-item">
                  Draws: <strong>{scores.draws}</strong>
                </span>
                <span className="stat-separator">•</span>
                <span className="stat-item">
                  Round: <strong>{scores.X + scores.O + scores.draws + 1}</strong>
                </span>
                <span className="stat-separator">•</span>
                <span className="stat-item">
                  Starter: <strong>{starter === userSymbol ? leftPlayerTitle : rightPlayerTitle}</strong>
                </span>
              </div>

              {/* The 3x3 Board with rigid, non-deformable dimensions */}
              <Board
                squares={squares}
                onSquareClick={handleSquareClick}
                winningLine={winningLine}
                disabled={gameOver || isThinking || (gameMode === 'online' && currentPlayer !== userSymbol)}
              />

              {/* Single Clean Action Control: Play Next Round (No Reset Button) */}
              <div className="arena-actions">
                <button
                  type="button"
                  className="btn btn--primary btn--icon"
                  onClick={() => handleNewRound(true)}
                >
                  <span>{gameOver ? 'Play Next Round' : 'Next Round'}</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </section>

            {/* RIGHT SIDE: OPPONENT'S INFO */}
            <PlayerCard
              side="right"
              title={rightPlayerTitle}
              subtitle={rightPlayerSubtitle}
              symbol={opponentSymbol}
              score={scores[opponentSymbol]}
              isTurn={currentPlayer === opponentSymbol}
              isWinner={winner === opponentSymbol}
              isGameOver={gameOver}
              avatarType={rightPlayerAvatar}
              details={rightPlayerDetails}
            />
          </div>
        )}
      </main>

      {/* Quit Modal */}
      <QuitModal
        isOpen={isQuitModalOpen}
        onClose={() => setIsQuitModalOpen(false)}
        onConfirmExit={() => setScreen('menu')}
      />
    </div>
  )
}

export default App
