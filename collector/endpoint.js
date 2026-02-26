const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3005;
const LOG_FILE = path.join(__dirname, 'analytics.jsonl');

const db = mysql.createPool({
  host: 'localhost',
  user: 'collector_user',
  password: 'collector_pass',
  database: 'collector'
});
// CORS headers — required when collector and endpoint are on different origins
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.post('/collect', (req, res) => {
  const payload = req.body;

  // Validate: must have url and type at minimum
  if (!payload || !payload.url || !payload.type) {
    return res.status(400).json({ error: 'Missing required fields: url, type' });
  }

  // Add server-side timestamp (client clocks can be wrong)
  payload.serverTimestamp = new Date().toISOString();

  // Add IP address (Express provides this)
  payload.ip = req.ip;

  // Append to JSON Lines file
  const line = JSON.stringify(payload) + '\n';
  (async () => {
  try {
    await db.execute(
      `INSERT INTO events (session_id, event_type, url, payload)
       VALUES (?, ?, ?, ?)`,
      [
        payload.session || null,
        payload.type,
        payload.url,
        JSON.stringify(payload)
      ]
    );

    res.sendStatus(204);
  } catch (err) {
    console.error('DB insert error:', err);
    res.sendStatus(500);
  }
})();
});

app.use(express.static(__dirname));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Analytics endpoint listening on http://127.0.0.1:${PORT}`);
});