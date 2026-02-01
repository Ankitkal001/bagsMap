# Bags Town - Implementation Plan

## 1. Core Architecture

### Backend (Node.js/Express)
- **Role**: Data aggregator and normalizer.
- **Components**:
    - `src/services/bagsApi.js`: Handles fetching data from Bags.fm APIs. **(Currently in Mock Mode due to API 404)**.
    - `src/services/worldState.js`: Maintains the current "normalized" state of the town.
    - `server.js`: Express server serving static files and the SSE/API endpoint.
- **Data Flow**:
    1. Poller runs every ~30s.
    2. Fetches `token-launch/top`, `lifetime-fees`, and `latestPrice`.
    3. Normalizes data into `Character` objects.
    4. Pushes updates to connected clients via SSE (Server-Sent Events).

### Frontend (HTML/Canvas)
- **Role**: Visual renderer.
- **Components**:
    - `public/index.html`: Container.
    - `public/js/game.js`: Main logic (SSE connection, Game Loop, Rendering).
    - `public/style.css`: Styling.
- **Visuals**:
    - Static pixel-art background (Island with procedural buildings).
    - Dynamic characters (projects) moving around.

## 2. Data Model

### Normalized World State (JSON)
```json
{
  "timestamp": 1234567890,
  "characters": [
    {
      "id": "token_mint_address",
      "symbol": "BAGS",
      "size": 1, // 1 (small), 2 (medium), 3 (large) - based on lifetime fees
      "speed": 1.0, // based on price delta/activity
      "state": "active", // active, fading
      "fees": 5000,
      "priceDelta": 0.05
    }
  ]
}
```

## 3. Implementation Status

- [x] **Backend Skeleton & API Service**: Implemented with Mock fallback.
- [x] **Backend Polling & SSE**: Implemented.
- [x] **Frontend Basic Setup**: Implemented.
- [x] **Visuals & Rendering**:
    - [x] Canvas setup.
    - [x] Island & Building generation.
    - [x] Character rendering (shapes + labels).
    - [x] Wandering behavior.
- [x] **Data Integration**: Connected via SSE.

## 4. Constraints Checklist
- [x] No Three.js/WebGL (Canvas 2D only).
- [x] No AI/LLM runtime generation.
- [x] Backend poller ~30s.
- [x] Normalized world state.
- [x] Visual clarity over complexity.

## 5. Next Steps (V1.1)
- Restore real API calls when endpoints are available.
- Add actual pixel art sprites instead of colored rects.
- Implement "entering/leaving" animations.
