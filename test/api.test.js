const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const { createRequestHandler } = require('../server');

process.env.ADMIN_TOKEN = 'test-secret';

const VALID_ID = '507f1f77bcf86cd799439011';

const mockScores = [
  { _id: VALID_ID, name: 'Alice', score: 100, level: 2 },
  { _id: '507f1f77bcf86cd799439012', name: 'Bob', score: 50, level: 1, status: 'hidden' },
];

const mockDb = {
  collection: () => ({
    find: () => ({
      sort: () => ({
        limit: () => ({
          toArray: async () => mockScores.filter(s => s.status !== 'hidden'),
        }),
      }),
    }),
    insertOne: async () => ({ insertedId: 'new-id' }),
    updateOne: async () => ({ modifiedCount: 1 }),
  }),
};

function request(server, { method = 'GET', path = '/', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: 'localhost', port: server.address().port, method, path, headers },
      res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

describe('API', () => {
  let server;

  before(() => new Promise(resolve => {
    server = http.createServer(createRequestHandler(mockDb));
    server.listen(0, resolve);
  }));

  after(() => new Promise(resolve => server.close(resolve)));

  describe('GET /api/scores', () => {
    test('returns 200 with visible scores only', async () => {
      const { status, body } = await request(server, { path: '/api/scores' });
      assert.equal(status, 200);
      const scores = JSON.parse(body);
      assert.equal(scores.length, 1);
      assert.equal(scores[0].name, 'Alice');
    });
  });

  describe('POST /api/scores', () => {
    test('returns 201 for valid payload', async () => {
      const payload = JSON.stringify({ name: 'Test', score: 80, level: 1 });
      const { status, body } = await request(server, {
        method: 'POST', path: '/api/scores',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      assert.equal(status, 201);
      assert.deepEqual(JSON.parse(body), { ok: true });
    });

    test('returns 400 for missing name', async () => {
      const payload = JSON.stringify({ score: 80, level: 1 });
      const { status } = await request(server, {
        method: 'POST', path: '/api/scores',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      assert.equal(status, 400);
    });

    test('returns 400 for non-numeric score', async () => {
      const payload = JSON.stringify({ name: 'Test', score: 'high', level: 1 });
      const { status } = await request(server, {
        method: 'POST', path: '/api/scores',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });
      assert.equal(status, 400);
    });
  });

  describe('GET /api/admin', () => {
    test('returns 200 with valid token', async () => {
      const { status } = await request(server, {
        path: '/api/admin',
        headers: { Authorization: 'Bearer test-secret' },
      });
      assert.equal(status, 200);
    });

    test('returns 401 with wrong token', async () => {
      const { status } = await request(server, {
        path: '/api/admin',
        headers: { Authorization: 'Bearer wrong' },
      });
      assert.equal(status, 401);
    });

    test('returns 401 with no token', async () => {
      const { status } = await request(server, { path: '/api/admin' });
      assert.equal(status, 401);
    });
  });

  describe('DELETE /api/scores/:id', () => {
    test('returns 200 with valid token', async () => {
      const { status, body } = await request(server, {
        method: 'DELETE', path: `/api/scores/${VALID_ID}`,
        headers: { Authorization: 'Bearer test-secret' },
      });
      assert.equal(status, 200);
      assert.deepEqual(JSON.parse(body), { ok: true });
    });

    test('returns 401 with wrong token', async () => {
      const { status } = await request(server, {
        method: 'DELETE', path: `/api/scores/${VALID_ID}`,
        headers: { Authorization: 'Bearer wrong' },
      });
      assert.equal(status, 401);
    });
  });

  describe('Static files', () => {
    test('GET / returns index.html', async () => {
      const { status, body } = await request(server, { path: '/' });
      assert.equal(status, 200);
      assert.ok(body.includes('<title>Snake</title>'));
    });

    test('GET /?admin=token returns index.html, not 404', async () => {
      const { status, body } = await request(server, { path: '/?admin=test-secret' });
      assert.equal(status, 200);
      assert.ok(body.includes('<title>Snake</title>'));
    });

    test('GET /nonexistent returns 404', async () => {
      const { status } = await request(server, { path: '/nonexistent.js' });
      assert.equal(status, 404);
    });
  });
});
