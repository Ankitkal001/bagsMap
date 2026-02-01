const express = require('express');
const cors = require('cors');
const path = require('path');
const { updateWorldState, getWorldState } = require('./services/worldState');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// Fetch Cache
let cachedState = null;
let lastUpdate = 0;
const CACHE_TTL = 30000; // 30 seconds

// API Endpoint
app.get('/api/world-state', async (req, res) => {
  const now = Date.now();
  if (!cachedState || now - lastUpdate > CACHE_TTL) {
      try {
          cachedState = await updateWorldState();
          lastUpdate = now;
      } catch (error) {
          console.error('Update error:', error);
      }
  }
  res.json(cachedState || getWorldState());
});

// SSE Endpoint (Kept for local dev, but frontend now prefers polling)
app.get('/api/stream', (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);
  
  // Just send current state once and close, essentially long-polling
  const data = `data: ${JSON.stringify(cachedState || getWorldState())}\n\n`;
  res.write(data);
  res.end(); 
});

if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`Bags Town server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
