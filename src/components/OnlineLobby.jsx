import { useState, useEffect } from 'react'

function OnlineLobby({ onBack, onlineManagerRef, presenceManagerRef, onlineCount }) {
  const [activeTab, setActiveTab] = useState('auto') // 'auto' | 'host' | 'join'
  const [roomInput, setRoomInput] = useState('')
  const [hostedCode, setHostedCode] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSearchingQueue, setIsSearchingQueue] = useState(false)

  // Auto-detect room from query parameter if present
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const roomParam = params.get('room')
      if (roomParam) {
        setRoomInput(roomParam.toUpperCase())
        setActiveTab('join')
      }
    } catch {}
  }, [])

  function generateShortCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // 1. Auto Pair Matching
  function handleStartAutoMatch() {
    setIsSearchingQueue(true)
    setStatusMessage('Entered matchmaking queue. Searching for an opponent...')

    if (presenceManagerRef.current) {
      presenceManagerRef.current.joinAutoMatchQueue()
    }
  }

  function handleCancelAutoMatch() {
    setIsSearchingQueue(false)
    setStatusMessage('Matchmaking canceled.')

    if (presenceManagerRef.current) {
      presenceManagerRef.current.leaveAutoMatchQueue()
    }
  }

  // 2. Manual Host Room
  function handleCreateRoom() {
    const code = generateShortCode()
    setHostedCode(code)
    setIsConnecting(true)
    setStatusMessage('Creating WebRTC P2P room...')

    const manager = onlineManagerRef.current
    if (manager) {
      manager.hostRoom(code, (readyCode) => {
        setStatusMessage(`Room ${readyCode.toUpperCase()} active. Waiting for opponent...`)
        setIsConnecting(false)
      })
    }
  }

  // 3. Manual Join Room
  function handleJoinRoom() {
    const clean = roomInput.trim().toUpperCase()
    if (!clean) return

    setIsConnecting(true)
    setStatusMessage(`Connecting to room ${clean}...`)

    const manager = onlineManagerRef.current
    if (manager) {
      manager.joinRoom(clean, () => {
        setStatusMessage('Connected! Launching match...')
      })
    }
  }

  function handleCopyLink() {
    if (!hostedCode) return
    const url = `${window.location.origin}${window.location.pathname}?room=${hostedCode}`
    try {
      navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2200)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="online-lobby-wrapper">
      <div className="lobby-card">
        <div className="lobby-header">
          <button type="button" className="btn-back" onClick={onBack}>
            ← Back to Menu
          </button>
          <h2 className="lobby-title">Online Arena</h2>
          <div className="lobby-presence-pill">
            <span className="live-pulse-dot" />
            <span>{onlineCount} {onlineCount === 1 ? 'person' : 'people'} connected</span>
          </div>
        </div>

        <div className="lobby-tabs">
          <button
            type="button"
            className={`lobby-tab ${activeTab === 'auto' ? 'lobby-tab--active' : ''}`}
            onClick={() => setActiveTab('auto')}
          >
            ⚡ Auto Match
          </button>
          <button
            type="button"
            className={`lobby-tab ${activeTab === 'host' ? 'lobby-tab--active' : ''}`}
            onClick={() => setActiveTab('host')}
          >
            🏠 Host Room
          </button>
          <button
            type="button"
            className={`lobby-tab ${activeTab === 'join' ? 'lobby-tab--active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            🔑 Join Room
          </button>
        </div>

        <div className="lobby-body">
          {/* TAB 1: AUTO MATCH */}
          {activeTab === 'auto' && (
            <div className="room-box">
              <div className="room-section">
                <h3>Automatic Matchmaking</h3>
                <p className="quick-info">
                  Instantly pairs you with another player currently in queue.
                </p>

                {isSearchingQueue ? (
                  <div className="searching-indicator mt-3">
                    <div className="radar-spinner" />
                    <p className="searching-title">Searching for an opponent...</p>
                    <p className="searching-hint">
                      {onlineCount > 1
                        ? `Pairing with 1 of ${onlineCount} active players...`
                        : 'Waiting for another player to join matchmaking...'}
                    </p>
                    <button
                      type="button"
                      className="btn btn--secondary mt-4"
                      onClick={handleCancelAutoMatch}
                    >
                      Cancel Search
                    </button>
                  </div>
                ) : (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="btn btn--primary btn-large"
                      onClick={handleStartAutoMatch}
                    >
                      ⚡ Auto Match Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL HOST ROOM */}
          {activeTab === 'host' && (
            <div className="room-box">
              <div className="room-section">
                <h3>Host a Private Match</h3>
                <p className="quick-info">
                  Create a WebRTC P2P room and send the code or link to your friend.
                </p>

                {hostedCode ? (
                  <div className="created-room-box">
                    <p className="code-label">Room Code:</p>
                    <div className="code-display">{hostedCode}</div>

                    <div className="host-actions-row mt-3">
                      <button
                        type="button"
                        className="btn btn--secondary btn--icon"
                        onClick={handleCopyLink}
                      >
                        <span>{isCopied ? '✓ Link Copied!' : '📋 Copy Invite Link'}</span>
                      </button>
                    </div>

                    <div className="searching-indicator mt-4">
                      <div className="radar-spinner" />
                      <p className="searching-title">Waiting for friend to connect...</p>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary btn-large mt-3"
                    onClick={handleCreateRoom}
                    disabled={isConnecting}
                  >
                    {isConnecting ? 'Setting Up...' : '+ Generate Room Code'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL JOIN ROOM */}
          {activeTab === 'join' && (
            <div className="room-box">
              <div className="room-section">
                <h3>Join an Existing Room</h3>
                <p className="quick-info">
                  Enter the 4-character Room Code provided by the host.
                </p>

                <div className="join-input-group mt-3">
                  <input
                    type="text"
                    placeholder="e.g. K8X2"
                    maxLength={8}
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    className="room-input"
                    disabled={isConnecting}
                  />
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={!roomInput.trim() || isConnecting}
                    onClick={handleJoinRoom}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect & Play →'}
                  </button>
                </div>

                {isConnecting && (
                  <div className="searching-indicator mt-4">
                    <div className="radar-spinner" />
                    <p className="searching-title">Connecting to peer host...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="network-status-box mt-4">
              <span className="status-ping-dot" />
              <span className="network-status-text">{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OnlineLobby
