import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

let players = {};

app.use(express.static(path.join(__dirname, 'web')));

wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).substr(2, 9);
  ws.hp = 100;

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'register') {
        players[ws.id] = { name: data.name, hp: 100 };
        broadcast({ type: 'update', players });
      } else if (data.type === 'shoot') {
        const targetId = data.targetId;
        if (players[targetId]) {
          players[targetId].hp -= 10;
          if (players[targetId].hp < 0) players[targetId].hp = 0;
          broadcast({ type: 'update', players });
        }
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    delete players[ws.id];
    broadcast({ type: 'update', players });
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(msg);
  });
}

server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
