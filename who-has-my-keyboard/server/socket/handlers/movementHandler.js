'use strict';

const gameManager = require('../../game/gameManager');

const KEYS = ['W', 'A', 'S', 'D', 'SPACE'];

function resolvePlayer(socket) {
  const room = gameManager.getRoom(socket.roomId);
  if (!room || !socket.playerId) {
    return {};
  }
  return { room: room, player: room.players.get(socket.playerId) };
}

module.exports = function movementHandler(io, socket) {
  /** Full input snapshot, sent by the PC client on every change. */
  socket.on('player:input', function (payload) {
    const { player } = resolvePlayer(socket);
    if (!player || !payload) {
      return;
    }
    KEYS.forEach(function (key) {
      player.input[key] = Boolean(payload[key]);
    });
  });

  /** Single key edge, used by the mobile controller buttons. */
  socket.on('player:move', function (payload) {
    const { player } = resolvePlayer(socket);
    if (!player || !payload) {
      return;
    }
    const key = String(payload.key || '').toUpperCase();
    if (KEYS.indexOf(key) === -1) {
      return;
    }
    player.input[key] = Boolean(payload.pressed);
  });
};
