# Snake Game

A classic Snake game with a realistic illustrated snake, MongoDB leaderboard, served via Node.js and containerized with Docker.

## Run with Docker Compose (recommended)

```bash
docker-compose up --build
```

Then open http://localhost:3000 in your browser.

Scores are persisted in a named Docker volume — they survive container restarts.

## Run without Docker

Requires [Node.js](https://nodejs.org) and a local MongoDB instance.

```bash
npm install
MONGO_URI=mongodb://localhost:27017/snakegame node server.js
```

## Controls

| Key | Action |
|-----|--------|
| Arrow keys / WASD | Move |
| Space / P | Pause |
| On-screen D-pad | Mobile / touch |

## Scoring

| Item | Points |
|------|--------|
| Red apple | +10 × level |
| Gold star (disappears!) | +50 × level |
| Every 100 pts | Level up (max 10) |

## Stack

- **Frontend** — vanilla JS + Canvas API
- **Backend** — Node.js HTTP server (no framework)
- **Database** — MongoDB (via Docker Compose)
- **Container** — Docker + Docker Compose
