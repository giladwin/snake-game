# Snake Game

A classic Snake game with a realistic illustrated snake, persistent top-10 leaderboard, and mobile support — served via Node.js and containerized with Docker.

## Features

- Realistic snake with head, eyes, tongue, and scales (Canvas API)
- Persistent top-10 leaderboard backed by MongoDB
- Two food types: red apple and disappearing gold star
- Levels 1–10 with increasing speed
- Mobile-friendly on-screen D-pad
- Fully containerized with Docker Compose

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

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scores` | Returns top 10 scores (sorted by score desc) |
| POST | `/api/scores` | Submit a score `{ name, score, level }` |

## Stack

- **Frontend** — vanilla JS + Canvas API
- **Backend** — Node.js HTTP server (no framework)
- **Database** — MongoDB (via Docker Compose)
- **Container** — Docker + Docker Compose
