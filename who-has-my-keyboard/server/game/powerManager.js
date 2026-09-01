'use strict';

const { POWERS } = require('../config/constants');
const { MOVEMENT_KEYS, availableKeys } = require('./playerManager');

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pickTarget(room, attacker, requestedId) {
  const candidates = [];
  room.players.forEach(function (player) {
    if (player.playerId !== attacker.playerId) {
      candidates.push(player);
    }
  });
  if (!candidates.length) {
    return null;
  }
  if (requestedId) {
    const requested = candidates.find(function (p) {
      return p.playerId === requestedId;
    });
    if (requested) {
      return requested;
    }
  }
  // Prefer the duck carrier, otherwise the closest player.
  const carrier = candidates.find(function (p) {
    return p.hasDuck;
  });
  if (carrier) {
    return carrier;
  }
  candidates.sort(function (a, b) {
    return distance(attacker, a) - distance(attacker, b);
  });
  return candidates[0];
}

function pickStealableKey(target) {
  const keys = availableKeys(target);
  if (!keys.length) {
    return null;
  }
  // W is the funniest key to lose, so it goes first when it is still there.
  if (keys.indexOf('W') !== -1) {
    return 'W';
  }
  return keys[Math.floor(Math.random() * keys.length)];
}

/**
 * Activates `powerId` from `attacker`. Returns a describable effect event or
 * null when the power could not be used (no target, out of range, ...).
 */
function activate(room, attacker, powerId, requestedTargetId, now) {
  const power = POWERS[powerId];
  if (!power) {
    return null;
  }
  const index = attacker.inventory.indexOf(powerId);
  if (index === -1) {
    return null;
  }

  let target = null;
  if (power.needsTarget) {
    target = pickTarget(room, attacker, requestedTargetId);
    if (!target) {
      return null;
    }
    if (power.range && distance(attacker, target) > power.range) {
      return null;
    }
  }

  const expiresAt = now + power.durationMs;
  let event = null;

  switch (powerId) {
    case 'STEAL_KEY': {
      const key = pickStealableKey(target);
      if (!key) {
        return null;
      }
      target.keyState[key] = {
        status: 'stolen',
        untilTs: expiresAt,
        byPlayerId: attacker.playerId
      };
      attacker.stats.keysStolen += 1;
      event = { key: key };
      break;
    }
    case 'LOCK_KEY': {
      const keys = availableKeys(target);
      if (!keys.length) {
        return null;
      }
      const key = keys.indexOf('W') !== -1 ? 'W' : keys[0];
      target.keyState[key] = {
        status: 'locked',
        untilTs: expiresAt,
        byPlayerId: attacker.playerId
      };
      event = { key: key };
      break;
    }
    case 'SWAP_KEYS': {
      attacker.effects.swapWith = target.playerId;
      attacker.effects.swapUntil = expiresAt;
      target.effects.swapWith = attacker.playerId;
      target.effects.swapUntil = expiresAt;
      event = {};
      break;
    }
    case 'MIND_CONTROL': {
      target.effects.mindControlledBy = attacker.playerId;
      target.effects.mindControlUntil = expiresAt;
      target.stats.timesMindControlled += 1;
      event = {};
      break;
    }
    case 'DANCE_CURSE': {
      target.effects.danceUntil = expiresAt;
      attacker.stats.danceCursesUsed += 1;
      if (target.hasDuck) {
        room.dropDuck(target, 'DANCE_CURSE');
      }
      event = {};
      break;
    }
    case 'SPEED_BOOST': {
      attacker.effects.boostUntil = expiresAt;
      event = {};
      break;
    }
    default:
      return null;
  }

  attacker.inventory.splice(index, 1);

  return Object.assign(
    {
      type: powerId,
      label: power.label,
      color: power.color,
      fromId: attacker.playerId,
      fromName: attacker.name,
      fromSlot: attacker.slot,
      toId: target ? target.playerId : null,
      toName: target ? target.name : null,
      toSlot: target ? target.slot : null,
      startedAt: now,
      expiresAt: expiresAt,
      durationMs: power.durationMs
    },
    event
  );
}

/** Clears expired key locks / steals and expired effects. */
function tickEffects(room, now) {
  const restored = [];
  room.players.forEach(function (player) {
    MOVEMENT_KEYS.forEach(function (key) {
      const state = player.keyState[key];
      if (state.status !== 'ok' && state.untilTs <= now) {
        player.keyState[key] = { status: 'ok', untilTs: 0, byPlayerId: null };
        restored.push({ playerId: player.playerId, key: key });
      }
    });
    const effects = player.effects;
    if (effects.mindControlledBy && effects.mindControlUntil <= now) {
      effects.mindControlledBy = null;
      effects.mindControlUntil = 0;
    }
    if (effects.swapWith && effects.swapUntil <= now) {
      effects.swapWith = null;
      effects.swapUntil = 0;
    }
  });
  return restored;
}

module.exports = { activate, tickEffects, pickTarget };
