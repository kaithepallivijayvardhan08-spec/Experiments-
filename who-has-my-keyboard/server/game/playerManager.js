'use strict';

const { PLAYER_COLORS } = require('../config/constants');

const MOVEMENT_KEYS = ['W', 'A', 'S', 'D'];

function defaultKeyMap() {
  return { W: 'up', A: 'left', S: 'down', D: 'right' };
}

function defaultKeyState() {
  return {
    W: { status: 'ok', untilTs: 0, byPlayerId: null },
    A: { status: 'ok', untilTs: 0, byPlayerId: null },
    S: { status: 'ok', untilTs: 0, byPlayerId: null },
    D: { status: 'ok', untilTs: 0, byPlayerId: null }
  };
}

function createPlayer({ playerId, name, socketId, index, isBot }) {
  const color = PLAYER_COLORS[index % PLAYER_COLORS.length];
  return {
    playerId,
    name: name || 'PLAYER ' + (index + 1),
    index,
    slot: index + 1,
    color: color.id,
    ring: color.ring,
    socketId: socketId || null,
    controllerSocketId: null,
    connected: true,
    isBot: Boolean(isBot),
    ready: Boolean(isBot),
    x: 0,
    y: 0,
    facing: 'down',
    moving: false,
    hasDuck: false,
    inventory: [],
    keyMap: defaultKeyMap(),
    keyState: defaultKeyState(),
    input: { W: false, A: false, S: false, D: false, SPACE: false },
    effects: {
      danceUntil: 0,
      boostUntil: 0,
      mindControlledBy: null,
      mindControlUntil: 0,
      swapWith: null,
      swapUntil: 0
    },
    stats: {
      ducksCaptured: 0,
      keysStolen: 0,
      timesMindControlled: 0,
      danceCursesUsed: 0,
      wallHits: 0,
      ducksDropped: 0
    },
    score: 0,
    xp: 0
  };
}

function resetForMatch(player, spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
  player.facing = 'down';
  player.hasDuck = false;
  player.inventory = [];
  player.keyMap = defaultKeyMap();
  player.keyState = defaultKeyState();
  player.input = { W: false, A: false, S: false, D: false, SPACE: false };
  player.effects = {
    danceUntil: 0,
    boostUntil: 0,
    mindControlledBy: null,
    mindControlUntil: 0,
    swapWith: null,
    swapUntil: 0
  };
  player.score = 0;
}

function isKeyUsable(player, key) {
  const state = player.keyState[key];
  return !state || state.status === 'ok';
}

function availableKeys(player) {
  return MOVEMENT_KEYS.filter(function (key) {
    return isKeyUsable(player, key);
  });
}

/**
 * Returns the player whose raw input currently drives `player`'s character.
 * Mind control beats keyboard swap.
 */
function controlSourceOf(player, players, now) {
  const effects = player.effects;
  if (effects.mindControlledBy && effects.mindControlUntil > now) {
    const attacker = players.get(effects.mindControlledBy);
    if (attacker) {
      return attacker;
    }
  }
  if (effects.swapWith && effects.swapUntil > now) {
    const partner = players.get(effects.swapWith);
    if (partner) {
      return partner;
    }
  }
  return player;
}

module.exports = {
  MOVEMENT_KEYS,
  createPlayer,
  resetForMatch,
  isKeyUsable,
  availableKeys,
  controlSourceOf,
  defaultKeyMap,
  defaultKeyState
};
