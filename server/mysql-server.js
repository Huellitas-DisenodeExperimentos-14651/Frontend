// server/mysql-server.js
// Express-based REST server backed by MySQL. Tables expected: collection name with '-' -> '_' and columns: id VARCHAR(255) PRIMARY KEY, data JSON
const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || 3306;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;

if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  console.error('Missing DB credentials. Set DB_HOST, DB_USER, DB_PASS, DB_NAME');
  process.exit(1);
}

let pool;

function tableName(collection) {
  return collection.replace(/-/g, '_');
}

app.get('/:collection', async (req, res) => {
  const collection = req.params.collection;
  const table = tableName(collection);
  try {
    const [rows] = await pool.query(`SELECT data FROM \`${table}\``);
    const data = rows.map(r => JSON.parse(r.data));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const table = tableName(collection);
  try {
    const [rows] = await pool.query(`SELECT data FROM \`${table}\` WHERE id = ?`, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(JSON.parse(rows[0].data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/:collection', async (req, res) => {
  const collection = req.params.collection;
  const table = tableName(collection);
  let item = req.body;
  if (!item.id) {
    item.id = String(Date.now()) + '-' + Math.floor(Math.random() * 10000);
  }
  const dataStr = JSON.stringify(item);
  try {
    await pool.query(`INSERT INTO \`${table}\` (id, data) VALUES (?, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE data = CAST(? AS JSON)`, [String(item.id), dataStr, dataStr]);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const table = tableName(collection);
  const item = req.body;
  item.id = id;
  const dataStr = JSON.stringify(item);
  try {
    await pool.query(`INSERT INTO \`${table}\` (id, data) VALUES (?, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE data = CAST(? AS JSON)`, [String(id), dataStr, dataStr]);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/:collection/:id', async (req, res) => {
  const { collection, id } = req.params;
  const table = tableName(collection);
  try {
    await pool.query(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function ensureTablesFromDBJson(conn) {
  const dbPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) return;
  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);
  for (const [collectionName, items] of Object.entries(db)) {
    const table = tableName(collectionName);
    const createSql = `CREATE TABLE IF NOT EXISTS \`${table}\` ( id VARCHAR(255) PRIMARY KEY, data JSON ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    await conn.query(createSql);
  }
}

async function seedDbFromJson(conn) {
  const dbPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) return;
  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);
  for (const [collectionName, items] of Object.entries(db)) {
    const table = tableName(collectionName);
    for (const item of items) {
      if (!item.id) item.id = String(Date.now()) + '-' + Math.floor(Math.random() * 10000);
      const dataStr = JSON.stringify(item);
      await conn.query(`INSERT INTO \`${table}\` (id, data) VALUES (?, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE data = CAST(? AS JSON)`, [String(item.id), dataStr, dataStr]);
    }
  }
}

(async function start() {
  try {
    pool = mysql.createPool({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASS, database: DB_NAME, connectionLimit: 10 });
    const conn = await pool.getConnection();
    await ensureTablesFromDBJson(conn);
    if (process.env.SEED_DB === 'true') {
      console.log('Seeding DB from server/db.json...');
      await seedDbFromJson(conn);
      console.log('Seeding finished');
    }
    conn.release();

    const port = process.env.PORT || 3001;
    app.listen(port, () => console.log(`MySQL-backed server listening on port ${port}`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
})();

