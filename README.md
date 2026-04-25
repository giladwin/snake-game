# Snake Game

A classic Snake game with a realistic illustrated snake, served via a Node.js HTTP server and containerized with Docker.

## Run with Docker

```bash
# Build the image
docker build -t snake-game .

# Run the container
docker run -p 3000:3000 snake-game
```

Then open http://localhost:3000 in your browser.

## Run without Docker

```bash
node server.js
```

Requires [Node.js](https://nodejs.org) installed.

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
