// server/index.js
// Simple json-server wrapper to allow deployment platforms to use process.env.PORT
const path = require('path');
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults({
  static: path.join(__dirname, 'public')
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// You can add custom routes or middleware here if needed
server.use((req, res, next) => {
  // Example: set CORS headers (json-server defaults include these but keep for safety)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

server.use(router);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`JSON Server is running on port ${port}`);
});

