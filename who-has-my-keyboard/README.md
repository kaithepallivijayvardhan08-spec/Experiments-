# WHO HAS MY KEYBOARD?

A chaotic real-time multiplayer browser game. Four players fight over the **Golden Duck 🐤**
while stealing, locking and swapping each other's controls. Carry the duck to the exit to win.

```
FIND THE DUCK  →  GRAB IT (SPACE)  →  SURVIVE THE CHAOS  →  REACH THE EXIT  →  WIN
```

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | AngularJS 1.8 + ngRoute, HTML Canvas (procedural cartoon art, no image assets) |
| Real-time | Socket.IO 4 |
| Backend | Node.js + Express, authoritative 30 FPS simulation, ~20 Hz state broadcast |
| Storage | In-memory store (drop-in shaped like a Mongo collection layer) |

## Run it

```bash
npm install
npm start          # http://localhost:3000
npm run lint
npm run smoke      # headless socket smoke test against a running server
```

Open `http://localhost:3000`, pick a name, **Quick Match** or **Create Room**, then
**FILL WITH BOTS & START** if you are playing alone.

## Controls

| Input | Action |
| --- | --- |
| `W A S D` / arrows | move |
| `SPACE` / `E` | pick up or drop the Golden Duck |
| `1` `2` `3` | use the power in that inventory slot |
| `TAB` | hold for the scoreboard |

## Powers

| Power | Effect |
| --- | --- |
| 🖐️ STEAL KEY | a giant hand rips one movement key off the target's keyboard (10s) |
| 🔄 SWAP KEYS | the two keyboards fly across the arena and swap owners (10s) |
| 🧠 MIND CONTROL | your input drives the target's character (5s) |
| 🕺 DANCE CURSE | the target dances instead of moving and drops the duck (4s) |
| 🔒 LOCK KEY | a lock drops onto one of the target's keys (9s) |
| ⚡ SPEED BOOST | 1.9× movement speed with a trail (5s) |

Every effect is rendered on the canvas: hands, wires, beams, notes, locks, trails and
duck bursts, plus the floating WASD keyboard above each character showing which keys
are stolen or locked.

## Phone controller

One socket has exactly one role — **player** or **controller**, never both.

```
ROOM  →  PLAYER  ├── socketId            (PC game, emits player:join)
                 └── controllerSocketId  (phone,   emits controller:join)
```

From the room screen, copy the controller link
(`/#/controller?room=<CODE>&player=<PLAYER_ID>`) and open it on a phone. The phone
sends `player:move` / `player:power` for the same player the PC is rendering, and it
shows live stolen/locked key state.

## Layout

```
server/
  server.js                Express + static client + /api + /health
  socket/socketServer.js   Socket.IO wiring and the authoritative tick loop
  socket/handlers/         connection, room, controller, movement, power, game
  game/                    gameRoom, gameManager, playerManager, powerManager, maps
  store/memoryStore.js     users, matches, leaderboard
client/
  js/services/             socketService, gameService, authService, apiService
  js/game/                 gameEngine, gameState, inputManager, hud, sprites, animations
  js/game/entities/        player, duck, powerUp
  js/controllers/          one per route
  views/ css/              AngularJS templates and cartoon styling
```

## HTTP API

`POST /api/auth/register` · `POST /api/auth/login` · `GET /api/users/:username` ·
`GET /api/leaderboard` · `GET /api/matches` · `POST /api/matches` · `GET /api/rooms` · `GET /health`

> The in-memory auth is a prototype for local play only — passwords are not hashed and
> nothing is persisted. Replace `server/store/memoryStore.js` with MongoDB before any
> real deployment.
