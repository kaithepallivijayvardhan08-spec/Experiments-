'use strict';

const {
  ARENA,
  PLAYER,
  DUCK,
  EXIT,
  MATCH,
  POWER_ORDER
} = require('../config/constants');
const { loadMap } = require('./maps');
const playerManager = require('./playerManager');
const powerManager = require('./powerManager');

let powerUpSeq = 0;

class GameRoom {
  constructor(roomId, options) {
    const opts = options || {};
    this.roomId = roomId;
    this.hostId = opts.hostId || null;
    this.map = loadMap(opts.mapId);
    this.players = new Map();
    this.state = 'lobby'; // lobby | countdown | playing | finished
    this.createdAt = Date.now();
    this.countdownEndsAt = 0;
    this.matchEndsAt = 0;
    this.winner = null;
    this.announcement = null;
    this.effects = [];
    this.powerUps = [];
    this.nextPowerSpawnAt = 0;
    this.duck = {
      x: this.map.duck.x,
      y: this.map.duck.y,
      carriedBy: null,
      freeSince: Date.now()
    };
    this.lastTickAt = Date.now();
    this.loop = null;
  }

  /* ------------------------------------------------------------------ */
  /* players                                                             */
  /* ------------------------------------------------------------------ */

  addPlayer({ playerId, name, socketId, isBot }) {
    const existing = this.players.get(playerId);
    if (existing) {
      existing.connected = true;
      if (socketId) {
        existing.socketId = socketId;
      }
      if (name) {
        existing.name = name;
      }
      return existing;
    }
    if (this.players.size >= MATCH.maxPlayers) {
      return null;
    }
    const index = this.nextFreeIndex();
    const player = playerManager.createPlayer({
      playerId,
      name,
      socketId,
      index,
      isBot
    });
    const spawn = this.map.spawns[index % this.map.spawns.length];
    player.x = spawn.x;
    player.y = spawn.y;
    this.players.set(playerId, player);
    if (!this.hostId && !isBot) {
      this.hostId = playerId;
    }
    return player;
  }

  nextFreeIndex() {
    const used = new Set();
    this.players.forEach(function (player) {
      used.add(player.index);
    });
    for (let i = 0; i < MATCH.maxPlayers; i += 1) {
      if (!used.has(i)) {
        return i;
      }
    }
    return this.players.size;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }
    if (player.hasDuck) {
      this.dropDuck(player, 'DISCONNECT');
    }
    this.players.delete(playerId);
    if (this.hostId === playerId) {
      const next = Array.from(this.players.values()).find(function (p) {
        return !p.isBot;
      });
      this.hostId = next ? next.playerId : null;
    }
  }

  humanPlayers() {
    return Array.from(this.players.values()).filter(function (p) {
      return !p.isBot;
    });
  }

  fillWithBots(total) {
    const wanted = Math.min(total || MATCH.maxPlayers, MATCH.maxPlayers);
    let guard = 0;
    while (this.players.size < wanted && guard < MATCH.maxPlayers) {
      guard += 1;
      const index = this.nextFreeIndex();
      this.addPlayer({
        playerId: 'bot-' + this.roomId + '-' + index,
        name: 'BOT ' + (index + 1),
        isBot: true
      });
    }
  }

  removeBots() {
    const ids = [];
    this.players.forEach(function (player, id) {
      if (player.isBot) {
        ids.push(id);
      }
    });
    ids.forEach(this.removePlayer.bind(this));
  }

  everyoneReady() {
    const humans = this.humanPlayers();
    if (!humans.length) {
      return false;
    }
    return humans.every(function (player) {
      return player.ready;
    });
  }

  /* ------------------------------------------------------------------ */
  /* match lifecycle                                                     */
  /* ------------------------------------------------------------------ */

  startCountdown() {
    if (this.state === 'countdown' || this.state === 'playing') {
      return;
    }
    this.state = 'countdown';
    this.countdownEndsAt = Date.now() + MATCH.countdownMs;
  }

  startMatch() {
    const self = this;
    this.state = 'playing';
    this.winner = null;
    this.effects = [];
    this.powerUps = [];
    powerUpSeq = 0;
    const now = Date.now();
    this.matchEndsAt = now + MATCH.durationMs;
    this.nextPowerSpawnAt = now + 1500;
    let i = 0;
    this.players.forEach(function (player) {
      const spawn = self.map.spawns[i % self.map.spawns.length];
      playerManager.resetForMatch(player, spawn);
      i += 1;
    });
    this.duck = {
      x: this.map.duck.x,
      y: this.map.duck.y,
      carriedBy: null,
      freeSince: now
    };
    this.announce('STEAL THE GOLDEN DUCK!');
  }

  endMatch(winner) {
    this.state = 'finished';
    this.winner = winner
      ? {
          playerId: winner.playerId,
          name: winner.name,
          slot: winner.slot,
          color: winner.color,
          xp: 100,
          coins: 50,
          stats: winner.stats
        }
      : null;
    this.announce(winner ? winner.name + ' WINS THE GOLDEN DUCK!' : "TIME'S UP! NOBODY WINS");
  }

  resetToLobby() {
    this.state = 'lobby';
    this.winner = null;
    this.effects = [];
    this.powerUps = [];
    this.players.forEach(function (player) {
      player.ready = player.isBot;
    });
  }

  announce(text) {
    this.announcement = { text: text, ts: Date.now() };
  }

  /* ------------------------------------------------------------------ */
  /* duck                                                                */
  /* ------------------------------------------------------------------ */

  pickUpDuck(player) {
    if (this.duck.carriedBy || player.hasDuck) {
      return false;
    }
    if (Math.hypot(player.x - this.duck.x, player.y - this.duck.y) > DUCK.pickupRange) {
      return false;
    }
    this.duck.carriedBy = player.playerId;
    player.hasDuck = true;
    player.stats.ducksCaptured += 1;
    this.announce(player.name.toUpperCase() + ' HAS THE GOLDEN DUCK!');
    this.pushEffect({ type: 'DUCK_TAKEN', fromId: player.playerId, startedAt: Date.now(), durationMs: 1600 });
    return true;
  }

  dropDuck(player, reason) {
    if (!player.hasDuck) {
      return;
    }
    player.hasDuck = false;
    player.stats.ducksDropped += 1;
    this.duck.carriedBy = null;
    this.duck.x = player.x;
    this.duck.y = player.y + 26;
    this.duck.freeSince = Date.now();
    this.announce('DUCK DROPPED!');
    this.pushEffect({
      type: 'DUCK_DROPPED',
      fromId: player.playerId,
      reason: reason || 'HIT',
      startedAt: Date.now(),
      durationMs: 1400
    });
  }

  /* ------------------------------------------------------------------ */
  /* power ups                                                           */
  /* ------------------------------------------------------------------ */

  spawnPowerUp(now) {
    if (this.powerUps.length >= MATCH.maxPowerUpsOnMap) {
      return;
    }
    const spots = this.map.powerSpots.filter((spot) => {
      return !this.powerUps.some(function (p) {
        return Math.hypot(p.x - spot.x, p.y - spot.y) < 40;
      });
    });
    if (!spots.length) {
      return;
    }
    const spot = spots[Math.floor(Math.random() * spots.length)];
    powerUpSeq += 1;
    this.powerUps.push({
      id: 'pu' + powerUpSeq,
      type: POWER_ORDER[Math.floor(Math.random() * POWER_ORDER.length)],
      x: spot.x,
      y: spot.y,
      spawnedAt: now
    });
  }

  collectPowerUps(player) {
    for (let i = this.powerUps.length - 1; i >= 0; i -= 1) {
      const powerUp = this.powerUps[i];
      if (Math.hypot(player.x - powerUp.x, player.y - powerUp.y) < PLAYER.radius + 20) {
        if (player.inventory.length < 3) {
          player.inventory.push(powerUp.type);
          this.powerUps.splice(i, 1);
          this.pushEffect({
            type: 'POWER_PICKED',
            fromId: player.playerId,
            power: powerUp.type,
            startedAt: Date.now(),
            durationMs: 900
          });
        }
      }
    }
  }

  usePower(player, powerId, targetId) {
    const now = Date.now();
    const event = powerManager.activate(this, player, powerId, targetId, now);
    if (event) {
      this.pushEffect(event);
      this.announce(
        player.name.toUpperCase() +
          ' USED: ' +
          event.label +
          (event.key ? ' (' + event.key + ')' : '') +
          '!'
      );
    }
    return event;
  }

  pushEffect(effect) {
    this.effects.push(effect);
    if (this.effects.length > 24) {
      this.effects.shift();
    }
  }

  /* ------------------------------------------------------------------ */
  /* simulation                                                          */
  /* ------------------------------------------------------------------ */

  tick() {
    const now = Date.now();
    const dt = Math.min((now - this.lastTickAt) / 1000, 0.1);
    this.lastTickAt = now;

    if (this.state === 'countdown') {
      if (now >= this.countdownEndsAt) {
        this.startMatch();
      }
      return;
    }
    if (this.state !== 'playing') {
      return;
    }

    powerManager.tickEffects(this, now);

    if (now >= this.nextPowerSpawnAt) {
      this.spawnPowerUp(now);
      this.nextPowerSpawnAt = now + MATCH.powerSpawnMs;
    }

    const self = this;
    this.players.forEach(function (player) {
      if (player.isBot) {
        self.stepBot(player, now);
      }
      self.movePlayer(player, dt, now);
      self.collectPowerUps(player);
      if (player.input.SPACE) {
        self.pickUpDuck(player);
      }
    });

    if (this.duck.carriedBy) {
      const carrier = this.players.get(this.duck.carriedBy);
      if (carrier) {
        this.duck.x = carrier.x;
        this.duck.y = carrier.y - 42;
        if (this.isInsideExit(carrier)) {
          carrier.score += 100;
          carrier.xp += 100;
          this.endMatch(carrier);
          return;
        }
      } else {
        this.duck.carriedBy = null;
      }
    }

    this.effects = this.effects.filter(function (effect) {
      return effect.startedAt + (effect.durationMs || 1000) > now - 500;
    });

    if (now >= this.matchEndsAt) {
      this.endMatch(null);
    }
  }

  isInsideExit(player) {
    return (
      player.x > EXIT.x - EXIT.width / 2 &&
      player.x < EXIT.x + EXIT.width / 2 &&
      player.y > EXIT.y - EXIT.height / 2 &&
      player.y < EXIT.y + EXIT.height / 2
    );
  }

  movePlayer(player, dt, now) {
    const dancing = player.effects.danceUntil > now;
    player.dancing = dancing;
    if (dancing) {
      player.moving = false;
      return;
    }

    const source = playerManager.controlSourceOf(player, this.players, now);
    const input = source.input;
    let dx = 0;
    let dy = 0;
    let pressedBlocked = false;

    ['W', 'A', 'S', 'D'].forEach(function (key) {
      if (!input[key]) {
        return;
      }
      if (!playerManager.isKeyUsable(player, key)) {
        pressedBlocked = true;
        return;
      }
      const direction = player.keyMap[key];
      if (direction === 'up') {
        dy -= 1;
      } else if (direction === 'down') {
        dy += 1;
      } else if (direction === 'left') {
        dx -= 1;
      } else if (direction === 'right') {
        dx += 1;
      }
    });

    player.runningInPlace = pressedBlocked && dx === 0 && dy === 0;
    player.moving = dx !== 0 || dy !== 0;
    if (!player.moving) {
      return;
    }

    const length = Math.hypot(dx, dy) || 1;
    let speed = PLAYER.speed;
    if (player.effects.boostUntil > now) {
      speed *= PLAYER.boostMultiplier;
    }
    if (player.hasDuck) {
      speed *= 0.92;
    }

    const nextX = player.x + (dx / length) * speed * dt;
    const nextY = player.y + (dy / length) * speed * dt;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.facing = dx > 0 ? 'right' : 'left';
    } else if (dy !== 0) {
      player.facing = dy > 0 ? 'down' : 'up';
    }

    if (!this.collides(nextX, player.y)) {
      player.x = nextX;
    } else {
      player.stats.wallHits += 1;
    }
    if (!this.collides(player.x, nextY)) {
      player.y = nextY;
    } else {
      player.stats.wallHits += 1;
    }

    player.x = Math.max(ARENA.wall + PLAYER.radius, Math.min(ARENA.width - ARENA.wall - PLAYER.radius, player.x));
    player.y = Math.max(ARENA.wall + PLAYER.radius, Math.min(ARENA.height - ARENA.wall - PLAYER.radius, player.y));
  }

  collides(x, y) {
    const r = PLAYER.radius;
    return this.map.obstacles.some(function (obstacle) {
      return (
        x + r > obstacle.x - obstacle.w / 2 &&
        x - r < obstacle.x + obstacle.w / 2 &&
        y + r > obstacle.y - obstacle.h / 2 &&
        y - r < obstacle.y + obstacle.h / 2
      );
    });
  }

  /* ------------------------------------------------------------------ */
  /* very small bot AI so a single human can still play                  */
  /* ------------------------------------------------------------------ */

  stepBot(bot, now) {
    const target = this.botTarget(bot);
    const dx = target.x - bot.x;
    const dy = target.y - bot.y;
    const input = { W: false, A: false, S: false, D: false, SPACE: false };
    const deadZone = 12;

    Object.keys(bot.keyMap).forEach(function (key) {
      const direction = bot.keyMap[key];
      if (direction === 'up' && dy < -deadZone) {
        input[key] = true;
      }
      if (direction === 'down' && dy > deadZone) {
        input[key] = true;
      }
      if (direction === 'left' && dx < -deadZone) {
        input[key] = true;
      }
      if (direction === 'right' && dx > deadZone) {
        input[key] = true;
      }
    });

    input.SPACE = Math.hypot(dx, dy) < DUCK.pickupRange && !this.duck.carriedBy;
    bot.input = input;

    if (!bot.nextPowerAt) {
      bot.nextPowerAt = now + 4000 + Math.random() * 6000;
    }
    if (bot.inventory.length && now >= bot.nextPowerAt) {
      this.usePower(bot, bot.inventory[0], null);
      bot.nextPowerAt = now + 6000 + Math.random() * 8000;
    }
  }

  botTarget(bot) {
    if (bot.hasDuck) {
      return { x: EXIT.x, y: EXIT.y };
    }
    const nearestPowerUp = this.powerUps
      .slice()
      .sort(function (a, b) {
        return Math.hypot(a.x - bot.x, a.y - bot.y) - Math.hypot(b.x - bot.x, b.y - bot.y);
      })[0];
    if (nearestPowerUp && bot.inventory.length < 2 && Math.hypot(nearestPowerUp.x - bot.x, nearestPowerUp.y - bot.y) < 320) {
      return nearestPowerUp;
    }
    if (this.duck.carriedBy) {
      const carrier = this.players.get(this.duck.carriedBy);
      if (carrier) {
        return carrier;
      }
    }
    return this.duck;
  }

  /* ------------------------------------------------------------------ */
  /* serialization                                                       */
  /* ------------------------------------------------------------------ */

  serialize() {
    const now = Date.now();
    const players = [];
    this.players.forEach(function (player) {
      players.push({
        playerId: player.playerId,
        name: player.name,
        slot: player.slot,
        color: player.color,
        ring: player.ring,
        index: player.index,
        isBot: player.isBot,
        connected: player.connected,
        ready: player.ready,
        hasController: Boolean(player.controllerSocketId),
        x: Math.round(player.x),
        y: Math.round(player.y),
        facing: player.facing,
        moving: player.moving,
        dancing: player.effects.danceUntil > now,
        runningInPlace: Boolean(player.runningInPlace),
        hasDuck: player.hasDuck,
        inventory: player.inventory.slice(),
        keyMap: player.keyMap,
        keyState: player.keyState,
        effects: {
          danceMsLeft: Math.max(0, player.effects.danceUntil - now),
          boostMsLeft: Math.max(0, player.effects.boostUntil - now),
          mindControlledBy: player.effects.mindControlUntil > now ? player.effects.mindControlledBy : null,
          mindControlMsLeft: Math.max(0, player.effects.mindControlUntil - now),
          swapWith: player.effects.swapUntil > now ? player.effects.swapWith : null,
          swapMsLeft: Math.max(0, player.effects.swapUntil - now)
        },
        stats: player.stats,
        score: player.score
      });
    });
    players.sort(function (a, b) {
      return a.index - b.index;
    });

    return {
      roomId: this.roomId,
      state: this.state,
      hostId: this.hostId,
      map: this.map,
      arena: ARENA,
      exit: EXIT,
      players: players,
      duck: this.duck,
      powerUps: this.powerUps,
      effects: this.effects,
      announcement: this.announcement,
      winner: this.winner,
      countdownMsLeft: Math.max(0, this.countdownEndsAt - now),
      timeLeftMs: this.state === 'playing' ? Math.max(0, this.matchEndsAt - now) : MATCH.durationMs,
      serverTime: now
    };
  }
}

module.exports = GameRoom;
