import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'tictactoe-matchmaker-plugin',
      configureServer(server) {
        let waitingPlayer = null

        function broadcastPresence() {
          const count = server.ws.clients ? server.ws.clients.size : 1
          server.ws.send({
            type: 'custom',
            event: 'tictactoe:presence',
            data: { count },
          })
        }

        server.ws.on('connection', () => {
          broadcastPresence()
        })

        server.ws.on('close', () => {
          setTimeout(broadcastPresence, 150)
        })

        server.ws.on('tictactoe:ping', () => {
          broadcastPresence()
        })

        server.ws.on('tictactoe:join_queue', (data, client) => {
          // If another player is already waiting in queue and still connected
          if (waitingPlayer && waitingPlayer.client !== client && waitingPlayer.client.readyState === 1) {
            const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase()

            waitingPlayer.client.send({
              type: 'custom',
              event: 'tictactoe:match_found',
              data: { roomCode, isHost: true },
            })

            client.send({
              type: 'custom',
              event: 'tictactoe:match_found',
              data: { roomCode, isHost: false },
            })

            waitingPlayer = null
          } else {
            waitingPlayer = { client, data }
          }
        })

        server.ws.on('tictactoe:leave_queue', (_data, client) => {
          if (waitingPlayer && waitingPlayer.client === client) {
            waitingPlayer = null
          }
        })
      },
    },
  ],
})
