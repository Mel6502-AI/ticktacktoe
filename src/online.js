import { Peer } from 'peerjs'

const BROADCAST_CHANNEL_NAME = 'tictactoe_true_online_sync'

export class TrueOnlineManager {
  constructor({ onMessage, onConnected, onDisconnected, onError, onStatus }) {
    this.peer = null
    this.conn = null
    this.onMessage = onMessage
    this.onConnected = onConnected
    this.onDisconnected = onDisconnected
    this.onError = onError
    this.onStatus = onStatus
    this.myPeerId = null
    this.roomCode = null
    this.isHost = false

    // Local tab broadcast sync channel as immediate companion
    this.broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel(BROADCAST_CHANNEL_NAME)
      : null

    if (this.broadcast) {
      this.broadcast.onmessage = (event) => {
        const msg = event.data
        if (msg && msg.roomCode === this.roomCode) {
          if (this.onMessage) {
            this.onMessage(msg)
          }
        }
      }
    }
  }

  logStatus(msg) {
    if (this.onStatus) this.onStatus(msg)
  }

  hostRoom(rawCode, onReady) {
    this.isHost = true
    const cleanCode = rawCode.toLowerCase().replace(/[^a-z0-9]/g, '')
    this.roomCode = cleanCode
    const peerId = `ttt-room-${cleanCode}`

    this.logStatus('Connecting to WebRTC cloud network...')

    try {
      this.peer = new Peer(peerId, {
        debug: 1,
      })
    } catch (err) {
      if (this.onError) this.onError(err)
      return
    }

    this.peer.on('open', (id) => {
      this.myPeerId = id
      this.logStatus('Room created! Waiting for opponent to connect...')
      if (onReady) onReady(cleanCode)
    })

    this.peer.on('connection', (connection) => {
      this.conn = connection
      this.logStatus('Opponent connecting...')
      this.setupConnection(connection)
    })

    this.peer.on('error', (err) => {
      this.logStatus(`Network error: ${err.type || err.message}`)
      if (this.onError) this.onError(err)
    })
  }

  joinRoom(rawCode, onReady) {
    this.isHost = false
    const cleanCode = rawCode.toLowerCase().replace(/[^a-z0-9]/g, '')
    this.roomCode = cleanCode
    const hostPeerId = `ttt-room-${cleanCode}`

    this.logStatus('Connecting to peer network...')

    try {
      this.peer = new Peer({
        debug: 1,
      })
    } catch (err) {
      if (this.onError) this.onError(err)
      return
    }

    this.peer.on('open', (myId) => {
      this.myPeerId = myId
      this.logStatus(`Found server. Connecting to host room (${cleanCode.toUpperCase()})...`)

      const connection = this.peer.connect(hostPeerId, {
        reliable: true,
      })
      this.conn = connection
      this.setupConnection(connection, () => {
        if (onReady) onReady(cleanCode)
      })
    })

    this.peer.on('error', (err) => {
      this.logStatus(`Connection failed: ${err.type || err.message}`)
      if (this.onError) this.onError(err)
    })
  }

  setupConnection(connection, onOpenCb) {
    connection.on('open', () => {
      this.logStatus('Connected! Starting online match...')
      if (onOpenCb) onOpenCb()
      if (this.onConnected) this.onConnected({ isHost: this.isHost, roomCode: this.roomCode })
    })

    connection.on('data', (data) => {
      if (this.onMessage) {
        this.onMessage(data)
      }
    })

    connection.on('close', () => {
      this.logStatus('Opponent disconnected.')
      if (this.onDisconnected) this.onDisconnected()
    })

    connection.on('error', (err) => {
      if (this.onError) this.onError(err)
    })
  }

  send(data) {
    const payload = { ...data, roomCode: this.roomCode }
    if (this.conn && this.conn.open) {
      try {
        this.conn.send(payload)
      } catch (err) {
        console.error('P2P Send error:', err)
      }
    }
    // Also broadcast to other local tabs if any
    if (this.broadcast) {
      try {
        this.broadcast.postMessage(payload)
      } catch {}
    }
  }

  close() {
    if (this.conn) {
      try {
        this.conn.close()
      } catch {}
      this.conn = null
    }
    if (this.peer) {
      try {
        this.peer.destroy()
      } catch {}
      this.peer = null
    }
    if (this.broadcast) {
      try {
        this.broadcast.close()
      } catch {}
      this.broadcast = null
    }
  }
}
