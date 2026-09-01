'use strict';

const gameManager = require('../../game/gameManager');

module.exports = function gameHandler(io, socket, ctx) {
  socket.on('game:start', function (payload) {
    const room = gameManager.getRoom(socket.roomId);
    if (!room || socket.isController) {
      return;
    }
    if (room.hostId && room.hostId !== socket.playerId) {
      socket.emit('room:error', { message: 'Only the host can start the match.' });
      return;
    }
    if (payload && payload.fillWithBots) {
      room.fillWithBots(4);
    }
    room.startCountdown();
    ctx.broadcastRoom(room);
  });

  socket.on('game:restart', function () {
    const room = gameManager.getRoom(socket.roomId);
    if (!room || socket.isController) {
      return;
    }
    room.resetToLobby();
    ctx.broadcastRoom(room);
  });

  socket.on('game:sync', function () {
    const room = gameManager.getRoom(socket.roomId);
    if (room) {
      socket.emit('room:state', room.serialize());
    }
  });
};
