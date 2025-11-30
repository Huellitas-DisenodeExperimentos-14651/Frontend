// scripts/test-netlify-fn.js
const api = require('../netlify/functions/api.js');

async function run() {
  const event = { path: '/.netlify/functions/api/pets', httpMethod: 'GET' };
  const res = await api.handler(event, {});
  console.log('statusCode:', res.statusCode);
  console.log('body preview:', (res.body || '').slice(0, 500));
}

run().catch(e => {
  console.error('Error:', e);
});

