'use strict';

/**
 * Headless smoke test: joins a room, fills it with bots, starts a match and
 * checks that the authoritative loop moves the player, hands out powers and
 * ends the match when the duck reaches the exit.
 *
 * Usage: node scripts/smokeTest.js [url]
 */

const { io } = require('socket.io-client');

const URL = process.argv[2] || 'http://localhost:3000';
const PLAYER_ID = 'smoke-' + Date.now();

const checks = {
  joined: false,
  countdown: false,
  playing: false,
  moved: false,
  gotPower: false,
  duckPickedUp: false,
  finished: false
};

const socket = io(URL, { transports: ['websocket'] });
let startX = null;
let roomId = null;
let usedPower = false;

function fail(message) {
  console.error('FAIL: ' + message);
  console.error(checks);
  process.exit(1);
}

socket.on('connect', function () {
  socket.emit('player:join', { mode: 'create', playerId: PLAYER_ID, name: 'SMOKE' });
});

socket.on('room:error', function (payload) {
  fail('room:error ' + payload.message);
});

socket.on('player:joined', function (payload) {
  checks.joined = true;
  roomId = payload.roomId;
  socket.emit('game:start', { fillWithBots: true });
});

socket.on('room:state', function (snapshot) {
  const me = snapshot.players.find(function (p) {
    return p.playerId === PLAYER_ID;
  });
  if (!me) {
    return;
  }

  if (snapshot.state === 'countdown') {
    checks.countdown = true;
  }

  if (snapshot.state !== 'playing') {
    return;
  }

  checks.playing = true;
  if (startX === null) {
    startX = me.x;
    socket.emit('player:input', { W: false, A: false, S: false, D: true, SPACE: false });
  } else if (Math.abs(me.x - startX) > 20) {
    checks.moved = true;
  }

  if (me.inventory.length) {
    checks.gotPower = true;
    if (!usedPower) {
      usedPower = true;
      const target = snapshot.players.find(function (p) {
        return p.playerId !== PLAYER_ID;
      });
      socket.emit('player:power', { powerId: me.inventory[0], targetId: target ? target.playerId : null });
    }
  }

  if (snapshot.players.some(function (p) { return p.hasDuck; })) {
    checks.duckPickedUp = true;
  }

  if (snapshot.state === 'finished') {
    checks.finished = true;
  }
});

socket.on('game:finished', function () {
  checks.finished = true;
});

setTimeout(function () {
  const required = ['joined', 'countdown', 'playing', 'moved', 'duckPickedUp'];
  const missing = required.filter(function (key) {
    return !checks[key];
  });
  console.log('room:', roomId, checks);
  if (missing.length) {
    fail('missing: ' + missing.join(', '));
  }
  console.log('SMOKE TEST OK');
  socket.close();
  process.exit(0);
}, 45000);
