// Netlify Function to query Neon via `pg`.
// Usage: /.netlify/functions/query-neon?collection=pets

const { Client } = require('pg');

// Prefer the unpooled URL for serverless environments if provided
const getDbUrl = () => process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

// Common headers (CORS + JSON)
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Helper to query either `data` column or fallback to row_to_json
async function fetchRows(client, table) {
  // Try selecting data column first
  try {
    const res = await client.query(`SELECT data FROM ${table}`);
    // if rows exist and have data property, return them
    if (res && res.rows && res.rows.length > 0 && Object.prototype.hasOwnProperty.call(res.rows[0], 'data')) {
      return res.rows.map(r => r.data ?? r);
    }
  } catch (err) {
    // ignore and try fallback
  }

  // fallback: select whole row as JSON
  const fallback = await client.query(`SELECT row_to_json(${table}.*) AS data FROM ${table}`);
  return fallback.rows.map(r => r.data ?? r);
}

exports.handler = async function (event, context) {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: DEFAULT_HEADERS, body: '' };
  }

  const dbUrl = getDbUrl();
  if (!dbUrl) {
    return {
      statusCode: 500,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ error: 'Database URL not configured. Set NETLIFY_DATABASE_URL or NETLIFY_DATABASE_URL_UNPOOLED.' }),
    };
  }

  // Some Postgres hosts (like Neon) require SSL. We disable certificate verification here
  // to avoid issues in serverless environments. If you have custom CA, adjust accordingly.
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();

    const params = event.queryStringParameters || {};
    const collection = params.collection;

    if (!collection) {
      await client.end();
      return {
        statusCode: 400,
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ error: 'Missing `collection` query parameter. Example: ?collection=pets' }),
      };
    }

    // whitelist collections
    let rows;
    switch (collection) {
      case 'pets':
        rows = await fetchRows(client, 'pets');
        break;
      case 'users':
        rows = await fetchRows(client, 'users');
        break;
      case 'publications':
        rows = await fetchRows(client, 'publications');
        break;
      case 'adoption_requests':
      case 'adoption-requests':
        rows = await fetchRows(client, 'adoption_requests');
        break;
      default:
        await client.end();
        return {
          statusCode: 400,
          headers: DEFAULT_HEADERS,
          body: JSON.stringify({ error: 'Invalid collection. Allowed: pets, users, publications, adoption_requests' }),
        };
    }

    await client.end();

    return {
      statusCode: 200,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error('query-neon error', error);
    try { await client.end(); } catch (e) {}
    return {
      statusCode: 500,
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
