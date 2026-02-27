const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 3005;

// ================================
// MySQL Connection Pool
// ================================

const db = mysql.createPool({
  host: '127.0.0.1',
  user: 'raul',
  password: '$Sppttii2RcJr',
  database: 'collector'
});

// ================================
// Middleware
// ================================

// CORS (collector + test site are different origins)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// ================================
// /collect — ingestion endpoint
// ================================

app.post('/collect', (req, res) => {
  const payload = req.body;

  if (!payload || !payload.url || !payload.type) {
    return res.status(400).json({ error: 'Missing required fields: url, type' });
  }

  payload.serverTimestamp = new Date().toISOString();
  payload.ip = req.ip;

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

// ================================
// REST API — Part 5
// ================================

// GET all events
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// GET one event
app.get('/api/events/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM events WHERE id = ?',
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.sendStatus(404);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// POST new event
app.post('/api/events', async (req, res) => {
  const { session_id, event_type, url, payload } = req.body;

  try {
    await db.query(
      'INSERT INTO events (session_id, event_type, url, payload) VALUES (?, ?, ?, ?)',
      [session_id, event_type, url, payload || {}]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// DELETE event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM events WHERE id = ?',
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.sendStatus(404);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// PUT update event
app.put('/api/events/:id', async (req, res) => {
  const { event_type, url, payload } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE events SET event_type=?, url=?, payload=? WHERE id=?',
      [event_type, url, payload, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.sendStatus(404);
    }

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// ================================
// Static (optional)
// ================================

app.use(express.static(__dirname));

// ================================
// Start server
// ================================

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Analytics endpoint listening on http://127.0.0.1:${PORT}`);
});