const http = require('http');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/snakegame';

const mimeTypes = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'text/javascript',
  '.ico':  'image/x-icon',
};

let db;

async function connectDB(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      db = client.db('snakegame');
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.log(`MongoDB not ready, retrying in ${delay}ms... (${i + 1}/${retries})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Could not connect to MongoDB after multiple retries');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/api/scores') {
    try {
      const scores = await db.collection('scores')
        .find({ status: { $ne: 'hidden' } })
        .sort({ score: -1 })
        .limit(10)
        .toArray();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(scores));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'DB error' }));
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/scores') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { name, score, level } = JSON.parse(body);
        if (!name || typeof score !== 'number') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid payload' }));
          return;
        }
        await db.collection('scores').insertOne({
          name: name.slice(0, 20),
          score,
          level,
          date: new Date(),
        });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DB error' }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/api/admin') {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'DELETE' && req.url.startsWith('/api/scores/')) {
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken || req.headers.authorization !== `Bearer ${adminToken}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }
    const id = req.url.slice('/api/scores/'.length);
    try {
      await db.collection('scores').updateOne({ _id: new ObjectId(id) }, { $set: { status: 'hidden' } });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'DB error' }));
    }
    return;
  }

  const pathname = new URL(req.url, 'http://localhost').pathname;
  let filePath = path.join(__dirname, 'public',
    pathname === '/' ? 'index.html' : pathname);

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Snake game running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error(err.message);
  process.exit(1);
});
