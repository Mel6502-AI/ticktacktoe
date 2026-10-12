const PRESENCE_CHANNEL = 'tictactoe_presence_channel_v1'

export class PresenceManager {
  constructor({ onPresenceChange, onMatchFound }) {
    this.clientId = 'tab_' + Math.random().toString(36).substring(2, 9)
    this.onPresenceChange = onPresenceChange
    this.onMatchFound = onMatchFound

    this.activeTabs = new Map() // tabId -> timestamp
    this.inQueue = false
    this.onlineCount = 1

    // BroadcastChannel for cross-tab sync
    this.channel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel(PRESENCE_CHANNEL)
      : null

    this.setupBroadcast()
    this.setupHmr()
    this.startHeartbeat()
  }

  setupHmr() {
    // If Vite dev server HMR is available
    if (typeof import.meta !== 'undefined' && import.meta.hot) {
      import.meta.hot.on('tictactoe:presence', (data) => {
        if (data && typeof data.count === 'number') {
          this.updateCount(Math.max(data.count, this.activeTabs.size + 1))
        }
      })

      import.meta.hot.on('tictactoe:match_found', (data) => {
        if (this.inQueue && this.onMatchFound) {
          this.inQueue = false
          this.onMatchFound(data)
        }
      })

      // Send initial ping to get presence count
      import.meta.hot.send('tictactoe:ping', {})
    }
  }

  setupBroadcast() {
    if (!this.channel) return

    this.channel.onmessage = (event) => {
      const msg = event.data
      if (!msg) return

      if (msg.type === 'PING') {
        this.activeTabs.set(msg.clientId, Date.now())
        this.recalculateCount()
      } else if (msg.type === 'BYE') {
        this.activeTabs.delete(msg.clientId)
        this.recalculateCount()
      } else if (msg.type === 'AUTO_QUEUE_JOIN') {
        // Another tab joined matchmaking queue!
        if (this.inQueue && msg.clientId !== this.clientId) {
          // We are both in queue: host match!
          const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
          this.channel.postMessage({
            type: 'AUTO_MATCH_CONFIRMED',
            targetId: msg.clientId,
            hostId: this.clientId,
            roomCode,
          })
          this.inQueue = false
          if (this.onMatchFound) {
            this.onMatchFound({ roomCode, isHost: true })
          }
        }
      } else if (msg.type === 'AUTO_MATCH_CONFIRMED') {
        if (msg.targetId === this.clientId && this.inQueue) {
          this.inQueue = false
          if (this.onMatchFound) {
            this.onMatchFound({ roomCode: msg.roomCode, isHost: false })
          }
        }
      }
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      // Clean up stale tabs (older than 3.5s)
      const now = Date.now()
      let changed = false
      for (const [id, ts] of this.activeTabs.entries()) {
        if (now - ts > 3500) {
          this.activeTabs.delete(id)
          changed = true
        }
      }
      if (changed) this.recalculateCount()

      // Broadcast our presence ping
      if (this.channel) {
        this.channel.postMessage({
          type: 'PING',
          clientId: this.clientId,
          inQueue: this.inQueue,
        })
      }

      // Ping Vite server if available
      if (typeof import.meta !== 'undefined' && import.meta.hot) {
        import.meta.hot.send('tictactoe:ping', {})
      }
    }, 1500)
  }

  recalculateCount() {
    const localTabsCount = this.activeTabs.size + 1
    this.updateCount(localTabsCount)
  }

  updateCount(newCount) {
    if (this.onlineCount !== newCount) {
      this.onlineCount = Math.max(1, newCount)
      if (this.onPresenceChange) {
        this.onPresenceChange(this.onlineCount)
      }
    }
  }

  joinAutoMatchQueue() {
    this.inQueue = true

    // Notify Vite server
    if (typeof import.meta !== 'undefined' && import.meta.hot) {
      import.meta.hot.send('tictactoe:join_queue', { clientId: this.clientId })
    }

    // Also broadcast across tabs
    if (this.channel) {
      this.channel.postMessage({
        type: 'AUTO_QUEUE_JOIN',
        clientId: this.clientId,
      })
    }
  }

  leaveAutoMatchQueue() {
    this.inQueue = false

    if (typeof import.meta !== 'undefined' && import.meta.hot) {
      import.meta.hot.send('tictactoe:leave_queue', { clientId: this.clientId })
    }
  }

  destroy() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'BYE', clientId: this.clientId })
        this.channel.close()
      } catch {}
    }
  }
}
