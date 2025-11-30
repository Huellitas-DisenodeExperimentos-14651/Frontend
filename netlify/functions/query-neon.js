// Netlify Function to query Neon via `pg`.
// Usage: /.netlify/functions/query-neon?collection=pets

const { Client } = require('pg');

// Prefer the unpooled URL for serverless environments if provided
const getDbUrl = () => process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;

exports.handler = async function (event, context) {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    return {
      statusCode: 500,
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
        body: JSON.stringify({ error: 'Missing `collection` query parameter. Example: ?collection=pets' }),
      };
    }

    // whitelist collections
    let res;
    switch (collection) {
      case 'pets':
        res = await client.query('SELECT data FROM pets');
        break;
      case 'users':
        res = await client.query('SELECT data FROM users');
        break;
      case 'publications':
        res = await client.query('SELECT data FROM publications');
        break;
      case 'adoption_requests':
        res = await client.query('SELECT data FROM adoption_requests');
        break;
      default:
        await client.end();
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid collection. Allowed: pets, users, publications, adoption_requests' }),
        };
    }

    const rows = res.rows.map(r => r.data ?? r);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('query-neon error', error);
    try { await client.end(); } catch (e) {}
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
