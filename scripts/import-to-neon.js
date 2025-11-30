// Script to import server/db.json into Neon (Postgres) using `pg`.
// It creates simple tables named after collections (sanitized) with columns:
//   id TEXT PRIMARY KEY, data JSONB
// and upserts each object by id.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const dbUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Error: No database URL found. Set NETLIFY_DATABASE_URL environment variable.');
    process.exit(1);
  }

  // Use SSL with relaxed certificate verification for Neon/managed Postgres
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('Connected to Neon (Postgres).');

    const dbPath = path.join(__dirname, '..', 'server', 'db.json');
    const raw = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(raw);

    // For each top-level key (collection) create a table and upsert rows
    for (const [collectionName, items] of Object.entries(data)) {
      if (!Array.isArray(items)) continue;

      // sanitize collection name to be a valid identifier
      const tableName = collectionName.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();

      console.log(`Processing collection: ${collectionName} -> table: ${tableName} (${items.length} items)`);

      // Create table if not exists
      const createSql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL
        )
      `;
      await client.query(createSql);

      // Upsert each item
      const insertText = `INSERT INTO ${tableName} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;

      for (const item of items) {
        const id = item.id ? String(item.id) : null;
        if (!id) {
          console.warn('Skipping item without id in collection', collectionName, item);
          continue;
        }

        await client.query(insertText, [id, item]);
      }

      console.log(`Imported ${items.length} rows into ${tableName}`);
    }

    console.log('Import completed successfully.');
  } catch (err) {
    console.error('Import error:', err);
    process.exitCode = 2;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main();
}
