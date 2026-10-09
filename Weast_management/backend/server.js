import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { 
  getLiveBinData, 
  updateBinFill, 
  throwGarbage, 
  discardByManagement, 
  getCampusLocations, 
  updateCampusLocation 
} from './services/aiDetectionService.js';
import { getPredictiveHeatmapData } from './services/predictiveEngine.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/bin/live', (req, res) => {
  res.json(getLiveBinData());
});

app.post('/api/bin/update', (req, res) => {
  const { fillPercentage, reason } = req.body;
  const updated = updateBinFill(fillPercentage, reason || "API Update");
  broadcastState();
  res.json(updated);
});

app.post('/api/bin/throw', (req, res) => {
  const { amount } = req.body;
  const updated = throwGarbage(amount || 5);
  broadcastState();
  res.json(updated);
});

app.post('/api/bin/discard', (req, res) => {
  const updated = discardByManagement();
  broadcastState();
  res.json(updated);
});

app.get('/api/campus/locations', (req, res) => {
  res.json(getCampusLocations());
});

app.post('/api/campus/update', (req, res) => {
  const { id, fillPercentage } = req.body;
  const locations = updateCampusLocation(id, fillPercentage);
  broadcastState();
  res.json(locations);
});

app.get('/api/predictive/heatmap', (req, res) => {
  res.json(getPredictiveHeatmapData());
});

// Create HTTP Server & WebSocket Server for per-second live updates
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastState() {
  const payload = JSON.stringify({
    type: 'LIVE_UPDATE',
    timestamp: new Date().toISOString(),
    binData: getLiveBinData(),
    campusLocations: getCampusLocations(),
    predictiveData: getPredictiveHeatmapData()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  });
}

// Per-second real-time check & heartbeat broadcast
setInterval(() => {
  broadcastState();
}, 1000);

wss.on('connection', (ws) => {
  console.log('🔗 Client connected to GreenLoop Waste WebSocket');
  ws.send(JSON.stringify({
    type: 'INIT',
    binData: getLiveBinData(),
    campusLocations: getCampusLocations(),
    predictiveData: getPredictiveHeatmapData()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === 'THROW_GARBAGE') {
        throwGarbage(data.amount || 5);
        broadcastState();
      } else if (data.action === 'DISCARD_MANAGEMENT') {
        discardByManagement();
        broadcastState();
      } else if (data.action === 'UPDATE_FILL') {
        updateBinFill(data.fillPercentage, data.reason);
        broadcastState();
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 GreenLoop Waste Management Backend active on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server streaming on ws://localhost:${PORT}`);
  console.log(`=================================================`);
});
