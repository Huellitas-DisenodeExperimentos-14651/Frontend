// scripts/migrate-to-mysql.js
// Lee server/db.json y vuelca cada colección como filas en tablas MySQL.
// Tablas: nombre de colección con '-' -> '_' (ej: adoption-requests -> adoption_requests)
// Cada tabla tendrá columnas: id VARCHAR(255) PRIMARY KEY, data JSON

const fs = require('fs');
const path = require('path');

// Try to require mysql2/promise from local or from server/node_modules
let mysql;
try {
  mysql = require('mysql2/promise');
} catch (e) {
  try {
    const altPath = path.join(__dirname, '..', 'server', 'node_modules', 'mysql2', 'promise');
    mysql = require(altPath);
  } catch (err) {
    console.error('Cannot require mysql2/promise. Install mysql2 in server or root node_modules.');
    throw err;
  }
}

async function main() {
  const dbPath = path.join(__dirname, '..', 'server', 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error('db.json not found at', dbPath);
    process.exit(1);
  }
  const raw = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(raw);

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || 3306;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASS;
  const database = process.env.DB_NAME;

  if (!host || !user || !password || !database) {
    console.error('Please set DB_HOST, DB_USER, DB_PASS, DB_NAME environment variables');
    process.exit(1);
  }

  console.log('Connecting to', host, 'database', database);
  const conn = await mysql.createConnection({ host, port, user, password, database, multipleStatements: true });

  try {
    for (const [collectionName, items] of Object.entries(db)) {
      const table = collectionName.replace(/-/g, '_');
      console.log(`Processing collection ${collectionName} -> table ${table} (${items.length} items)`);

      // Create table if not exists
      const createSql = `CREATE TABLE IF NOT EXISTS \`${table}\` (\n  id VARCHAR(255) PRIMARY KEY,\n  data JSON\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
      await conn.query(createSql);

      // Insert or replace items
      for (const item of items) {
        const id = item.id ? String(item.id) : null;
        const dataStr = JSON.stringify(item);
        if (!id) {
          // generate id
          const genId = 'id-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
          item.id = genId;
        }

        // Use INSERT ... ON DUPLICATE KEY UPDATE to upsert
        const sql = `INSERT INTO \`${table}\` (id, data) VALUES (?, CAST(? AS JSON)) ON DUPLICATE KEY UPDATE data = CAST(? AS JSON)`;
        await conn.query(sql, [String(item.id), dataStr, dataStr]);
      }
    }

    console.log('Migration finished successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    process.exitCode = 2;
  } finally {
    await conn.end();
  }
}

main().catch(e => {
  console.error('Unexpected error', e);
  process.exit(1);
});
