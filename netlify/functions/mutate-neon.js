// Netlify Function to mutate Neon (create/update/delete) using a simple JSONB table schema:
// Tables must have columns: id TEXT PRIMARY KEY, data JSONB
// Request (POST) JSON body: { action: 'create'|'update'|'delete', collection: 'pets', item: {...}, id: '123' }

const { Client } = require('pg');

const getDbUrl = () => process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

// sanitize identifier to valid postgres identifier
function sanitizeTable(name) {
  return name.replace(/-/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

// Common headers (CORS + JSON) - similar to query-neon.js
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async function(event, context) {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: DEFAULT_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Method not allowed, use POST' }) };
  }

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    return { statusCode: 500, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Database URL not configured.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { action, collection, item, id } = body;
  if (!action || !collection) {
    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Missing action or collection' }) };
  }

  const table = sanitizeTable(collection);
  // whitelist collections (both raw and sanitized forms)
  const allowedRaw = ['pets','users','publications','adoption_requests','adoption-requests'];
  const allowedSanitized = allowedRaw.map(sanitizeTable);
  if (!allowedRaw.includes(collection) && !allowedSanitized.includes(table)) {
    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Collection not allowed' }) };
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    // Helper to prepare JSONB value (stringify objects)
    const prepareData = (v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === 'string') return v;
      try {
        return JSON.stringify(v);
      } catch (e) {
        // fallback to String
        return String(v);
      }
    };

    if (action === 'create') {
      if (!item || !item.id) return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Item with id required for create' }) };
      const insertSql = `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
      const dataValue = prepareData(item);
      await client.query(insertSql, [String(item.id), dataValue]);
      return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: item.id }) };
    }

    if (action === 'update') {
      if (!item && !id) return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'item or id required for update' }) };
      const uid = item && item.id ? String(item.id) : String(id);
      const updateSql = `INSERT INTO ${table} (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
      const dataValue = prepareData(item);
      await client.query(updateSql, [uid, dataValue]);
      return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: uid }) };
    }

    if (action === 'delete') {
      const uid = id ? String(id) : (item && item.id ? String(item.id) : null);
      if (!uid) return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'id required for delete' }) };
      const delSql = `DELETE FROM ${table} WHERE id = $1`;
      await client.query(delSql, [uid]);
      return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, id: uid }) };
    }

    return { statusCode: 400, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (err) {
    console.error('mutate-neon error', err);
    return { statusCode: 500, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: err && err.message ? err.message : String(err) }) };
  } finally {
    try { await client.end(); } catch (e) {}
  }
};
