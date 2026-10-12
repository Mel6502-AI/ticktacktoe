# ✦ Tic-Tac-Toe Arena

A modern, responsive, cross-platform Tic-Tac-Toe arena built with **React**, **Vite**, and **WebRTC**.

🎮 **Live Web Version**: [https://melvynkui.com/games/tictactoe/](https://melvynkui.com/games/tictactoe/)  
📦 **macOS Native Installer**: `TicTacToe-Arena-1.0.0-arm64.dmg` (included in project root)

---

## ⚡ Key Features

- **Panoramic 3-Column Layout**: Uses the full screen width with Player 1 on the left, the rigid non-deformable 3×3 board in the center, and Player 2 / AI on the right.
- **Physical "YOUR TURN" Switch Widgets**: Dedicated illuminated toggle switches down below both player cards that switch on with vibrant neon glows when it is that player's turn.
- **Strict 1:1 Geometry**: Rigid CSS grid sizing and vector SVG marks ensure squares never deform or stretch regardless of screen size or symbols placed.
- **Fair Play Turn Rotation**: Starters are randomized on new matches and alternate every round so Player 1 never always goes first.
- **4 Distinct Game Modes**:
  1. **🤖 Solo vs Bot**: Built-in AI engine with selectable difficulty (*Easy*, *Medium*, and unbeatable *Master* powered by the Minimax algorithm).
  2. **👥 1v1 Local Duel**: Pass-and-play on the same screen with dual turn indicators.
  3. **🌐 Real-Time Online Multiplayer**: 100% genuine peer-to-peer multiplayer powered by **WebRTC DataChannels** with:
     - **⚡ 1-Click Auto Pair Matchmaking**: Automatically pairs you with another waiting player.
     - **🔑 Private Room Codes & Shareable Links**: Instant invite link generation.
     - **🟢 Real-Time Presence Counter**: Live indicator showing active people connected to the game in real time.
  4. **🚪 Clean Exit / Quit Screen**: Graceful session termination.
- **Web Audio Sound Effects**: Crisp audio synthesis for moves, victories, draws, and clicks with an instant mute toggle in the top bar.

---

## 🚀 Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). Open multiple tabs to test the real-time presence counter and auto pair matching!

### 3. Lint & format
```bash
npm run lint
```

---

## 📦 Building for All Platforms

### Web Production Build
```bash
npm run build
```
Outputs to `dist/`. Assets use relative `./` paths, so the build can be deployed to any subfolder (e.g. `yourwebsite.com/games/tictactoe/`) or embedded inside an `<iframe>`.

### macOS Native DMG Installer
```bash
npm run build:mac
```
Generates a native `.dmg` drag-and-drop installer in `release/` and project root.

### Windows & Linux
The Electron configuration supports cross-platform packaging:
```bash
npx electron-builder --win   # Windows (.exe installer)
npx electron-builder --linux # Linux (AppImage / .deb)
```

### Mobile (iOS & Android via Capacitor)
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npx cap sync
```

---

## 🛠 Tech Stack

- **Frontend**: React 19, CSS Modern Design System
- **Bundler & Tooling**: Vite 8, Oxlint
- **Networking**: WebRTC P2P (PeerJS) & BroadcastChannel
- **Desktop Packaging**: Electron & electron-builder
- **Deployment**: Cloudflare Workers Static Assets
