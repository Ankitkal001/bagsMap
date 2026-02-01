# Bags Town
**A living pixel art world powered by real Solana on-chain activity**

Bags Town transforms abstract DeFi data into a living, breathing pixel art game. Every token launched on Bags.fm becomes a character. Every fee claim makes the world healthier. Every whale move triggers visual changes.

## What is Bags Town?

**Bags Town** is a visual layer for the Bags.fm ecosystem. Instead of staring at spreadsheets or charts, you can watch the top projects wander, interact, and grow in a persistent MMO-style world.

┌─────────────────────────────────────────────────────────────────┐
│                     REAL ON-CHAIN DATA                          │
│  Token Launches • Fee Claims • Trading Volume • Market Caps     │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BAGS TOWN ENGINE                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ World State │  │   Phaser 3  │  │      Retro Pixel        │  │
│  │ Calculator  │  │ Game Engine │  │      Art Renderer       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LIVING GAME WORLD                          │
│  Characters wander • Buildings anchor • Ships patrol • Live Data│
└─────────────────────────────────────────────────────────────────┘

## Core Mechanics

| On-Chain Event | In-Game Effect |
| :--- | :--- |
| **Token Launch** | New character spawns in the town |
| **Fees Increase** | Character size grows (Small -> Medium -> Large) |
| **Price Volatility** | Character speed increases |
| **Market Activity** | "Sniper Bots" (Pirate Ships) patrol the waters |
| **Click/Interact** | Opens "Trading Card" with real-time stats |

## Features

### 🏰 The Island
A procedurally arranged island with distinct zones:
- **Central Plaza**: Where the community gathers.
- **BagsAPP Hub**: A futuristic Blue & Gold tower representing the platform.
- **FinnBags Citadel**: A massive Green & Gold skyscraper honoring the founder.
- **The Ocean**: Patrolled by Sniper Bots looking for liquidity.

### 🃏 Live Trading Cards
Click on any character to see their live stats:
- **Real-Time Prices**: Synced with Bags.fm API.
- **Creator & Royalty Info**: Directly links to Twitter handles.
- **Performance Metrics**: 24h Volume, Market Cap, Lifetime Fees.

### 📱 Mobile Optimized
- **Pinch-to-Zoom**: Explore the map with native gestures.
- **Responsive UI**: "Retro Terminal" interface adapts to any screen size.
- **Touch Controls**: Tap to inspect, drag to pan.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Game Engine** | Phaser 3 |
| **Backend** | Node.js, Express |
| **Data Source** | Bags.fm Public API |
| **Deployment** | Vercel (Serverless) |

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Ankitkal001/bagsMap.git
cd bagsMap
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
```bash
# Start the backend server (polls API and serves frontend)
node src/server.js
```
Open `http://localhost:3000` in your browser.

## Deployment

The project is configured for **Vercel**.

1.  Install Vercel CLI: `npm i -g vercel`
2.  Deploy: `vercel --prod`

*Note: The project uses a polling mechanism instead of SSE for Vercel compatibility.*

## Architecture

```
/
├── public/               # Static Assets & Frontend Code
│   ├── js/game.js        # Main Phaser Game Logic
│   ├── style.css         # Retro Terminal Styling
│   └── index.html        # Entry Point
├── src/
│   ├── server.js         # Express Server & API Proxy
│   └── services/
│       ├── bagsApi.js    # Bags.fm Data Fetcher
│       └── worldState.js # Data Normalization Logic
└── vercel.json           # Deployment Config
```

## Legal Disclaimers

**Independent Project**
Bags Town is an independent project. While we proudly build on and integrate with the Bags.fm ecosystem, this project is not officially affiliated with or sponsored by the Bags.fm team.

**No Financial Advice**
Bags Town is an entertainment product. Nothing in this application constitutes financial, investment, or trading advice. Cryptocurrency trading carries significant risk. Always do your own research (DYOR) before making any financial decisions.

**Third-Party Services**
Bags Town integrates with third-party services including Bags.fm and Twitter. We are not responsible for the availability, accuracy, or security of these external services.

## License

This project is open source and available under the [MIT License](LICENSE).
