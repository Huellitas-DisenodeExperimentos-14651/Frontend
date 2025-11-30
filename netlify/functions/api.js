const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
  try {
    // Ruta al db.json en el repo
    const dbPath = path.join(__dirname, '..', '..', 'server', 'db.json');
    const raw = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(raw);

    // event.path ejemplo: '/.netlify/functions/api/pets/1' o '/.netlify/functions/api/pets'
    const prefix = '/.netlify/functions/api';
    let resourcePath = event.path && event.path.startsWith(prefix) ? event.path.slice(prefix.length) : (event.path || '');
    if (resourcePath.startsWith('/')) resourcePath = resourcePath.slice(1);
    const parts = resourcePath.split('/').filter(Boolean); // ['pets','1']

    // Allow only GET read-only in this serverless version
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS'
        },
        body: JSON.stringify({ error: 'Only GET supported in this demo function' })
      };
    }

    // No resource -> return full DB
    if (!parts.length) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(db)
      };
    }

    const collection = parts[0];
    if (!Object.prototype.hasOwnProperty.call(db, collection)) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Collection not found' })
      };
    }

    if (parts.length === 1) {
      // return full collection
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(db[collection])
      };
    }

    // parts.length >= 2 => item by id
    const id = parts[1];
    const item = Array.isArray(db[collection]) ? db[collection].find(it => String(it.id) === String(id)) : null;
    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Item not found' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(item)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};

