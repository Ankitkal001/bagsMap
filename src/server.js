const express = require('express');
const cors = require('cors');
const path = require('path');
const { updateWorldState, getWorldState } = require('./services/worldState');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// SSE Clients
let clients = [];

// Polling Loop (30 seconds)
const POLL_INTERVAL = 30000;

async function runPoller() {
  try {
    const newState = await updateWorldState();
    broadcast(newState);
  } catch (error) {
    console.error('Poller error:', error);
  }
  setTimeout(runPoller, POLL_INTERVAL);
}

// Initial run
runPoller();

// API Endpoint (optional, for debugging or initial load)
app.get('/api/world-state', (req, res) => {
  res.json(getWorldState());
});

// SSE Endpoint
app.get('/api/stream', (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res
  };

  clients.push(newClient);
  console.log(`${clientId} Connection opened`);

  // Send current state immediately on connection
  const data = `data: ${JSON.stringify(getWorldState())}\n\n`;
  res.write(data);

  req.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
});

function broadcast(state) {
  const data = `data: ${JSON.stringify(state)}\n\n`;
  clients.forEach(client => {
    client.res.write(data);
  });
}

app.listen(PORT, () => {
  console.log(`Bags Town server running at http://localhost:${PORT}`);
});
