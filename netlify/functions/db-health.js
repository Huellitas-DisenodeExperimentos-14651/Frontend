const { Client } = require('pg');

const getDbUrl = () => process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: DEFAULT_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: DEFAULT_HEADERS, body: JSON.stringify({ error: 'Method not allowed, use GET' }) };
  }

  const dbUrl = getDbUrl();
  const masked = dbUrl ? (dbUrl.slice(0, 10) + '...' + dbUrl.slice(-10)) : null;

  if (!dbUrl) {
    return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: false, message: 'Database URL env var not set', vars: { NETLIFY_DATABASE_URL_UNPOOLED: !!process.env.NETLIFY_DATABASE_URL_UNPOOLED, NETLIFY_DATABASE_URL: !!process.env.NETLIFY_DATABASE_URL, DATABASE_URL: !!process.env.DATABASE_URL } }) };
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 AS ok');
    await client.end();
    return { statusCode: 200, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: true, message: 'Connected to DB', maskedDbUrl: masked, queryResult: res.rows }) };
  } catch (err) {
    try { await client.end(); } catch (e) {}
    return { statusCode: 500, headers: DEFAULT_HEADERS, body: JSON.stringify({ ok: false, message: 'Failed to connect to DB', maskedDbUrl: masked, error: err && err.message ? err.message : String(err) }) };
  }
};
