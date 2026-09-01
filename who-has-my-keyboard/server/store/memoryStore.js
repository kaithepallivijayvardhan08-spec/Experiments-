'use strict';

/**
 * Tiny in-memory stand-in for the MongoDB collections described in the design
 * doc (users / matches / statistics). Swapping this for Mongoose models later
 * only requires re-implementing these functions.
 */
const users = new Map();
const matches = [];

function createUser(username, password) {
  const key = username.toLowerCase();
  if (users.has(key)) {
    return null;
  }
  const user = {
    userId: 'u' + Math.random().toString(36).slice(2, 10),
    username: username,
    password: password,
    xp: 0,
    level: 1,
    totalWins: 0,
    totalGames: 0,
    selectedCharacter: 'blue',
    statistics: {
      ducksCaptured: 0,
      keysStolen: 0,
      timesMindControlled: 0,
      danceCursesUsed: 0,
      wallHits: 0,
      ducksDropped: 0
    }
  };
  users.set(key, user);
  return user;
}

function findUser(username) {
  return users.get(String(username || '').toLowerCase()) || null;
}

function publicUser(user) {
  if (!user) {
    return null;
  }
  const copy = Object.assign({}, user);
  delete copy.password;
  return copy;
}

function recordMatch(match) {
  matches.unshift(Object.assign({ finishedAt: new Date().toISOString() }, match));
  if (matches.length > 100) {
    matches.pop();
  }
  (match.players || []).forEach(function (entry) {
    const user = findUser(entry.name);
    if (!user) {
      return;
    }
    user.totalGames += 1;
    user.xp += entry.xp || 0;
    user.level = 1 + Math.floor(user.xp / 500);
    if (match.winner && match.winner.name === entry.name) {
      user.totalWins += 1;
    }
    Object.keys(user.statistics).forEach(function (statKey) {
      if (entry.stats && typeof entry.stats[statKey] === 'number') {
        user.statistics[statKey] += entry.stats[statKey];
      }
    });
  });
}

function leaderboard() {
  return Array.from(users.values())
    .map(publicUser)
    .sort(function (a, b) {
      return b.xp - a.xp || b.totalWins - a.totalWins;
    })
    .slice(0, 25);
}

module.exports = { createUser, findUser, publicUser, recordMatch, leaderboard, matches };
