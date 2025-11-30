// Simple health check Netlify Function
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: DEFAULT_HEADERS, body: '' };
  }

  return {
    statusCode: 200,
    headers: DEFAULT_HEADERS,
    body: JSON.stringify({ ok: true, message: 'Netlify Functions are reachable' })
  };
};

