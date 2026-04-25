# Snake Game — CLAUDE.md

This file provides AI assistants with the context needed to work effectively in this codebase.

## Repository Overview

A classic Snake game with a persistent top-10 leaderboard, served by a plain Node.js HTTP server and backed by MongoDB. Containerized with Docker Compose.

## Tech Stack

- **Frontend** — single `public/index.html` (vanilla JS + Canvas API, all CSS/JS inline)
- **Backend** — Node.js `http` module (no framework)
- **Database** — MongoDB via the `mongodb` npm driver
- **Container** — Docker (`node:20-alpine`) + Docker Compose (game + `mongo:7`)
- **Tests** — Node.js built-in `node:test` + `assert` (no extra test dependencies)
- **CI** — GitHub Actions (`.github/workflows/test.yml`)

## Directory Structure

```
├── .dockerignore
├── .github/
│   └── workflows/
│       └── test.yml        # CI: runs on PR and push to main
├── Dockerfile              # node:20-alpine, omits devDeps
├── README.md
├── docker-compose.yml      # game service + mongo:7 with healthcheck
├── package.json            # scripts: start, test
├── package-lock.json
├── public/
│   └── index.html          # entire frontend (game logic, styles, leaderboard UI)
├── server.js               # HTTP server + API handlers + static file serving
└── test/
    └── api.test.js         # unit tests using a mock DB
```

## Development Workflow

### Without Docker

```bash
npm install
MONGO_URI=mongodb://localhost:27017/snakegame node server.js
# Open http://localhost:3000
```

### With Docker Compose (recommended)

```bash
docker-compose up --build
# Open http://localhost:3000
```

### Running Tests

```bash
npm test
# No live MongoDB required — tests inject a mock DB
```

Tests use `node --test` (Node.js 20 built-in runner). Do not add external test frameworks.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP listen port |
| `MONGO_URI` | `mongodb://localhost:27017/snakegame` | MongoDB connection string |
| `ADMIN_TOKEN` | — | Secret token for admin API routes |

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/scores` | No | Top 10 visible scores, sorted by score descending |
| `POST` | `/api/scores` | No | Submit score `{ name, score, level }` |
| `GET` | `/api/admin` | Bearer token | Verify admin access |
| `DELETE` | `/api/scores/:id` | Bearer token | Soft-delete a score (sets `status: 'hidden'`) |

Admin routes require `Authorization: Bearer <ADMIN_TOKEN>`. The frontend unlocks admin mode by passing `?admin=<token>` in the URL query string.

## Key Code Conventions

### server.js — testability pattern

`server.js` exports `createRequestHandler(db)` as a named export so tests can inject a mock DB. The actual `http.createServer` + `listen` only runs when `require.main === module`:

```js
module.exports = { createRequestHandler };

if (require.main === module) {
  connectDB().then(db => { ... });
}
```

Always preserve this pattern when modifying `server.js`.

### Score storage rules

- `name` is truncated to 20 characters on write.
- Scores are **never hard-deleted**; deletion sets `status: 'hidden'`.
- `GET /api/scores` filters `{ status: { $ne: 'hidden' } }`.

### Static file serving

MIME types are managed by the `mimeTypes` map in `server.js`. Add new extensions there if needed. Files are served from the `public/` directory.

### Frontend (public/index.html)

- All game logic, CSS, and HTML live in one file — keep it that way.
- Game grid: 20×20 cells at 20px each (400×400 canvas).
- Levels 1–10; speed formula: `Math.max(80, 200 - level * 15)` ms/frame.
- Level-up triggers every 100 points (max level 10).
- Food types: red apple (+10 × level), gold star (+50 × level, disappears after 80 frames).
- Leaderboard polls `/api/scores` every 10 seconds and retries up to 5 times on load.

## Testing Conventions

- Tests live in `test/api.test.js`.
- Use `node:test` and `node:assert/strict` only — no Jest, Mocha, or other frameworks.
- Inject a `mockDb` object to `createRequestHandler` to avoid needing a real database.
- Set `process.env.ADMIN_TOKEN` at the top of test files for admin route tests.
- Use `server.listen(0, ...)` to get a random port; read it back with `server.address().port`.

## CI

The GitHub Actions workflow (`.github/workflows/test.yml`) runs on every pull request and on pushes to `main`. It uses Node.js 20 and runs `npm install` then `npm test`. No MongoDB service is needed because tests use a mock DB.
